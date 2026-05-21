/* ─────────────────────────────────────────────────
   product-detail.js
   Relies on window.__VARIANTS__ injected by EJS
───────────────────────────────────────────────── */

(function () {
  const variants = window.__VARIANTS__ || [];
  let selectedId = window.__SELECTED_ID__ || "";

  /* ── DOM refs ── */
  const mainImage = document.getElementById("mainImage");
  const zoomContainer = document.getElementById("zoomContainer");
  const thumbsCol = document.getElementById("thumbsCol");

  const colorLabel = document.getElementById("colorLabel");
  const sizeLabel = document.getElementById("sizeLabel");
  const sizesWrap = document.getElementById("sizesWrap");
  const displayPrice = document.getElementById("displayPrice");
  const stockRow = document.getElementById("stockRow");

  const qtyInput = document.getElementById("qtyInput");
  const plusBtn = document.getElementById("plusBtn");
  const minusBtn = document.getElementById("minusBtn");
  const errorBox = document.getElementById("errorBox");

  const cartVariantId = document.getElementById("cartVariantId");
  const cartQty = document.getElementById("cartQty");
  const cartBtn = document.getElementById("cartBtn");

  const buyVariantId = document.getElementById("buyVariantId");
  const buyQty = document.getElementById("buyQty");
  const buyBtn = document.getElementById("buyBtn");

  const MAX_QTY = 5;

  /* ── Helpers ── */

  function getVariant(id) {
    return variants.find((v) => String(v._id) === String(id)) || null;
  }

  function getSelectedVariant() {
    return getVariant(selectedId);
  }

  function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg;
    clearTimeout(errorBox._t);
    errorBox._t = setTimeout(() => {
      errorBox.textContent = "";
    }, 2500);
  }

  function fmt(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
  }

  /* ── Image helpers ── */

  function setMainImage(url) {
    if (!url || !mainImage) return;
    mainImage.src = url;
  }

  function buildThumbs(imageUrls) {
    if (!thumbsCol) return;
    thumbsCol.innerHTML = imageUrls
      .map(
        (url, i) => `
      <button type="button"
        class="pd-thumb ${i === 0 ? "pd-thumb--active" : ""}"
        data-image="${url}">
        <img src="${url}" alt="" />
      </button>`,
      )
      .join("");
    bindThumbs();
  }

  function bindThumbs() {
    thumbsCol.querySelectorAll(".pd-thumb").forEach((btn) => {
      btn.addEventListener("click", () => {
        thumbsCol
          .querySelectorAll(".pd-thumb")
          .forEach((b) => b.classList.remove("pd-thumb--active"));
        btn.classList.add("pd-thumb--active");
        setMainImage(btn.dataset.image);
      });
    });
  }

  /* ── Zoom ── */

  zoomContainer?.addEventListener("mousemove", (e) => {
    const r = zoomContainer.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    mainImage.style.transformOrigin = `${x}% ${y}%`;
  });

  zoomContainer?.addEventListener("mouseleave", () => {
    mainImage.style.transformOrigin = "center center";
  });

  /* ── Quantity ── */

  function syncQty() {
    let v = parseInt(qtyInput.value, 10);
    if (isNaN(v) || v < 1) v = 1;
    if (v > MAX_QTY) {
      v = MAX_QTY;
      showError(`Max ${MAX_QTY} per order`);
    }

    const stock = getSelectedVariant()?.stock ?? 0;
    if (v > stock) {
      v = Math.max(1, stock);
      showError(`Only ${stock} in stock`);
    }

    qtyInput.value = v;
    if (cartQty) cartQty.value = v;
    if (buyQty) buyQty.value = v;

    minusBtn.disabled = v <= 1;
    plusBtn.disabled = v >= Math.min(MAX_QTY, stock);
  }

  plusBtn?.addEventListener("click", () => {
    const stock = getSelectedVariant()?.stock ?? 0;
    if (parseInt(qtyInput.value) >= Math.min(MAX_QTY, stock)) {
      showError(`Max ${MAX_QTY} per order`);
      return;
    }
    qtyInput.value = parseInt(qtyInput.value) + 1;
    syncQty();
  });

  minusBtn?.addEventListener("click", () => {
    if (parseInt(qtyInput.value) <= 1) return;
    qtyInput.value = parseInt(qtyInput.value) - 1;
    syncQty();
  });

  /* ── Apply a selected variant to the UI ── */

  function applyVariant(variant) {
    if (!variant) return;
    selectedId = String(variant._id);

    /* price */
    if (displayPrice) displayPrice.textContent = fmt(variant.price);

    /* stock badge */
    if (stockRow) {
      let html;
      if (variant.stock > 10) {
        html = `<span class="pd-stock pd-stock--green">In Stock</span>`;
      } else if (variant.stock > 0) {
        html = `<span class="pd-stock pd-stock--orange">Only ${variant.stock} left</span>`;
      } else {
        html = `<span class="pd-stock pd-stock--red">Out of Stock</span>`;
      }
      stockRow.innerHTML = html;
    }

    /* images */
    if (variant.images && variant.images.length) {
      buildThumbs(variant.images);
      setMainImage(variant.images[0]);
    }

    /* hidden inputs */
    if (cartVariantId) cartVariantId.value = variant._id;
    if (buyVariantId) buyVariantId.value = variant._id;

    /* buttons */
    const oos = variant.stock <= 0;
    if (cartBtn) cartBtn.disabled = oos;
    if (buyBtn) buyBtn.disabled = oos;

    /* reset qty */
    qtyInput.value = 1;
    syncQty();
  }

  /* ── Color selection ── */

  document.querySelectorAll(".pd-color").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.dataset.colorCode;
      const name = btn.dataset.colorName;

      /* update active color button */
      document
        .querySelectorAll(".pd-color")
        .forEach((b) => b.classList.remove("pd-color--active"));
      btn.classList.add("pd-color--active");

      /* update label */
      if (colorLabel) colorLabel.textContent = name;

      /* rebuild size buttons for this color */
      const colorVariants = variants.filter((v) => v.colorCode === code);
      buildSizes(colorVariants);

      /* auto-select first available size */
      const first = colorVariants.find((v) => v.stock > 0) || colorVariants[0];
      if (first) applyVariant(first);
    });
  });

  /* ── Size buttons builder ── */

  function buildSizes(colorVariants) {
    if (!sizesWrap) return;
    sizesWrap.innerHTML = colorVariants
      .map(
        (v) => `
      <button type="button"
        class="pd-size ${String(v._id) === selectedId ? "pd-size--active" : ""} ${v.stock <= 0 ? "pd-size--disabled" : ""}"
        data-variant-id="${v._id}">
        ${v.size}
      </button>`,
      )
      .join("");
    bindSizes();
  }

  function bindSizes() {
    sizesWrap.querySelectorAll(".pd-size").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("pd-size--disabled")) return;
        sizesWrap
          .querySelectorAll(".pd-size")
          .forEach((b) => b.classList.remove("pd-size--active"));
        btn.classList.add("pd-size--active");

        const v = getVariant(btn.dataset.variantId);
        if (sizeLabel) sizeLabel.textContent = v?.size || "";
        applyVariant(v);
      });
    });
  }

  /* ── Initial size bind (rendered by EJS) ── */
  bindSizes();
  bindThumbs();
  syncQty();

  /* ─────────────────────────────────────────────────
   Add To Cart
───────────────────────────────────────────────── */

  const cartForm = document.getElementById("cartForm");

  cartForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const variantId = cartVariantId.value;
      const quantity = Number(cartQty.value);

      cartBtn.disabled = true;

      const originalText = cartBtn.textContent;
      cartBtn.textContent = "Adding...";


      const response = await axios.post("/user/cart/add", {
        variantId,
        quantity,
      });


      if (response.data.success) {


        if (errorBox) {
          errorBox.textContent = "";
        }


        if (window.userToast) {
          userToast(response.data.message);
        }


        cartBtn.textContent = "Added ✓";

        setTimeout(() => {
          cartBtn.textContent = originalText;
          cartBtn.disabled = false;
        }, 1200);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to add to cart";


      if (errorBox) {
        errorBox.textContent = message;
      }

      cartBtn.disabled = false;
      cartBtn.textContent = "Add to Cart";
    }
  });

  /* ── Wishlist buttons on related cards (prevent link nav) ── */
  document.querySelectorAll(".pd-related-wish").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const card = btn.closest(".pd-related-card");
      const href = card?.getAttribute("href");
      const id = href?.split("/").pop();
      if (!id) return;
      fetch("/user/wishlist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      })
        .then(() => {
          btn.style.color = "#dc2626";
        })
        .catch(console.error);
    });
  });
})();
