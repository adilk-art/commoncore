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
const retryPaymentBtn = document.getElementById("retryPaymentBtn");

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

document.querySelectorAll(".cancel-item-btn").forEach(btn => {
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

modal?.addEventListener("click",event => {
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
      throw new Error(
        response.data.message || "Cancellation failed",
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

    confirmCancelItemBtn.innerHTML = originalText;
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

const originalRetryButtonText =
  retryPaymentBtn?.innerHTML || "Retry Payment";

const resetRetryPaymentButton = () => {
  if (!retryPaymentBtn) return;

  retryPaymentBtn.disabled = false;
  retryPaymentBtn.innerHTML =
    originalRetryButtonText;
};

retryPaymentBtn?.addEventListener("click",async () => {
  const orderId = retryPaymentBtn.dataset.orderId;

  if (!orderId) {
    userToast("Order ID is missing");
    return;
  }

  try {
    retryPaymentBtn.disabled = true;

    retryPaymentBtn.innerHTML = `
      <span class="btn-spinner"></span>
      <span>Opening Payment...</span>
    `;

    const { data } = await axios.post(
      `/user/order/${orderId}/retry-payment`,
    );

    if (
      !data.success ||
      !data.databaseOrderId ||
      !data.order?.id
    ) {
      throw new Error(
        data.message || "Unable to retry payment",
      );
    }

    const databaseOrderId =
      data.databaseOrderId;

    const options = {
      key: data.key,
      amount: data.order.amount,
      currency: data.order.currency,
      name: "Commoncore",
      description: `Payment for ${data.orderNumber || "order"}`,
      order_id: data.order.id,
      retry: {
        enabled: true,
        max_count: 3,
      },
      handler: async response => {
        try {
          const verifyResponse = await axios.post(
            "/user/order/verify-payment",
            {
              databaseOrderId,
              razorpay_order_id:
                response.razorpay_order_id,
              razorpay_payment_id:
                response.razorpay_payment_id,
              razorpay_signature:
                response.razorpay_signature,
            },
          );

          const result = verifyResponse.data;

          if (!result.success || !result.orderId) {
            throw new Error(
              result.message ||
              "Payment verification failed",
            );
          }

          window.location.href =
            `/user/order/success/${result.orderId}`;
        } catch (error) {
          resetRetryPaymentButton();

          userToast(
            error.response?.data?.message ||
            error.message ||
            "Payment verification failed",
          );
        }
      },
      modal: {
        ondismiss: () => {
          resetRetryPaymentButton();
        },
      },
      theme: {
        color: "#000000",
      },
    };

    const razorpayCheckout =
      new Razorpay(options);

    razorpayCheckout.on(
      "payment.failed",
      async response => {
        try {
          await axios.post(
            "/user/order/payment-failure",
            {
              databaseOrderId,
              error: {
                code: response.error?.code,
                description:
                  response.error?.description,
                reason:
                  response.error?.reason,
                source:
                  response.error?.source,
                step:
                  response.error?.step,
              },
            },
          );
        } catch (error) {
          console.error(
            "Unable to record payment failure",
            error.response?.data?.message ||
            error.message,
          );
        }

        resetRetryPaymentButton();
        userToast("Payment failed. Please try again.");
      },
    );

    razorpayCheckout.open();
  } catch (error) {
    resetRetryPaymentButton();

    userToast(
      error.response?.data?.message ||
      error.message ||
      "Unable to retry payment",
    );

    if (
      error.response?.data?.code ===
      "PAYMENT_EXPIRED"
    ) {
      setTimeout(() => {
        window.location.reload();
      },500);
    }
  }
});