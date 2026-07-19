const retryBtn = document.getElementById("retryWalletPaymentBtn");

retryBtn?.addEventListener("click", async () => {
  try {
    retryBtn.disabled = true;
    retryBtn.textContent = "Please wait...";

    const { data } = await axios.post("/user/wallet/retry-payment");

    const options = {
      key: data.key,

      amount: data.order.amount,

      currency: data.order.currency,

      name: "Commoncore",

      description: "Wallet Top-up",

      order_id: data.order.id,

      handler: async function (response) {
        try {
          const { data } = await axios.post(
            "/user/wallet/verify-payment",
            response,
          );

          if (data.success) {
            window.location.href = "/user/wallet";
          }
        } catch {
          window.location.reload();
        }
      },

      modal: {
        ondismiss() {
          retryBtn.disabled = false;
          retryBtn.textContent = "Retry Payment";
        },
      },

      theme: {
        color: "#4e5566",
      },
    };

    const razorpay = new Razorpay(options);

    razorpay.on("payment.failed", function () {
      retryBtn.disabled = false;
      retryBtn.textContent = "Retry Payment";

      setTimeout(() => {
        window.location.reload();
      }, 0);
    });

    razorpay.open();
  } catch (err) {
    retryBtn.disabled = false;
    retryBtn.textContent = "Retry Payment";

    utils.showToast(
      err.response?.data?.message || "Unable to retry payment.",
      "error",
    );
  }
});
