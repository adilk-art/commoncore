const retryBtn = document.getElementById("retryPaymentBtn");

retryBtn?.addEventListener("click", async () => {
  try {
    retryBtn.disabled = true;
    retryBtn.textContent = "Opening...";

    const { data } = await axios.get("/user/order/retry-payment");

    const options = {
      key: data.key,
      amount: data.order.amount,
      currency: data.order.currency,
      order_id: data.order.id,
      name: "Commoncore",
      description: "Order Payment",

      handler: async function (response) {
        try {
          const verify = await axios.post(
            "/user/order/verify-payment",
            response,
          );

          if (verify.data.success) {
            window.location.href = `/user/order/success/${verify.data.orderId}`;
          }
        } catch (err) {
          userToast(
            err.response?.data?.message || "Payment verification failed",
          );

          retryBtn.disabled = false;
          retryBtn.textContent = "Retry Payment";
        }
      },

      theme: {
        color: "#000000",
      },
    };

    const rzp = new Razorpay(options);

    rzp.on("payment.failed", function (response) {
      userToast(response.error.description || "Payment failed");

      retryBtn.disabled = false;
      retryBtn.textContent = "Retry Payment";
    });

    rzp.open();
  } catch (err) {
    retryBtn.disabled = false;
    retryBtn.textContent = "Retry Payment";

    userToast(err.response?.data?.message || "Unable to retry payment");
  }
});
