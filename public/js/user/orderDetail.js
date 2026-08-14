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

let selectedOrderId = null;
let selectedItemId = null;
let isOrderCancellation = false;

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

cancelOrderBtn?.addEventListener("click",() => {
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
  btn.addEventListener("click",() => {
    isOrderCancellation = false;
    selectedOrderId = btn.dataset.orderId;
    selectedItemId = btn.dataset.itemId;

    if (modalImage) {
      modalImage.style.display = "block";
      modalImage.src =
        btn.dataset.image || "/images/no-image.png";
    }

    if (modalName) {
      modalName.textContent =
        btn.dataset.name || "Order Item";
    }

    if (modalColor) {
      modalColor.textContent =
        btn.dataset.color
          ? `Color: ${btn.dataset.color}`
          : "";
    }

    if (modalSize) {
      modalSize.textContent =
        btn.dataset.size
          ? `Size: ${btn.dataset.size}`
          : "";
    }

    if (modalPrice) {
      modalPrice.textContent =
        `₹${Number(btn.dataset.price || 0).toLocaleString(
          "en-IN",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        )}`;
    }

    if (cancelReason) cancelReason.value = "";
    if (cancelComment) cancelComment.value = "";

    modal?.classList.remove("hidden");
  });
});

closeCancelModalBtn?.addEventListener(
  "click",
  closeCancellationModal,
);

keepItemBtn?.addEventListener(
  "click",
  closeCancellationModal,
);

modal?.addEventListener("click",(event) => {
  if (event.target === modal) {
    closeCancellationModal();
  }
});

confirmCancelItemBtn?.addEventListener("click",async () => {
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

  try {
    confirmCancelItemBtn.disabled = true;

    const originalText =
      confirmCancelItemBtn.innerHTML;

    confirmCancelItemBtn.innerHTML = `
      <span class="btn-spinner"></span>
      <span>Cancelling...</span>
    `;

    let response;

    if (isOrderCancellation) {
      response = await axios.patch(
        `/user/order/${selectedOrderId}/cancel`,
        {
          reason,
          comment,
        },
      );
    } else {
      if (!selectedItemId) {
        throw new Error(
          "Order item information is missing",
        );
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
      throw new Error(
        response.data.message ||
        "Cancellation failed",
      );
    }

    userToast(
      isOrderCancellation
        ? "Order cancelled"
        : "Item cancelled",
    );

    setTimeout(() => {
      window.location.reload();
    },700);

    confirmCancelItemBtn.innerHTML =
      originalText;
  } catch (error) {
    confirmCancelItemBtn.disabled = false;
    confirmCancelItemBtn.innerHTML =
      "Confirm Cancellation";

    userToast(
      error.response?.data?.message ||
      error.message ||
      "Cancellation failed",
    );
  }
});

checkoutAgainBtn?.addEventListener("click",async () => {
  const orderId = checkoutAgainBtn.dataset.orderId;

  if (!orderId) {
    userToast("Order ID is missing");
    return;
  }

  try {
    checkoutAgainBtn.disabled = true;

    checkoutAgainBtn.innerHTML = `
      <span class="btn-spinner"></span>
      <span>Preparing Checkout...</span>
    `;

    const { data } = await axios.post(
      `/user/order/${orderId}/checkout-again`,
    );

    if (
      !data.success ||
      !data.redirectUrl
    ) {
      throw new Error(
        data.message ||
        "Unable to prepare checkout",
      );
    }

    window.location.href =
      data.redirectUrl;
  } catch (error) {
    checkoutAgainBtn.disabled = false;
    checkoutAgainBtn.textContent =
      "Checkout Again";

    userToast(
      error.response?.data?.message ||
      error.message ||
      "Unable to prepare checkout",
    );
  }
});