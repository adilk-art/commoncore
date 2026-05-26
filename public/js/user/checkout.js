const addressCards = document.querySelectorAll(".checkout-address");

addressCards.forEach((card) => {
  card.addEventListener("click", () => {
    addressCards.forEach((el) => {
      el.classList.remove("active");
    });

    card.classList.add("active");

    const radio = card.querySelector(".address-radio");

    if (radio) {
      radio.checked = true;
    }
  });
});

const paymentCards = document.querySelectorAll(".payment-option");

paymentCards.forEach((card) => {
  card.addEventListener("click", () => {
    paymentCards.forEach((el) => {
      el.classList.remove("active");
    });

    card.classList.add("active");

    const radio = card.querySelector(".payment-radio");

    if (radio) {
      radio.checked = true;
    }
  });
});

/* PLACE ORDER */

const placeOrderBtn =
  document.getElementById(
    "placeOrderBtn",
  );

placeOrderBtn?.addEventListener(
  "click",
  () => {

    const selectedAddress =
      document.querySelector(
        ".address-radio:checked",
      );

    const selectedPayment =
      document.querySelector(
        ".payment-radio:checked",
      );

    if (!selectedAddress) {

      userToast(
        "Please select address",
      );

      return;

    }

    if (!selectedPayment) {

      userToast(
        "Please select payment method",
      );

      return;

    }

    return;

  },
);