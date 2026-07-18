const addressCards = document.querySelectorAll(".checkout-address");
const addressModal = document.getElementById("addressModal");
const addressForm = document.getElementById("addressForm");
const openAddAddressModal = document.getElementById("openAddAddressModal");
const closeAddressModal = document.getElementById("closeAddressModal");
const addressFormTitle = document.getElementById("addressFormTitle");

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

const placeOrderBtn = document.getElementById("placeOrderBtn");
const originalButtonText = placeOrderBtn.innerHTML;

placeOrderBtn?.addEventListener("click", async (event) => {
  event.preventDefault();

  const selectedAddress = document.querySelector(".address-radio:checked");
  const selectedPayment = document.querySelector(".payment-radio:checked");

  if (!selectedAddress) return userToast("Please select address");
  if (!selectedPayment) return userToast("Please select payment method");

  const isBuyNow = document.getElementById("isBuyNow")?.value === "true";

  const payload = {
    shippingAddress: selectedAddress.value,
    paymentMethod: selectedPayment.value,
  };

  if (isBuyNow) {
    payload.isBuyNow = true;
    payload.variantId = document.getElementById("buyNowVariantId")?.value;
    payload.quantity = parseInt(
      document.getElementById("buyNowQuantity")?.value,
    );
  }

  try {
    placeOrderBtn.disabled = true;

    placeOrderBtn.innerHTML = `
      <span class="btn-spinner"></span>
      <span>Placing Order...</span>
    `;

    if (payload.paymentMethod === "CashOnDelivery") {
      const { data } = await axios.post("/user/order/place", payload);

      if (!data.success) {
        throw new Error(data.message);
      }

      setTimeout(() => {
        window.location.href = `/user/order/success/${data.order._id}`;
      }, 1200);

      return;
    }

    const { data } = await axios.post(
      "/user/order/create-razorpay-order",
      payload,
    );

    if (!data.success) {
      throw new Error(data.message);
    }

    const options = {
      key: data.key,
      amount: data.order.amount,
      currency: data.order.currency,
      name: "Commoncore",
      description: "Order Payment",
      order_id: data.order.id,

      handler: async function (response) {
        try {
          const { data } = await axios.post(
            "/user/order/verify-payment",
            response,
          );

          if (data.success) {
            window.location.href = `/user/order/success/${data.orderId}`;
          } else {
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerHTML = originalButtonText;
            userToast("Payment verification failed");
          }
        } catch (err) {
          placeOrderBtn.disabled = false;
          placeOrderBtn.innerHTML = originalButtonText;

          userToast(
            err.response?.data?.message || "Payment verification failed",
          );
        }
      },

      modal: {
        ondismiss: function () {
          placeOrderBtn.disabled = false;
          placeOrderBtn.innerHTML = originalButtonText;
        },
      },

      theme: {
        color: "#000000",
      },
    };

    const razorpay = new Razorpay(options);

    razorpay.on("payment.failed", function () {
      placeOrderBtn.disabled = false;
      placeOrderBtn.innerHTML = originalButtonText;

      setTimeout(() => {
        window.location.href = "/user/order/payment-failed";
      }, 0);
    });

    razorpay.open();
  } catch (error) {
    placeOrderBtn.disabled = false;
    placeOrderBtn.innerHTML = originalButtonText;

    const message =
      error.response?.data?.message || error.message || "Failed to place order";

    const code = error.response?.data?.code;

    userToast(message);

    if (code === "INVALID_CART") {
      setTimeout(() => {
        window.location.href = "/user/checkout";
      }, 500);
    }
  }
});

openAddAddressModal?.addEventListener("click", () => {
  addressForm.reset();

  clearAddressErrors();

  document.getElementById("addressId").value = "";

  addressFormTitle.innerText = "Add New Address";

  addressModal.classList.add("active");
});

closeAddressModal?.addEventListener("click", () => {
  addressModal.classList.remove("active");

  addressForm.reset();
});

document.querySelectorAll(".checkout-edit-address-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    clearAddressErrors();

    addressFormTitle.innerText = "Edit Address";

    document.getElementById("addressId").value = btn.dataset.id;

    addressForm.fullName.value = btn.dataset.fullname;

    addressForm.phone.value = btn.dataset.phone;

    addressForm.line1.value = btn.dataset.line1;

    addressForm.line2.value = btn.dataset.line2;

    addressForm.city.value = btn.dataset.city;

    addressForm.state.value = btn.dataset.state;

    addressForm.pincode.value = btn.dataset.pincode;

    addressForm.isDefault.checked = btn.dataset.default === "true";

    addressModal.classList.add("active");
  });
});

addressForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  clearAddressErrors();

  let isValid = true;

  const fullName = addressForm.fullName.value.trim();

  const phone = addressForm.phone.value.trim();

  const line1 = addressForm.line1.value.trim();

  const city = addressForm.city.value.trim();

  const state = addressForm.state.value.trim();

  const pincode = addressForm.pincode.value.trim();

  if (fullName.length < 3) {
    showAddressError("fullNameError", "Minimum 3 characters required");
    isValid = false;
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    showAddressError("phoneError", "Invalid phone number");
    isValid = false;
  }

  if (line1.length < 3) {
    showAddressError("line1Error", "Address is required");
    isValid = false;
  }

  if (city.length < 2) {
    showAddressError("cityError", "City is required");
    isValid = false;
  }

  if (state.length < 2) {
    showAddressError("stateError", "State is required");
    isValid = false;
  }

  if (!/^\d{6}$/.test(pincode)) {
    showAddressError("pincodeError", "Invalid pincode");
    isValid = false;
  }

  if (!isValid) return;

  const formData = new FormData(addressForm);

  const data = Object.fromEntries(formData.entries());

  data.isDefault = addressForm.isDefault.checked;

  const addressId = document.getElementById("addressId").value;

  try {
    if (addressId) {
      await axios.patch(`/user/address/update/${addressId}`, data);

      userToast("Address updated successfully");
    } else {
      await axios.post("/user/address/add", data);

      userToast("Address added successfully");
    }

    setTimeout(() => {
      location.reload();
    }, 1200);
  } catch (err) {
    const errors = err.response?.data?.errors || [];

    errors.forEach((e) => {
      showAddressError(`${e.path[0]}Error`, e.message);
    });
  }
});

function showAddressError(id, message) {
  const el = document.getElementById(id);

  if (!el) return;

  el.innerText = message;
  el.style.display = "block";
}

function clearAddressErrors() {
  document.querySelectorAll("#addressModal .error-msg").forEach((el) => {
    el.innerText = "";
    el.style.display = "none";
  });
}
