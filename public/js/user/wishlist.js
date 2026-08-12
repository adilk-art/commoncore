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
  modal?.classList.add("active");
};

const closeModal = () => {
  clearModalError();

  modal?.classList.remove("active");

  selectedProduct = null;
  selectedVariant = null;
};

closeBtn?.addEventListener("click", closeModal);

modal?.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal?.classList.contains("active")) {
    closeModal();
  }
});

const getFirstAvailableVariant = (colorObj) => {
  return colorObj?.variants?.find(
    (variant) => variant.isActive !== false && Number(variant.stock || 0) > 0,
  );
};

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
  if (!variantOptions) return;

  variantOptions.innerHTML = "";

  clearModalError();

  selectedVariant = null;

  if (!Array.isArray(variants) || variants.length === 0) {
    showModalError("No variants available for this product.");

    return;
  }

  const grouped = {};

  variants.forEach((variant) => {
    const colorName = variant.color?.name || "Default";

    if (!grouped[colorName]) {
      grouped[colorName] = {
        color: variant.color || {
          name: "Default",
          code: "#d1d5db",
        },

        image: variant.images?.[0]?.url || "/images/no-image.png",

        variants: [],
      };
    }

    grouped[colorName].variants.push(variant);
  });

  const colors = Object.values(grouped);

  if (colors.length === 0) {
    showModalError("No variants available for this product.");

    return;
  }

  let selectedColor =
    colors.find((colorObj) => Boolean(getFirstAvailableVariant(colorObj))) ||
    colors[0];

  let selectedSize = getFirstAvailableVariant(selectedColor)?.size || "";

  const preview = document.createElement("div");

  preview.className = "variant-preview";

  const details = document.createElement("div");

  details.className = "variant-details";

  const getVariant = () => {
    if (!selectedColor || !selectedSize) {
      return null;
    }

    return (
      selectedColor.variants.find((variant) => variant.size === selectedSize) ||
      null
    );
  };

  const colorWrap = document.createElement("div");

  colorWrap.className = "variant-color-wrap";

  const colorTitle = document.createElement("p");

  colorTitle.className = "variant-section-title";

  colorTitle.textContent = "COLOR";

  colorWrap.appendChild(colorTitle);

  const colorList = document.createElement("div");

  colorList.className = "variant-color-list";

  colors.forEach((colorObj) => {
    const btn = document.createElement("button");

    btn.type = "button";

    btn.className = "variant-color-btn";

    btn.title = colorObj.color?.name || "";

    btn.style.background = colorObj.color?.code || "#d1d5db";

    const firstAvailable = getFirstAvailableVariant(colorObj);

    if (!firstAvailable) {
      btn.disabled = true;
      btn.style.opacity = "0.35";
      btn.style.cursor = "not-allowed";
    }

    if (colorObj === selectedColor) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", () => {
      if (!firstAvailable) {
        return;
      }

      colorList
        .querySelectorAll(".variant-color-btn")
        .forEach((element) => element.classList.remove("active"));

      btn.classList.add("active");

      selectedColor = colorObj;

      selectedSize = firstAvailable.size;

      renderSizes();
      updatePreview();
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

    if (!selectedColor) {
      return;
    }

    selectedColor.variants.forEach((variant) => {
      const btn = document.createElement("button");

      btn.type = "button";

      btn.className = "variant-size-btn";

      btn.textContent = variant.size;

      const unavailable =
        variant.isActive === false || Number(variant.stock || 0) <= 0;

      if (unavailable) {
        btn.disabled = true;
      }

      if (variant.size === selectedSize && !unavailable) {
        btn.classList.add("active");
      }

      btn.addEventListener("click", () => {
        if (unavailable) {
          return;
        }

        sizeList
          .querySelectorAll(".variant-size-btn")
          .forEach((element) => element.classList.remove("active"));

        btn.classList.add("active");

        selectedSize = variant.size;

        updatePreview();
      });

      sizeList.appendChild(btn);
    });
  };

  const updateDetails = () => {
    const variant = getVariant();

    if (!variant) {
      selectedVariant = null;

      details.innerHTML = `
        <p class="variant-preview-category">
          No available variant selected.
        </p>
      `;

      details.appendChild(colorWrap);

      details.appendChild(sizeWrap);

      details.appendChild(confirmBtn);

      if (confirmBtn) {
        confirmBtn.disabled = true;
      }

      return;
    }

    const originalPrice = Number(variant.originalPrice ?? variant.price ?? 0);

    const finalPrice = Number(variant.finalPrice ?? variant.price ?? 0);

    const hasOffer = Boolean(variant.hasOffer && finalPrice < originalPrice);

    let offerBadge = "";

    if (hasOffer) {
      if (variant.discountType === "PERCENTAGE") {
        offerBadge = `
          <span class="variant-offer-badge">
            ${Number(variant.discountValue || 0)}% OFF
          </span>
        `;
      } else if (variant.discountType === "FLAT") {
        offerBadge = `
          <span class="variant-offer-badge">
            ₹${Number(variant.discountValue || 0).toLocaleString("en-IN")} OFF
          </span>
        `;
      }
    }

    details.innerHTML = `
      <h3 class="variant-preview-name">
        ${variant.productId?.name || ""}
      </h3>

      <p class="variant-preview-category">
        ${variant.productId?.categoryId?.name || ""}
      </p>

      <div class="variant-preview-price-row">

        <span class="variant-preview-price">
          ₹${finalPrice.toLocaleString("en-IN")}
        </span>

        ${
          hasOffer
            ? `
              <span class="variant-preview-old-price">
                ₹${originalPrice.toLocaleString("en-IN")}
              </span>

              ${offerBadge}
            `
            : ""
        }

      </div>

      ${
        hasOffer && variant.offerTitle
          ? `
            <p class="variant-preview-offer-name">
              ${variant.offerTitle}
            </p>
          `
          : ""
      }
    `;

    details.appendChild(colorWrap);

    details.appendChild(sizeWrap);

    details.appendChild(confirmBtn);

    if (confirmBtn) {
      confirmBtn.disabled = false;
    }
  };

  const updatePreview = () => {
    const variant = getVariant();

    if (!variant) {
      selectedVariant = null;

      preview.innerHTML = `
        <img
          src="${selectedColor?.image || "/images/no-image.png"}"
          class="variant-preview-image"
          alt="Product"
        >
      `;

      updateDetails();

      return;
    }

    selectedVariant = variant._id;

    const image =
      variant.images?.[0]?.url ||
      selectedColor?.image ||
      "/images/no-image.png";

    preview.innerHTML = `
      <img
        src="${image}"
        class="variant-preview-image"
        alt="${variant.productId?.name || "Product"}"
      >
    `;

    updateDetails();
  };

  renderSizes();
  updatePreview();

  variantOptions.appendChild(preview);

  variantOptions.appendChild(details);
};

const moveToCart = async () => {
  clearModalError();

  if (!selectedProduct || !selectedVariant) {
    showModalError("Please select an available variant.");

    return false;
  }

  try {
    if (confirmBtn) {
      confirmBtn.disabled = true;

      confirmBtn.textContent = "Adding...";
    }

    const { data } = await axios.post("/user/wishlist/move-to-cart", {
      productId: selectedProduct,

      variantId: selectedVariant,
    });

    if (!data.success) {
      showModalError(data.message || "Unable to add item to cart.");

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
    showModalError(error?.response?.data?.message || "Something went wrong");

    return false;
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;

      confirmBtn.textContent = "Add to Cart";
    }
  }
};

moveButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      selectedProduct = btn.dataset.id;

      selectedVariant = null;

      const response = await fetch(
        `/user/wishlist/variants/${selectedProduct}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load variants");
      }

      if (!data.success) {
        throw new Error(data.message || "Unable to load variants");
      }

      const variants = Array.isArray(data.variants) ? data.variants : [];

      const availableVariants = variants.filter(
        (variant) =>
          variant.isActive !== false && Number(variant.stock || 0) > 0,
      );

      if (availableVariants.length === 0) {
        throw new Error("No available variants for this product.");
      }

      if (availableVariants.length === 1) {
        selectedVariant = availableVariants[0]._id;

        await moveToCart();

        return;
      }

      renderVariants(variants);

      openModal();
    } catch (error) {
      userToast(error.message || "Something went wrong");
    }
  });
});

confirmBtn?.addEventListener("click", async () => {
  const success = await moveToCart();

  if (!success) {
    return;
  }

  if (pendingSelections.length > 0) {
    currentSelectionIndex++;

    openSelectionModal();
  }
});

removeButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      btn.disabled = true;

      const response = await fetch(`/user/wishlist/${btn.dataset.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to remove item");
      }

      userToast(data.message || "Removed from wishlist");

      setTimeout(() => {
        location.reload();
      }, 300);
    } catch (error) {
      btn.disabled = false;

      userToast(error.message || "Something went wrong");
    }
  });
});

addAllBtn?.addEventListener("click", async () => {
  try {
    addAllBtn.disabled = true;

    addAllBtn.textContent = "Adding...";

    const response = await fetch("/user/wishlist/add-all-to-cart", {
      method: "POST",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to add wishlist to cart");
    }

    if (!data.success) {
      throw new Error(data.message || "Unable to add wishlist to cart");
    }

    if (!data.requiresSelection || data.requiresSelection.length === 0) {
      userToast(data.message || "Wishlist added to cart");

      setTimeout(() => {
        location.reload();
      }, 400);

      return;
    }

    pendingSelections = data.requiresSelection;

    currentSelectionIndex = 0;

    openSelectionModal();
  } catch (error) {
    userToast(error.message || "Something went wrong");

    addAllBtn.disabled = false;

    addAllBtn.textContent = "Add All to Cart";
  }
});
