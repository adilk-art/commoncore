const retryBtn = document.getElementById("retryPaymentBtn");

const originalRetryText = retryBtn?.innerHTML || "Retry Payment";

const resetRetryButton = () => {
  if (!retryBtn) {
    return;
  }

  retryBtn.disabled = false;
  retryBtn.innerHTML = originalRetryText;
};

retryBtn?.addEventListener("click", async () => {
  const orderId = retryBtn.dataset.orderId;

  if (!orderId) {
    userToast("Order ID is missing");
    return;
  }

  try {
    retryBtn.disabled = true;

    retryBtn.innerHTML = `
      <span class="btn-spinner"></span>
      <span>Opening Payment...</span>
    `;

    const { data } = await axios.post(`/user/order/${orderId}/retry-payment`);

    if (!data.success || !data.databaseOrderId || !data.order?.id) {
      throw new Error(data.message || "Unable to retry payment");
    }

    const databaseOrderId = data.databaseOrderId;

    const options = {
      key: data.key,
      amount: data.order.amount,
      currency: data.order.currency,
      order_id: data.order.id,
      name: "Commoncore",
      description: "Order Payment",

      retry: {
        enabled: true,
        max_count: 3,
      },

      handler: async (response) => {
        try {
          const verifyResponse = await axios.post(
            "/user/order/verify-payment",
            {
              databaseOrderId,

              razorpay_order_id: response.razorpay_order_id,

              razorpay_payment_id: response.razorpay_payment_id,

              razorpay_signature: response.razorpay_signature,
            },
          );

          const result = verifyResponse.data;

          if (!result.success || !result.orderId) {
            throw new Error(result.message || "Payment verification failed");
          }

          window.location.href = `/user/order/success/${result.orderId}`;
        } catch (error) {
          resetRetryButton();

          userToast(
            error.response?.data?.message ||
              error.message ||
              "Payment verification failed",
          );
        }
      },

      modal: {
        ondismiss: () => {
          resetRetryButton();
        },
      },

      theme: {
        color: "#000000",
      },
    };

    const razorpayCheckout = new Razorpay(options);

    razorpayCheckout.on("payment.failed", async (response) => {
      try {
        await axios.post("/user/order/payment-failure", {
          databaseOrderId,

          error: {
            code: response.error?.code,

            description: response.error?.description,

            reason: response.error?.reason,

            source: response.error?.source,

            step: response.error?.step,
          },
        });
      } catch (error) {
        console.error(
          "Unable to record payment failure:",
          error.response?.data?.message || error.message,
        );
      }

      resetRetryButton();

      userToast(
        response.error?.description || "Payment failed. Please try again.",
      );
    });

    razorpayCheckout.open();
  } catch (error) {
    resetRetryButton();

    userToast(
      error.response?.data?.message ||
        error.message ||
        "Unable to retry payment",
    );

    if (error.response?.data?.code === "PAYMENT_EXPIRED") {
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }
});
