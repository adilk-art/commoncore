const moveButtons = document.querySelectorAll(".move-cart");
const removeButtons = document.querySelectorAll(".remove-wishlist");
const addAllBtn = document.getElementById("addAllBtn");
const modal = document.getElementById("variantModal");
const variantOptions = document.getElementById("variantOptions");
const confirmBtn = document.getElementById("confirmVariantBtn");
const closeBtn = document.getElementById("closeVariantModal");
const modalError = document.getElementById("variantModalError");
let selectedProduct = null;
let selectedVariant = null;
let pendingSelections = [];
let currentSelectionIndex = 0;

const showModalError = (message) => {
  if (!modalError) return;
  modalError.textContent = message;
  modalError.classList.add("active");
};

const clearModalError = () => {
  if (!modalError) return;
  modalError.textContent = "";
  modalError.classList.remove("active");
};

const openModal = () => {
  clearModalError();
  modal.classList.add("active");
};

const closeModal = () => {
  clearModalError();
  modal.classList.remove("active");
};

closeBtn?.addEventListener("click", closeModal);
const openSelectionModal = () => {
  const current = pendingSelections[currentSelectionIndex];
  if (!current) {
    pendingSelections = [];
    currentSelectionIndex = 0;
    closeModal();
    location.reload();
    return;
  }

  selectedProduct = current.productId;
  renderVariants(current.variants);
  openModal();
};

const renderVariants = (variants) => {
  variantOptions.innerHTML = "";
  const grouped = {};
  variants.forEach((variant) => {
    const colorName = variant.color.name;
    if (!grouped[colorName]) {
      grouped[colorName] = {
        color: variant.color,
        image: variant.images?.[0]?.url || "/images/no-image.png",
        variants: [],
      };
    }
    grouped[colorName].variants.push(variant);
  });

  const colors = Object.values(grouped);
  let selectedColor = colors[0];
  let selectedSize = selectedColor?.variants?.[0]?.size || "";
  const preview = document.createElement("div");
  preview.className = "variant-preview";
  const details = document.createElement("div");
  details.className = "variant-details";

  const getVariant = () => {
    let variant = selectedColor.variants.find((v) => v.size === selectedSize);

    if (!variant) {
      variant = selectedColor.variants[0];
    }
    return variant;
  };

  const colorWrap = document.createElement("div");
  colorWrap.className = "variant-color-wrap";
  const colorTitle = document.createElement("p");
  colorTitle.className = "variant-section-title";
  colorTitle.textContent = "COLOR";
  colorWrap.appendChild(colorTitle);
  const colorList = document.createElement("div");
  colorList.className = "variant-color-list";

  colors.forEach((colorObj, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "variant-color-btn";
    if (index === 0) {
      btn.classList.add("active");
    }

    btn.style.background = colorObj.color.code;
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".variant-color-btn")
        .forEach((el) => el.classList.remove("active"));

      btn.classList.add("active");
      selectedColor = colorObj;
      selectedSize = colorObj.variants?.[0]?.size || "";
      updatePreview();
      renderSizes();
    });

    colorList.appendChild(btn);
  });

  colorWrap.appendChild(colorList);
  const sizeWrap = document.createElement("div");
  sizeWrap.className = "variant-size-wrap";
  const sizeTitle = document.createElement("p");
  sizeTitle.className = "variant-section-title";
  sizeTitle.textContent = "SIZE";
  sizeWrap.appendChild(sizeTitle);
  const sizeList = document.createElement("div");
  sizeList.className = "variant-size-list";
  sizeWrap.appendChild(sizeList);
  const renderSizes = () => {
    sizeList.innerHTML = "";

    selectedColor.variants.forEach((variant) => {
      const btn = document.createElement("button");

      btn.type = "button";

      btn.className = "variant-size-btn";

      btn.textContent = variant.size;

      if (variant.size === selectedSize) {
        btn.classList.add("active");
      }

      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".variant-size-btn")
          .forEach((el) => el.classList.remove("active"));

        btn.classList.add("active");

        selectedSize = variant.size;

        updatePreview();
      });

      sizeList.appendChild(btn);
    });
  };

  const updateDetails = () => {
    const variant = getVariant();

    if (!variant) return;

    details.innerHTML = `
      <h3 class="variant-preview-name">
        ${variant.productId?.name || ""}
      </h3>

      <p class="variant-preview-category">
        ${variant.productId?.categoryId?.name || ""}
      </p>

      <p class="variant-preview-price">
        ₹${(variant?.price || 0).toLocaleString("en-IN")}
      </p>
    `;

    details.appendChild(colorWrap);

    details.appendChild(sizeWrap);

    details.appendChild(confirmBtn);
  };

  const updatePreview = () => {
    const variant = getVariant();

    if (!variant) return;

    selectedVariant = variant._id;

    preview.innerHTML = `
      <img
        src="${selectedColor.image}"
        class="variant-preview-image"
      >
    `;

    updateDetails();
  };

  updatePreview();

  renderSizes();

  variantOptions.appendChild(preview);

  variantOptions.appendChild(details);
};

const moveToCart = async () => {
  clearModalError();

  try {
    const { data } = await axios.post("/user/wishlist/move-to-cart", {
      productId: selectedProduct,
      variantId: selectedVariant,
    });

    if (!data.success) {
      showModalError(data.message);

      return false;
    }

    userToast(data.message || "Added to cart");

    if (pendingSelections.length === 0) {
      setTimeout(() => {
        location.reload();
      }, 400);
    }

    return true;
  } catch (error) {
    showModalError(error.response?.data?.message || "Something went wrong");

    return false;
  }
};

moveButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      selectedProduct = btn.dataset.id;

      const response = await fetch(
        `/user/wishlist/variants/${selectedProduct}`,
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      if (data.variants.length === 1) {
        selectedVariant = data.variants[0]._id;

        await moveToCart();

        return;
      }

      renderVariants(data.variants);

      openModal();
    } catch (error) {
      userToast(error.message);
    }
  });
});


confirmBtn?.addEventListener("click", async () => {
  const success = await moveToCart();

  if (!success) return;

  if (pendingSelections.length > 0) {
    currentSelectionIndex++;

    openSelectionModal();
  }
});

removeButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    await fetch(`/user/wishlist/${btn.dataset.id}`, {
      method: "DELETE",
    });

    userToast("Removed from wishlist");

    setTimeout(() => {
      location.reload();
    }, 300);
  });
});

addAllBtn?.addEventListener("click", async () => {
  try {
    const response = await fetch("/user/wishlist/add-all-to-cart", {
      method: "POST",
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    if (!data.requiresSelection || data.requiresSelection.length === 0) {
      userToast("Wishlist added to cart");

      return setTimeout(() => {
        location.reload();
      }, 400);
    }

    pendingSelections = data.requiresSelection;

    currentSelectionIndex = 0;

    openSelectionModal();
  } catch (error) {
    userToast(error.message);
  }
});
