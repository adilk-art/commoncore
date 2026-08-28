
(function () {
  const variants = window.__VARIANTS__ || [];
  let selectedId = window.__SELECTED_ID__ || "";
  const isUnavailable = window.__IS_UNAVAILABLE__ || false;

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

  const cartForm = document.getElementById("cartForm");
  const cartVariantId = document.getElementById("cartVariantId");
  const cartQty = document.getElementById("cartQty");
  const cartBtn = document.getElementById("cartBtn");

  const buyForm = document.getElementById("buyForm");
  const buyVariantId = document.getElementById("buyVariantId");
  const buyQty = document.getElementById("buyQty");
  const buyBtn = document.getElementById("buyBtn");

  const MAX_QTY = 5;

  function getVariant(id) {
    return (
      variants.find((variant) => String(variant._id) === String(id)) || null
    );
  }

  function getSelectedVariant() {
    return getVariant(selectedId);
  }

  function fmt(number) {
    return "₹" + Number(number).toLocaleString("en-IN");
  }

  function setMainImage(url) {
    if (!url || !mainImage) return;

    mainImage.src = url;
  }

  function buildThumbs(imageUrls) {
    if (!thumbsCol) return;

    thumbsCol.innerHTML = imageUrls
      .map(
        (url, index) => `
          <button
            type="button"
            class="pd-thumb ${index === 0 ? "pd-thumb--active" : ""}"
            data-image="${url}"
          >
            <img src="${url}" alt="" />
          </button>
        `,
      )
      .join("");

    bindThumbs();
  }

  function bindThumbs() {
    if (!thumbsCol) return;

    thumbsCol.querySelectorAll(".pd-thumb").forEach((button) => {
      button.addEventListener("click", () => {
        thumbsCol.querySelectorAll(".pd-thumb").forEach((item) => {
          item.classList.remove("pd-thumb--active");
        });

        button.classList.add("pd-thumb--active");

        setMainImage(button.dataset.image);
      });
    });
  }

  zoomContainer?.addEventListener("mousemove", (event) => {
    const rect = zoomContainer.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    mainImage.style.transformOrigin = `${x}% ${y}%`;
  });

  zoomContainer?.addEventListener("mouseleave", () => {
    mainImage.style.transformOrigin = "center center";
  });

  function syncQty() {
    if (!qtyInput) return;

    const stock = getSelectedVariant()?.stock ?? 0;

    if (stock <= 0) {
      qtyInput.value = 1;

      if (cartQty) cartQty.value = 1;
      if (buyQty) buyQty.value = 1;

      if (minusBtn) minusBtn.disabled = true;
      if (plusBtn) plusBtn.disabled = true;

      return;
    }

    let quantity = parseInt(qtyInput.value, 10);

    if (isNaN(quantity) || quantity < 1) {
      quantity = 1;
    }

    if (quantity > MAX_QTY) {
      quantity = MAX_QTY;
    }

    if (quantity > stock) {
      quantity = stock;
    }

    qtyInput.value = quantity;

    if (cartQty) cartQty.value = quantity;
    if (buyQty) buyQty.value = quantity;

    if (minusBtn) {
      minusBtn.disabled = quantity <= 1;
    }

    if (plusBtn) {
      plusBtn.disabled = quantity >= Math.min(MAX_QTY, stock);
    }
  }

  plusBtn?.addEventListener("click", () => {
    const stock = getSelectedVariant()?.stock ?? 0;

    if (stock <= 0) {
      userToast("Out of stock");
      return;
    }

    if (parseInt(qtyInput.value, 10) >= Math.min(MAX_QTY, stock)) {
      return;
    }

    qtyInput.value = parseInt(qtyInput.value, 10) + 1;

    syncQty();
  });

  minusBtn?.addEventListener("click", () => {
    if (parseInt(qtyInput.value, 10) <= 1) {
      return;
    }

    qtyInput.value = parseInt(qtyInput.value, 10) - 1;

    syncQty();
  });

  function applyVariant(variant) {
    if (!variant) return;

    selectedId = String(variant._id);

    if (displayPrice) {
      displayPrice.textContent = fmt(variant.price);
    }

    if (stockRow) {
      let html;

      if (isUnavailable) {
        html = `
          <span class="pd-stock pd-stock--red">
            Product Unavailable
          </span>
        `;
      } else if (variant.stock > 10) {
        html = `
          <span class="pd-stock pd-stock--green">
            In Stock
          </span>
        `;
      } else if (variant.stock > 0) {
        html = `
          <span class="pd-stock pd-stock--orange">
            Only ${variant.stock} left
          </span>
        `;
      } else {
        html = `
          <span class="pd-stock pd-stock--red">
            Out of Stock
          </span>
        `;
      }

      stockRow.innerHTML = html;
    }

    if (variant.images && variant.images.length) {
      buildThumbs(variant.images);
      setMainImage(variant.images[0]);
    }

    if (cartVariantId) {
      cartVariantId.value = variant._id;
    }

    if (buyVariantId) {
      buyVariantId.value = variant._id;
    }

    const disabled = isUnavailable || variant.stock <= 0;

    if (cartBtn) {
      cartBtn.disabled = disabled;
    }

    if (buyBtn) {
      buyBtn.disabled = disabled;
    }

    if (qtyInput) {
      qtyInput.value = 1;
    }

    if (sizeLabel) {
      sizeLabel.textContent = variant.size;
    }

    syncQty();
  }

  document.querySelectorAll(".pd-color").forEach((button) => {
    button.addEventListener("click", () => {
      const code = button.dataset.colorCode;
      const name = button.dataset.colorName;

      document.querySelectorAll(".pd-color").forEach((item) => {
        item.classList.remove("pd-color--active");
      });

      button.classList.add("pd-color--active");

      if (colorLabel) {
        colorLabel.textContent = name;
      }

      const colorVariants = variants.filter(
        (variant) => variant.colorCode === code,
      );

      const first =
        colorVariants.find((variant) => variant.stock > 0) || colorVariants[0];

      if (!first) return;

      buildSizes(colorVariants, first._id);

      if (sizeLabel) {
        sizeLabel.textContent = first.size;
      }

      applyVariant(first);
    });
  });

  function buildSizes(colorVariants, selectedVariantId) {
    if (!sizesWrap) return;

    sizesWrap.innerHTML = colorVariants
      .map(
        (variant) => `
          <button
            type="button"
            class="pd-size ${
              String(variant._id) === String(selectedVariantId)
                ? "pd-size--active"
                : ""
            } ${variant.stock <= 0 ? "pd-size--disabled" : ""}"
            data-variant-id="${variant._id}"
          >
            ${variant.size}
          </button>
        `,
      )
      .join("");

    bindSizes();
  }

  function bindSizes() {
    if (!sizesWrap) return;

    sizesWrap.querySelectorAll(".pd-size").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.classList.contains("pd-size--disabled")) {
          return;
        }

        sizesWrap.querySelectorAll(".pd-size").forEach((item) => {
          item.classList.remove("pd-size--active");
        });

        button.classList.add("pd-size--active");

        const variant = getVariant(button.dataset.variantId);

        if (sizeLabel) {
          sizeLabel.textContent = variant?.size || "";
        }

        applyVariant(variant);
      });
    });
  }

  bindSizes();
  bindThumbs();
  syncQty();

  cartForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (cartBtn.disabled) return;

    const variant = getSelectedVariant();

    if (!variant || variant.stock <= 0) {
      userToast("Out of stock");
      return;
    }

    const originalText = cartBtn.textContent;

    try {
      const variantId = cartVariantId.value;
      const quantity = Number(cartQty.value);

      cartBtn.disabled = true;
      cartBtn.textContent = "Adding...";

      const response = await axios.post(
        "/user/cart/add",
        {
          variantId,
          quantity,
        },
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );

      if (response.data.success) {
        const cartBadge = document.querySelector(".cart-btn .cart-badge");

        if (cartBadge && response.data.cartCount !== undefined) {
          cartBadge.textContent = response.data.cartCount;
        }

        userToast(response.data.message || "Added to cart");

        cartBtn.textContent = "Added ✓";

        setTimeout(() => {
          cartBtn.textContent = originalText;
          cartBtn.disabled = false;
        }, 1200);
      }
    } catch (error) {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message || "Failed to add to cart";

      cartBtn.disabled = false;
      cartBtn.textContent = originalText;

      if (status === 401) {
        userToast(message || "Please login first");
        return;
      }

      userToast(message);
    }
  });

  const wishlistForm = document.querySelector(".wishlist-form");

  wishlistForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(wishlistForm);
    const productId = formData.get("productId");
    const button = wishlistForm.querySelector(".pd-wishlist-btn");

    if (!button) return;

    const svg = button.querySelector("svg");
    const isActive = button.classList.contains("pd-wishlist-btn--active");

    try {
      let response;

      button.disabled = true;

      if (isActive) {
        response = await axios.delete(`/user/wishlist/${productId}`, {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        });

        button.classList.remove("pd-wishlist-btn--active");
        svg?.setAttribute("fill", "none");
      } else {
        response = await axios.post(
          "/user/wishlist/add",
          {
            productId,
          },
          {
            headers: {
              "X-Requested-With": "XMLHttpRequest",
            },
          },
        );

        button.classList.add("pd-wishlist-btn--active");
        svg?.setAttribute("fill", "currentColor");
      }

      const wishlistCount = document.getElementById("wishlistCount");

      if (wishlistCount && response.data.wishlistCount !== undefined) {
        wishlistCount.textContent = response.data.wishlistCount;
      }

      userToast(response.data.message || "Wishlist updated");
    } catch (error) {
      const status = error?.response?.status;

      const message =
        error?.response?.data?.message || "Failed to update wishlist";

      if (status === 401) {
        userToast(message || "Please login first");
        return;
      }

      userToast(message);
    } finally {
      button.disabled = false;
    }
  });

  buyForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const variant = getSelectedVariant();

    if (!variant || variant.stock <= 0) {
      userToast("Out of stock");
      return;
    }

    const originalText = buyBtn.textContent;

    try {
      buyBtn.disabled = true;
      buyBtn.textContent = "Processing...";

      const response = await axios.post(
        "/user/checkout/buy-now",
        {
          variantId: buyVariantId.value,
          quantity: Number(buyQty.value),
        },
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );

      if (response.data.success) {
        window.location.href = "/user/checkout/buy-now";
      }
    } catch (error) {
      const status = error?.response?.status;

      const message =
        error?.response?.data?.message || "Something went wrong";

      buyBtn.disabled = false;
      buyBtn.textContent = originalText;

      if (status === 401) {
        userToast(message || "Please login first");
        return;
      }

      userToast(message);
    }
  });

  const relatedWishlistForms = document.querySelectorAll(
    ".related-wishlist-form",
  );

  relatedWishlistForms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const formData = new FormData(form);
      const productId = formData.get("productId");
      const button = form.querySelector(".pd-related-wish");

      if (!button) return;

      const svg = button.querySelector("svg");
      const isActive = button.classList.contains("pd-related-wish--active");

      try {
        let response;

        button.disabled = true;

        if (isActive) {
          response = await axios.delete(`/user/wishlist/${productId}`, {
            headers: {
              "X-Requested-With": "XMLHttpRequest",
            },
          });

          button.classList.remove("pd-related-wish--active");
          svg?.setAttribute("fill", "none");
        } else {
          response = await axios.post(
            "/user/wishlist/add",
            {
              productId,
            },
            {
              headers: {
                "X-Requested-With": "XMLHttpRequest",
              },
            },
          );

          button.classList.add("pd-related-wish--active");
          svg?.setAttribute("fill", "currentColor");
        }

        const wishlistCount = document.getElementById("wishlistCount");

        if (wishlistCount && response.data.wishlistCount !== undefined) {
          wishlistCount.textContent = response.data.wishlistCount;
        }

        userToast(response.data.message || "Wishlist updated");
      } catch (error) {
        const status = error?.response?.status;

        const message =
          error?.response?.data?.message || "Failed to update wishlist";

        if (status === 401) {
          userToast(message || "Please login first");
          return;
        }

        userToast(message);
      } finally {
        button.disabled = false;
      }
    });
  });

  const reviewModal = document.getElementById("reviewModal");
  const reviewForm = document.getElementById("reviewForm");
  const reviewRating = document.getElementById("reviewRating");
  const reviewComment = document.getElementById("reviewComment");
  const reviewSubmitBtn = document.getElementById("reviewSubmitBtn");
  const ratingError = document.getElementById("ratingError");
  const commentError = document.getElementById("commentError");
  const ratingStars = document.querySelectorAll(".pd-rating-star");
  const reviewCharacterCount = document.getElementById(
    "reviewCharacterCount",
  );

  function paintRating(value) {
    ratingStars.forEach((star) => {
      star.classList.toggle(
        "pd-rating-star--active",
        Number(star.dataset.rating) <= value,
      );
    });
  }

  function clearReviewErrors() {
    [ratingError, commentError].forEach((element) => {
      if (!element) return;

      element.textContent = "";
      element.classList.remove("pd-review-error--show");
    });

    reviewComment?.classList.remove("input-error");
  }

  function showReviewError(field, message) {
    const element = field === "rating" ? ratingError : commentError;

    if (element) {
      element.textContent = message;
      element.classList.add("pd-review-error--show");
    }

    if (field === "comment") {
      reviewComment?.classList.add("input-error");
    }
  }

  function resetReviewForm() {
    reviewForm?.reset();

    if (reviewRating) {
      reviewRating.value = "";
    }

    paintRating(0);
    clearReviewErrors();

    if (reviewCharacterCount) {
      reviewCharacterCount.textContent = "0 / 500";
    }
  }

  function openReviewModal() {
    if (!reviewModal) return;

    resetReviewForm();

    reviewModal.classList.add("pd-review-modal--open");
    reviewModal.setAttribute("aria-hidden", "false");

    document.body.classList.add("pd-modal-open");
  }

  function closeReviewModal() {
    if (!reviewModal) return;

    reviewModal.classList.remove("pd-review-modal--open");
    reviewModal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("pd-modal-open");

    resetReviewForm();
  }

  document
    .getElementById("writeReviewBtn")
    ?.addEventListener("click", openReviewModal);

  document
    .getElementById("writeReviewEmptyBtn")
    ?.addEventListener("click", openReviewModal);

  document
    .getElementById("reviewModalBackdrop")
    ?.addEventListener("click", closeReviewModal);

  document
    .getElementById("closeReviewModal")
    ?.addEventListener("click", closeReviewModal);

  document
    .getElementById("cancelReviewBtn")
    ?.addEventListener("click", closeReviewModal);

  ratingStars.forEach((star) => {
    star.addEventListener("click", () => {
      const value = Number(star.dataset.rating);

      if (reviewRating) {
        reviewRating.value = value;
      }

      paintRating(value);

      if (ratingError) {
        ratingError.textContent = "";
        ratingError.classList.remove("pd-review-error--show");
      }
    });
  });

  reviewComment?.addEventListener("input", () => {
    if (reviewCharacterCount) {
      reviewCharacterCount.textContent = `${reviewComment.value.length} / 500`;
    }

    reviewComment.classList.remove("input-error");

    if (commentError) {
      commentError.textContent = "";
      commentError.classList.remove("pd-review-error--show");
    }
  });

  reviewForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!reviewSubmitBtn || reviewSubmitBtn.disabled) {
      return;
    }

    clearReviewErrors();

    const productId = reviewForm.elements.productId.value;
    const rating = Number(reviewRating.value);
    const comment = reviewComment.value.trim();

    let valid = true;

    if (!rating || rating < 1 || rating > 5) {
      showReviewError("rating", "Please select a rating");
      valid = false;
    }

    if (!comment) {
      showReviewError("comment", "Review is required");
      valid = false;
    } else if (comment.length < 10) {
      showReviewError("comment", "Review must be at least 10 characters");
      valid = false;
    } else if (comment.length > 500) {
      showReviewError("comment", "Review cannot exceed 500 characters");
      valid = false;
    }

    if (!valid) return;

    const originalText = reviewSubmitBtn.textContent;

    try {
      reviewSubmitBtn.disabled = true;
      reviewSubmitBtn.textContent = "Submitting...";

      const response = await axios.post(
        "/user/reviews",
        {
          productId,
          rating,
          comment,
        },
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );

      userToast(response.data.message || "Review submitted successfully");

      closeReviewModal();

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      const status = error?.response?.status;
      const errors = error?.response?.data?.errors;

      if (Array.isArray(errors) && errors.length) {
        errors.forEach((item) => {
          const field = item.path?.[0];

          if (field === "rating" || field === "comment") {
            showReviewError(field, item.message);
          }
        });
      }

      const message =
        error?.response?.data?.message ||
        errors?.[0]?.message ||
        "Unable to submit review";

      if (status === 401) {
        userToast(message || "Please login first");
        return;
      }

      userToast(message);
    } finally {
      reviewSubmitBtn.disabled = false;
      reviewSubmitBtn.textContent = originalText;
    }
  });

  const deleteReviewModal = document.getElementById("deleteReviewModal");
  const deleteReviewBackdrop = document.getElementById(
    "deleteReviewBackdrop",
  );
  const cancelDeleteReview = document.getElementById("cancelDeleteReview");
  const confirmDeleteReview = document.getElementById("confirmDeleteReview");

  let pendingDeleteReviewId = null;

  function openDeleteReviewModal(reviewId) {
    if (!deleteReviewModal) return;

    pendingDeleteReviewId = reviewId;

    deleteReviewModal.classList.add("pd-delete-modal--open");
    deleteReviewModal.setAttribute("aria-hidden", "false");

    document.body.classList.add("pd-modal-open");
  }

  function closeDeleteReviewModal() {
    if (!deleteReviewModal) return;

    deleteReviewModal.classList.remove("pd-delete-modal--open");
    deleteReviewModal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("pd-modal-open");

    pendingDeleteReviewId = null;

    if (confirmDeleteReview) {
      confirmDeleteReview.disabled = false;
      confirmDeleteReview.textContent = "Delete Review";
    }
  }

  document.querySelectorAll(".pd-delete-review-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const reviewId = button.dataset.reviewId;

      if (!reviewId) return;

      openDeleteReviewModal(reviewId);
    });
  });

  cancelDeleteReview?.addEventListener("click", closeDeleteReviewModal);

  deleteReviewBackdrop?.addEventListener("click", closeDeleteReviewModal);

  confirmDeleteReview?.addEventListener("click", async () => {
    if (!pendingDeleteReviewId || confirmDeleteReview.disabled) {
      return;
    }

    const reviewId = pendingDeleteReviewId;

    try {
      confirmDeleteReview.disabled = true;
      confirmDeleteReview.textContent = "Deleting...";

      const response = await axios.delete(`/user/reviews/${reviewId}`, {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      closeDeleteReviewModal();

      userToast(response.data.message || "Review deleted successfully");

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      const status = error?.response?.status;

      const message =
        error?.response?.data?.message || "Unable to delete review";

      confirmDeleteReview.disabled = false;
      confirmDeleteReview.textContent = "Delete Review";

      if (status === 401) {
        closeDeleteReviewModal();
        userToast(message || "Please login first");
        return;
      }

      userToast(message);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (deleteReviewModal?.classList.contains("pd-delete-modal--open")) {
      closeDeleteReviewModal();
      return;
    }

    if (reviewModal?.classList.contains("pd-review-modal--open")) {
      closeReviewModal();
    }
  });
})();
