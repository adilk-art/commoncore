const filterBtn = document.getElementById("filterBtn");
const sortBtn = document.getElementById("sortBtn");
const filterPanel = document.getElementById("filterPanel");
const sortPanel = document.getElementById("sortPanel");
const panelsRow = document.getElementById("panelsRow");
const searchInput = document.getElementById("searchInput");

function updatePanels() {
  if (!panelsRow) return;

  const openCount = [filterPanel, sortPanel].filter(
    (panel) => panel && !panel.hidden,
  ).length;

  panelsRow.dataset.open = openCount;
  panelsRow.classList.toggle("panels-row--visible", openCount > 0);
}

function togglePanel(panel, button) {
  if (!panel || !button) return;

  const isOpen = !panel.hidden;

  panel.hidden = isOpen;
  button.classList.toggle("trigger-btn--active", !isOpen);
  button.setAttribute("aria-expanded", String(!isOpen));

  updatePanels();
}

filterBtn?.addEventListener("click", () => {
  togglePanel(filterPanel, filterBtn);
});

sortBtn?.addEventListener("click", () => {
  togglePanel(sortPanel, sortBtn);
});

document.querySelectorAll(".sort-option").forEach((button) => {
  button.addEventListener("click", function () {
    const sortInput = document.getElementById("sortInput");
    const sortForm = document.getElementById("sortForm");

    if (!sortInput || !sortForm) return;

    sortInput.value = this.dataset.val || "";
    sortForm.submit();
  });
});

document
  .querySelectorAll('#filterPanel input[type="radio"]')
  .forEach((radio) => {
    radio.addEventListener("change", function () {
      this.closest("form")?.submit();
    });
  });

searchInput?.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    this.value = "";
  }
});

updatePanels();

document.querySelectorAll(".wish-form").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const productId = new FormData(form).get("productId");
    const button = form.querySelector(".wish-btn");
    const svg = button?.querySelector("svg");

    if (!productId || !button || !svg) return;

    try {
      button.disabled = true;

      const isWishlisted = button.classList.contains("wish-btn--active");

      const response = isWishlisted
        ? await axios.delete(`/user/wishlist/${productId}`, {
            headers: {
              "X-Requested-With": "XMLHttpRequest",
            },
          })
        : await axios.post(
            "/user/wishlist/add",
            { productId },
            {
              headers: {
                "X-Requested-With": "XMLHttpRequest",
              },
            },
          );

      button.classList.toggle("wish-btn--active", !isWishlisted);
      svg.setAttribute("fill", isWishlisted ? "none" : "currentColor");

      const wishlistCount = document.getElementById("wishlistCount");

      if (wishlistCount && response.data.wishlistCount !== undefined) {
        wishlistCount.textContent = response.data.wishlistCount;
      }

      userToast(response.data.message || "Wishlist updated");
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;

      if (status === 401) {
        userToast(message || "Please login first");
        return;
      }

      userToast(message || "Failed to update wishlist");
    } finally {
      button.disabled = false;
    }
  });
});

const cartModal = document.getElementById("cartVariantModal");
const closeCartModalBtn = document.getElementById("closeCartVariantModal");
const confirmCartBtn = document.getElementById("confirmCartVariant");
const colorList = document.getElementById("variantColorList");
const sizeList = document.getElementById("variantSizeList");
const previewImage = document.getElementById("variantPreviewImage");
const previewPrice = document.getElementById("variantPreviewPrice");
const previewName = document.getElementById("variantProductName");
const stockText = document.getElementById("variantStockText");
const cartError = document.getElementById("cartVariantError");
const offerPills = document.getElementById("variantOfferPills");
const discountPill = document.getElementById("variantDiscountPill");
const offerNamePill = document.getElementById("variantOfferNamePill");
const originalPrice = document.getElementById("variantOriginalPrice");

let allVariants = [];
let selectedColor = null;
let selectedVariant = null;
let selectedProductPricing = null;

function formatPrice(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function showSelectedProductPricing() {
  if (!selectedProductPricing) return;

  const {
    productName,
    originalPrice: regularPrice,
    finalPrice,
    hasOffer,
    discountType,
    discountValue,
    offerTitle,
  } = selectedProductPricing;

  if (previewName) {
    previewName.textContent = productName || "Product";
  }

  if (previewPrice) {
    previewPrice.textContent = formatPrice(finalPrice);
  }

  if (hasOffer) {
    if (originalPrice) {
      originalPrice.hidden = false;
      originalPrice.textContent = `₹${formatPrice(regularPrice)}`;
    }

    if (offerPills) {
      offerPills.hidden = false;
    }

    if (discountPill) {
      discountPill.textContent =
        discountType === "PERCENTAGE"
          ? `${Number(discountValue)}% OFF`
          : `₹${formatPrice(discountValue)} OFF`;
    }

    if (offerNamePill) {
      offerNamePill.textContent = offerTitle || "Offer applied";
    }

    return;
  }

  if (originalPrice) {
    originalPrice.hidden = true;
    originalPrice.textContent = "";
  }

  if (offerPills) {
    offerPills.hidden = true;
  }

  if (discountPill) {
    discountPill.textContent = "";
  }

  if (offerNamePill) {
    offerNamePill.textContent = "";
  }
}

document.querySelectorAll(".cart-form").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const productId = new FormData(form).get("productId");
    const cartButton = form.querySelector(".open-cart-modal");

    if (!productId || !cartButton) return;

    selectedProductPricing = {
      productName: cartButton.dataset.productName || "Product",
      originalPrice: Number(cartButton.dataset.originalPrice || 0),
      finalPrice: Number(cartButton.dataset.finalPrice || 0),
      hasOffer: cartButton.dataset.hasOffer === "true",
      discountType: cartButton.dataset.discountType || "",
      discountValue: Number(cartButton.dataset.discountValue || 0),
      offerTitle: cartButton.dataset.offerTitle || "",
    };

    showSelectedProductPricing();

    try {
      cartButton.disabled = true;

      const response = await axios.get(`/user/cart/variants/${productId}`);

      allVariants = response.data.variants || [];

      if (!allVariants.length) {
        userToast("No variants available");
        return;
      }

      renderColors();

      cartModal?.classList.add("active");
      document.body.style.overflow = "hidden";
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;

      selectedProductPricing = null;

      if (status === 401) {
        userToast(message || "Please login first");
        return;
      }

      userToast(message || "Failed to load variants");
    } finally {
      cartButton.disabled = false;
    }
  });
});

function renderColors() {
  if (!colorList) return;

  colorList.innerHTML = "";

  const uniqueColors = [];

  allVariants.forEach((variant) => {
    if (!variant.color?.name) return;

    const exists = uniqueColors.some(
      (color) => color.name === variant.color.name,
    );

    if (!exists) {
      uniqueColors.push(variant.color);
    }
  });

  uniqueColors.forEach((color) => {
    const button = document.createElement("button");

    button.className = "variant-color";
    button.type = "button";
    button.style.background = color.code || "#ffffff";
    button.title = color.name;

    button.addEventListener("click", () => {
      colorList.querySelectorAll(".variant-color").forEach((element) => {
        element.classList.remove("active");
      });

      button.classList.add("active");
      selectedColor = color.name;
      selectedVariant = null;

      renderSizes();
    });

    colorList.appendChild(button);
  });

  colorList.querySelector(".variant-color")?.click();
}

function renderSizes() {
  if (!sizeList) return;

  sizeList.innerHTML = "";

  const filteredVariants = allVariants.filter(
    (variant) => variant.color?.name === selectedColor,
  );

  filteredVariants.forEach((variant) => {
    const button = document.createElement("button");

    button.className = "variant-size";
    button.type = "button";
    button.textContent = variant.size;

    if (Number(variant.stock) <= 0) {
      button.classList.add("disabled");
      button.disabled = true;
    }

    button.addEventListener("click", () => {
      sizeList.querySelectorAll(".variant-size").forEach((element) => {
        element.classList.remove("active");
      });

      button.classList.add("active");
      selectedVariant = variant;

      updatePreview();
    });

    sizeList.appendChild(button);
  });

  const firstAvailableSize = sizeList.querySelector(
    ".variant-size:not(:disabled)",
  );

  if (firstAvailableSize) {
    firstAvailableSize.click();
  } else {
    selectedVariant = filteredVariants[0] || null;
    updatePreview();
  }
}

function updatePreview() {
  if (!selectedVariant) return;

  if (previewImage) {
    previewImage.src =
      selectedVariant.images?.[0]?.url || "/images/no-image.png";
  }

  showSelectedProductPricing();

  const stock = Number(selectedVariant.stock) || 0;

  if (stockText) {
    stockText.style.display = "block";

    if (stock <= 0) {
      stockText.textContent = "Out of stock";
    } else if (stock <= 10) {
      stockText.textContent = `Only ${stock} item${stock === 1 ? "" : "s"} left`;
    } else {
      stockText.textContent = "In stock";
    }
  }

  if (confirmCartBtn) {
    confirmCartBtn.disabled = stock <= 0;
  }
}

confirmCartBtn?.addEventListener("click", async () => {
  if (!selectedVariant) {
    if (cartError) {
      cartError.textContent = "Please select a variant";
    }

    return;
  }

  if (confirmCartBtn.disabled) return;

  const originalContent = confirmCartBtn.innerHTML;

  try {
    if (cartError) {
      cartError.textContent = "";
    }

    confirmCartBtn.disabled = true;
    confirmCartBtn.innerHTML = `
      <span class="btn-loader"></span>
      <span>Adding...</span>
    `;

    const response = await axios.post("/user/cart/add", {
      variantId: selectedVariant._id,
      quantity: 1,
    });

    const cartCount = document.getElementById("cartCount");

    if (cartCount && response.data.cartCount !== undefined) {
      cartCount.textContent = response.data.cartCount;
    }

    userToast(response.data.message || "Added to cart");
    closeCartModal();
  } catch (error) {
    if (cartError) {
      cartError.textContent =
        error?.response?.data?.message || "Failed to add to cart";
    }

    confirmCartBtn.disabled = Number(selectedVariant?.stock) <= 0;
  } finally {
    if (confirmCartBtn) {
      confirmCartBtn.innerHTML = originalContent;

      if (selectedVariant) {
        confirmCartBtn.disabled = Number(selectedVariant.stock) <= 0;
      }
    }
  }
});

function closeCartModal() {
  cartModal?.classList.remove("active");
  document.body.style.overflow = "";

  allVariants = [];
  selectedColor = null;
  selectedVariant = null;
  selectedProductPricing = null;

  if (colorList) {
    colorList.innerHTML = "";
  }

  if (sizeList) {
    sizeList.innerHTML = "";
  }

  if (cartError) {
    cartError.textContent = "";
  }

  if (stockText) {
    stockText.textContent = "";
    stockText.style.display = "none";
  }

  if (previewImage) {
    previewImage.src = "";
  }

  if (previewPrice) {
    previewPrice.textContent = "0";
  }

  if (previewName) {
    previewName.textContent = "Product Name";
  }

  if (originalPrice) {
    originalPrice.hidden = true;
    originalPrice.textContent = "";
  }

  if (offerPills) {
    offerPills.hidden = true;
  }

  if (discountPill) {
    discountPill.textContent = "";
  }

  if (offerNamePill) {
    offerNamePill.textContent = "";
  }

  if (confirmCartBtn) {
    confirmCartBtn.disabled = false;
  }
}

closeCartModalBtn?.addEventListener("click", closeCartModal);

cartModal?.addEventListener("click", (event) => {
  if (event.target === cartModal) {
    closeCartModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cartModal?.classList.contains("active")) {
    closeCartModal();
  }
});
