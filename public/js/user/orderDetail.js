const modal = document.getElementById("cancelItemModal");
const modalImage = document.getElementById("modalImage");
const modalName = document.getElementById("modalName");
const modalColor = document.getElementById("modalColor");
const modalSize = document.getElementById("modalSize");
const modalPrice = document.getElementById("modalPrice");
const cancelReason = document.getElementById("cancelReason");
const cancelComment = document.getElementById("cancelComment");
const closeCancelModalBtn = document.getElementById("closeCancelModal");
const keepItemBtn = document.getElementById("keepItemBtn");
const confirmCancelItemBtn = document.getElementById("confirmCancelItem");
const cancelOrderBtn = document.querySelector(".cancel-order-btn");
const checkoutAgainBtn = document.querySelector(".checkout-again-btn");

const reviewModal = document.getElementById("reviewModal");
const closeReviewModalBtn = document.getElementById("closeReviewModal");
const cancelReviewBtn = document.getElementById("cancelReviewBtn");
const submitReviewBtn = document.getElementById("submitReviewBtn");
const reviewProductImage = document.getElementById("reviewProductImage");
const reviewProductName = document.getElementById("reviewProductName");
const reviewComment = document.getElementById("reviewComment");
const reviewCharacterCount = document.getElementById("reviewCharacterCount");
const reviewRatingText = document.getElementById("reviewRatingText");
const reviewRatingError = document.getElementById("reviewRatingError");
const reviewCommentError = document.getElementById("reviewCommentError");
const reviewFormError = document.getElementById("reviewFormError");
const reviewStars = document.querySelectorAll(".review-star");
const writeReviewBtns = document.querySelectorAll(".write-review-btn");

let selectedOrderId = null;
let selectedItemId = null;
let isOrderCancellation = false;

let selectedReviewProductId = null;
let selectedRating = 0;

const ratingLabels = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

const closeCancellationModal = () => {
  modal?.classList.add("hidden");

  if (modalImage) {
    modalImage.style.display = "block";
    modalImage.src = "";
  }

  if (cancelReason) cancelReason.value = "";
  if (cancelComment) cancelComment.value = "";

  selectedOrderId = null;
  selectedItemId = null;
  isOrderCancellation = false;
};

cancelOrderBtn?.addEventListener("click", () => {
  isOrderCancellation = true;
  selectedOrderId = cancelOrderBtn.dataset.orderId;
  selectedItemId = null;

  if (modalImage) {
    modalImage.style.display = "none";
  }

  if (modalName) modalName.textContent = "Entire Order";
  if (modalColor) modalColor.textContent = "";
  if (modalSize) modalSize.textContent = "";
  if (modalPrice) modalPrice.textContent = "";
  if (cancelReason) cancelReason.value = "";
  if (cancelComment) cancelComment.value = "";

  modal?.classList.remove("hidden");
});

document.querySelectorAll(".cancel-item-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    isOrderCancellation = false;
    selectedOrderId = btn.dataset.orderId;
    selectedItemId = btn.dataset.itemId;

    if (modalImage) {
      modalImage.style.display = "block";
      modalImage.src = btn.dataset.image || "/images/no-image.png";
    }

    if (modalName) {
      modalName.textContent = btn.dataset.name || "Order Item";
    }

    if (modalColor) {
      modalColor.textContent = btn.dataset.color
        ? `Color: ${btn.dataset.color}`
        : "";
    }

    if (modalSize) {
      modalSize.textContent = btn.dataset.size
        ? `Size: ${btn.dataset.size}`
        : "";
    }

    if (modalPrice) {
      modalPrice.textContent = `₹${Number(
        btn.dataset.price || 0,
      ).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    if (cancelReason) cancelReason.value = "";
    if (cancelComment) cancelComment.value = "";

    modal?.classList.remove("hidden");
  });
});

closeCancelModalBtn?.addEventListener("click", closeCancellationModal);

keepItemBtn?.addEventListener("click", closeCancellationModal);

modal?.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeCancellationModal();
  }
});

confirmCancelItemBtn?.addEventListener("click", async () => {
  const reason = cancelReason?.value;
  const comment = cancelComment?.value.trim() || "";

  if (!reason) {
    userToast("Please select a reason");
    return;
  }

  if (!selectedOrderId) {
    userToast("Order information is missing");
    return;
  }

  const originalText = confirmCancelItemBtn.innerHTML;

  try {
    confirmCancelItemBtn.disabled = true;

    confirmCancelItemBtn.innerHTML = `
      <span class="btn-spinner"></span>
      <span>Cancelling...</span>
    `;

    let response;

    if (isOrderCancellation) {
      response = await axios.patch(`/user/order/${selectedOrderId}/cancel`, {
        reason,
        comment,
      });
    } else {
      if (!selectedItemId) {
        throw new Error("Order item information is missing");
      }

      response = await axios.patch(
        `/user/order/${selectedOrderId}/items/${selectedItemId}/cancel`,
        {
          reason,
          comment,
        },
      );
    }

    if (!response.data.success) {
      throw new Error(response.data.message || "Cancellation failed");
    }

    userToast(isOrderCancellation ? "Order cancelled" : "Item cancelled");

    setTimeout(() => {
      window.location.reload();
    }, 700);
  } catch (error) {
    confirmCancelItemBtn.disabled = false;
    confirmCancelItemBtn.innerHTML = originalText;

    userToast(
      error.response?.data?.message || error.message || "Cancellation failed",
    );
  }
});

checkoutAgainBtn?.addEventListener("click", async () => {
  const orderId = checkoutAgainBtn.dataset.orderId;

  if (!orderId) {
    userToast("Order ID is missing");
    return;
  }

  const originalContent = checkoutAgainBtn.innerHTML;

  try {
    checkoutAgainBtn.disabled = true;

    checkoutAgainBtn.innerHTML = `
      <span class="btn-spinner"></span>
      <span>Preparing Checkout...</span>
    `;

    const { data } = await axios.post(`/user/order/${orderId}/checkout-again`);

    if (!data.success || !data.redirectUrl) {
      throw new Error(data.message || "Unable to prepare checkout");
    }

    window.location.href = data.redirectUrl;
  } catch (error) {
    checkoutAgainBtn.disabled = false;
    checkoutAgainBtn.innerHTML = originalContent;

    userToast(
      error.response?.data?.message ||
        error.message ||
        "Unable to prepare checkout",
    );
  }
});

const updateReviewStars = (rating) => {
  reviewStars.forEach((star) => {
    const starRating = Number(star.dataset.rating);
    const icon = star.querySelector("i");

    if (!icon) return;

    if (starRating <= rating) {
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid");
      star.classList.add("active");
    } else {
      icon.classList.remove("fa-solid");
      icon.classList.add("fa-regular");
      star.classList.remove("active");
    }
  });
};

const clearReviewErrors = () => {
  if (reviewRatingError) {
    reviewRatingError.textContent = "";
  }

  if (reviewCommentError) {
    reviewCommentError.textContent = "";
  }

  if (reviewFormError) {
    reviewFormError.textContent = "";
  }

  reviewStars.forEach((star) => {
    star.classList.remove("review-star-error");
  });

  reviewComment?.classList.remove("review-comment-error");
};

const showRatingError = (message) => {
  if (reviewRatingError) {
    reviewRatingError.textContent = message;
  }

  reviewStars.forEach((star) => {
    star.classList.add("review-star-error");
  });
};

const showCommentError = (message) => {
  if (reviewCommentError) {
    reviewCommentError.textContent = message;
  }

  reviewComment?.classList.add("review-comment-error");
};

const showReviewFormError = (message) => {
  if (reviewFormError) {
    reviewFormError.textContent = message;
  }
};

const resetReviewModal = () => {
  selectedReviewProductId = null;
  selectedRating = 0;

  if (reviewProductImage) {
    reviewProductImage.src = "/images/no-image.png";
  }

  if (reviewProductName) {
    reviewProductName.textContent = "Product";
  }

  if (reviewComment) {
    reviewComment.value = "";
  }

  if (reviewCharacterCount) {
    reviewCharacterCount.textContent = "0 / 500";
  }

  if (reviewRatingText) {
    reviewRatingText.textContent = "Select a rating";
  }

  updateReviewStars(0);
  clearReviewErrors();
};

const closeReviewModal = () => {
  reviewModal?.classList.add("hidden");
  resetReviewModal();
};

writeReviewBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    resetReviewModal();

    selectedReviewProductId = btn.dataset.productId;

    if (reviewProductName) {
      reviewProductName.textContent = btn.dataset.productName || "Product";
    }

    if (reviewProductImage) {
      reviewProductImage.src =
        btn.dataset.productImage || "/images/no-image.png";
    }

    reviewModal?.classList.remove("hidden");
  });
});

closeReviewModalBtn?.addEventListener("click", closeReviewModal);

cancelReviewBtn?.addEventListener("click", closeReviewModal);

reviewModal?.addEventListener("click", (event) => {
  if (event.target === reviewModal) {
    closeReviewModal();
  }
});

reviewStars.forEach((star) => {
  star.addEventListener("click", () => {
    selectedRating = Number(star.dataset.rating);

    updateReviewStars(selectedRating);

    if (reviewRatingText) {
      reviewRatingText.textContent = `${selectedRating}/5 · ${ratingLabels[selectedRating]}`;
    }

    if (reviewRatingError) {
      reviewRatingError.textContent = "";
    }

    reviewStars.forEach((item) => {
      item.classList.remove("review-star-error");
    });

    if (reviewFormError) {
      reviewFormError.textContent = "";
    }
  });

  star.addEventListener("mouseenter", () => {
    const hoverRating = Number(star.dataset.rating);

    updateReviewStars(hoverRating);
  });

  star.addEventListener("mouseleave", () => {
    updateReviewStars(selectedRating);
  });
});

reviewComment?.addEventListener("input", () => {
  const length = reviewComment.value.length;

  if (reviewCharacterCount) {
    reviewCharacterCount.textContent = `${length} / 500`;
  }

  if (reviewCommentError) {
    reviewCommentError.textContent = "";
  }

  reviewComment.classList.remove("review-comment-error");

  if (reviewFormError) {
    reviewFormError.textContent = "";
  }
});

submitReviewBtn?.addEventListener("click", async () => {
  clearReviewErrors();

  let hasError = false;

  if (!selectedReviewProductId) {
    showReviewFormError("Product information is missing");
    return;
  }

  if (!selectedRating) {
    showRatingError("Please select a rating");

    hasError = true;
  }

  const comment = reviewComment?.value.trim() || "";

  if (!comment) {
    showCommentError("Please write your review");

    hasError = true;
  } else if (comment.length < 3) {
    showCommentError("Review must be at least 3 characters");

    hasError = true;
  }

  if (hasError) {
    return;
  }

  const originalContent = submitReviewBtn.innerHTML;

  try {
    submitReviewBtn.disabled = true;

    submitReviewBtn.innerHTML = `
      <span class="btn-spinner"></span>
      <span>Submitting...</span>
    `;

    const { data } = await axios.post("/user/reviews", {
      productId: selectedReviewProductId,
      rating: selectedRating,
      comment,
    });

    if (!data.success) {
      throw new Error(data.message || "Unable to submit review");
    }

    reviewModal?.classList.add("hidden");

    userToast(data.message || "Review submitted successfully");

    setTimeout(() => {
      window.location.reload();
    }, 700);
  } catch (error) {
    submitReviewBtn.disabled = false;
    submitReviewBtn.innerHTML = originalContent;

    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to submit review";

    showReviewFormError(message);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  if (reviewModal && !reviewModal.classList.contains("hidden")) {
    closeReviewModal();
    return;
  }

  if (modal && !modal.classList.contains("hidden")) {
    closeCancellationModal();
  }
});
