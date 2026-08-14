const checkoutAgainBtn = document.getElementById("checkoutAgainBtn");

const originalCheckoutAgainText =
  checkoutAgainBtn?.innerHTML || "Checkout Again";

const resetCheckoutAgainButton = () => {
  if (!checkoutAgainBtn) {
    return;
  }

  checkoutAgainBtn.disabled = false;
  checkoutAgainBtn.innerHTML = originalCheckoutAgainText;
};

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

    if (!data.success || !data.redirectUrl) {
      throw new Error(
        data.message ||
        "Unable to prepare checkout",
      );
    }

    window.location.href = data.redirectUrl;
  } catch (error) {
    resetCheckoutAgainButton();

    userToast(
      error.response?.data?.message ||
      error.message ||
      "Unable to checkout again",
    );
  }
});