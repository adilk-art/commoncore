const addressCards = document.querySelectorAll(".checkout-address");
const addressModal = document.getElementById("addressModal");
const addressForm = document.getElementById("addressForm");
const openAddAddressModal = document.getElementById("openAddAddressModal");
const closeAddressModal = document.getElementById("closeAddressModal");
const addressFormTitle = document.getElementById("addressFormTitle");
const couponCodeInput = document.getElementById("couponCode");
const applyCouponBtn = document.getElementById("applyCouponBtn");
const removeCouponBtn = document.getElementById("removeCouponBtn");
const qualifiedCouponBtns = document.querySelectorAll(".qualified-coupon");
const qualifiedCouponsContainer = document.getElementById("qualifiedCoupons");
const couponError = document.getElementById("couponError");
const appliedCoupon = document.getElementById("appliedCoupon");
const appliedCouponCode = document.getElementById("appliedCouponCode");
const appliedCouponMessage = document.getElementById("appliedCouponMessage");
const appliedCouponIdInput = document.getElementById("appliedCouponId");
const appliedCouponCodeValue = document.getElementById(
  "appliedCouponCodeValue",
);
const couponDiscountRow = document.getElementById("couponDiscountRow");
const checkoutCouponDiscount = document.getElementById(
  "checkoutCouponDiscount",
);
const checkoutGst = document.getElementById("checkoutGst");
const checkoutShipping = document.getElementById("checkoutShipping");
const checkoutTotal = document.getElementById("checkoutTotal");
const checkoutRemoveItemBtns = document.querySelectorAll(
  ".checkout-remove-item-btn",
);
const checkoutAdjustQtyBtns = document.querySelectorAll(
  ".checkout-adjust-qty-btn",
);
const exitCheckoutAgainBtn = document.getElementById(
  "exitCheckoutAgainBtn",
);

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getCheckoutPayload = () => {
  const isBuyNow = document.getElementById("isBuyNow")?.value === "true";
  const checkoutAgainOrderId =
    document.getElementById("checkoutAgainOrderId")?.value || null;

  const payload = {
    isBuyNow,
    checkoutAgainOrderId,
  };

  if (isBuyNow) {
    payload.variantId = document.getElementById("buyNowVariantId")?.value;
    payload.quantity = Number(
      document.getElementById("buyNowQuantity")?.value,
    );
  }

  return payload;
};

const clearCouponError = () => {
  if (!couponError) {
    return;
  }

  couponError.textContent = "";
};

const showCouponError = (message) => {
  if (!couponError) {
    return;
  }

  couponError.textContent = message;
};

const updateCheckoutPricing = (pricing,hasCoupon = true) => {
  if (!pricing) {
    return;
  }

  if (hasCoupon) {
    couponDiscountRow?.classList.remove("hidden");

    if (checkoutCouponDiscount) {
      checkoutCouponDiscount.textContent = `−₹${formatMoney(
        pricing.couponDiscount,
      )}`;
    }
  } else {
    couponDiscountRow?.classList.add("hidden");

    if (checkoutCouponDiscount) {
      checkoutCouponDiscount.textContent = "−₹0.00";
    }
  }

  if (checkoutGst) {
    checkoutGst.textContent = `₹${formatMoney(pricing.gstAmount)}`;
  }

  if (checkoutShipping) {
    checkoutShipping.textContent =
      Number(pricing.shippingFee) === 0
        ? "Free"
        : `₹${formatMoney(pricing.shippingFee)}`;
  }

  if (checkoutTotal) {
    checkoutTotal.textContent = `₹${formatMoney(pricing.total)}`;
  }
};

addressCards.forEach((card) => {
  card.addEventListener("click",() => {
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
  card.addEventListener("click",() => {
    const radio = card.querySelector(".payment-radio");

    if (!radio || radio.disabled) {
      return;
    }

    paymentCards.forEach((el) => {
      el.classList.remove("active");
    });

    card.classList.add("active");
    radio.checked = true;
  });
});

const applyCoupon = async (couponCode) => {
  const code = String(couponCode || "")
    .trim()
    .toUpperCase();

  clearCouponError();

  if (!code) {
    showCouponError("Please enter a coupon code.");
    couponCodeInput?.focus();
    return;
  }

  const currentCoupon = appliedCouponCodeValue?.value;

  if (currentCoupon && currentCoupon === code) {
    showCouponError("This coupon is already applied.");
    return;
  }

  const payload = {
    code,
    ...getCheckoutPayload(),
  };

  try {
    if (applyCouponBtn) {
      applyCouponBtn.disabled = true;
      applyCouponBtn.textContent = "Applying...";
    }

    qualifiedCouponBtns.forEach((button) => {
      button.disabled = true;
    });

    const { data } = await axios.post("/user/coupons/apply",payload);

    if (!data.success) {
      throw new Error(data.message || "Unable to apply coupon.");
    }

    if (appliedCouponIdInput) {
      appliedCouponIdInput.value =
        data.coupon.id || data.coupon._id || "";
    }

    if (appliedCouponCodeValue) {
      appliedCouponCodeValue.value = data.coupon.code;
    }

    if (couponCodeInput) {
      couponCodeInput.value = data.coupon.code;
      couponCodeInput.disabled = true;
    }

    if (appliedCouponCode) {
      appliedCouponCode.textContent = data.coupon.code;
    }

    if (appliedCouponMessage) {
      appliedCouponMessage.textContent =
        `You saved ₹${formatMoney(data.coupon.discountAmount)}`;
    }

    appliedCoupon?.classList.remove("hidden");
    qualifiedCouponsContainer?.classList.add("hidden");

    updateCheckoutPricing(data.pricing,true);

    userToast("Coupon applied successfully");
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unable to apply coupon.";

    showCouponError(message);
  } finally {
    if (applyCouponBtn) {
      applyCouponBtn.disabled = false;
      applyCouponBtn.textContent = "Apply";
    }

    qualifiedCouponBtns.forEach((button) => {
      button.disabled = false;
    });
  }
};

applyCouponBtn?.addEventListener("click",() => {
  applyCoupon(couponCodeInput?.value);
});

couponCodeInput?.addEventListener("input",() => {
  couponCodeInput.value = couponCodeInput.value
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g,"");

  clearCouponError();
});

couponCodeInput?.addEventListener("keydown",(event) => {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();

  applyCoupon(couponCodeInput.value);
});

qualifiedCouponBtns.forEach((couponBtn) => {
  couponBtn.addEventListener("click",() => {
    const code = couponBtn.dataset.code;

    if (!code) {
      return;
    }

    if (couponCodeInput) {
      couponCodeInput.value = code.toUpperCase();
    }

    applyCoupon(code);
  });
});

removeCouponBtn?.addEventListener("click",async () => {
  const couponCode = appliedCouponCodeValue?.value;

  if (!couponCode) {
    return;
  }

  try {
    removeCouponBtn.disabled = true;
    removeCouponBtn.textContent = "Removing...";

    const payload = {
      ...getCheckoutPayload(),
    };

    const { data } = await axios.post(
      "/user/coupons/remove",
      payload,
    );

    if (!data.success) {
      throw new Error(data.message || "Unable to remove coupon.");
    }

    if (appliedCouponIdInput) {
      appliedCouponIdInput.value = "";
    }

    if (appliedCouponCodeValue) {
      appliedCouponCodeValue.value = "";
    }

    if (couponCodeInput) {
      couponCodeInput.value = "";
      couponCodeInput.disabled = false;
    }

    if (appliedCouponCode) {
      appliedCouponCode.textContent = "";
    }

    if (appliedCouponMessage) {
      appliedCouponMessage.textContent = "";
    }

    appliedCoupon?.classList.add("hidden");
    qualifiedCouponsContainer?.classList.remove("hidden");

    clearCouponError();

    updateCheckoutPricing(data.pricing,false);

    userToast("Coupon removed successfully");
  } catch (error) {
    userToast(
      error.response?.data?.message ||
      error.message ||
      "Unable to remove coupon",
    );
  } finally {
    removeCouponBtn.disabled = false;
    removeCouponBtn.textContent = "Remove";
  }
});

checkoutAdjustQtyBtns.forEach((button) => {
  button.addEventListener("click",async () => {
    try {
      const variantId = button.dataset.variantId;
      const quantity = Number(button.dataset.quantity);

      button.disabled = true;
      button.textContent = "Updating...";

      const { data } = await axios.patch(
        `/user/order/checkout-again/item/${variantId}/quantity`,
        {
          quantity,
        },
      );

      if (!data.success) {
        throw new Error(
          data.message || "Unable to update quantity",
        );
      }

      window.location.reload();
    } catch (error) {
      button.disabled = false;
      button.textContent =
        `Change to ${button.dataset.quantity}`;

      userToast(
        error.response?.data?.message ||
        error.message ||
        "Unable to update quantity",
      );
    }
  });
});

checkoutRemoveItemBtns.forEach((button) => {
  button.addEventListener("click",async () => {
    try {
      const variantId = button.dataset.variantId;

      button.disabled = true;
      button.textContent = "Removing...";

      const { data } = await axios.delete(
        `/user/order/checkout-again/item/${variantId}`,
      );

      if (!data.success) {
        throw new Error(
          data.message || "Unable to remove item",
        );
      }

      if (data.empty) {
        window.location.href = data.redirectUrl;
        return;
      }

      window.location.reload();
    } catch (error) {
      button.disabled = false;
      button.textContent = "Remove Item";

      userToast(
        error.response?.data?.message ||
        error.message ||
        "Unable to remove item",
      );
    }
  });
});

exitCheckoutAgainBtn?.addEventListener("click",async () => {
  try {
    exitCheckoutAgainBtn.disabled = true;
    exitCheckoutAgainBtn.textContent = "Returning...";

    const { data } = await axios.post(
      "/user/order/checkout-again/exit",
    );

    if (!data.success) {
      throw new Error(
        data.message || "Unable to return to cart",
      );
    }

    window.location.href = data.redirectUrl;
  } catch (error) {
    exitCheckoutAgainBtn.disabled = false;
    exitCheckoutAgainBtn.textContent = "Back to My Cart";

    userToast(
      error.response?.data?.message ||
      error.message ||
      "Unable to return to cart",
    );
  }
});

const placeOrderBtn = document.getElementById("placeOrderBtn");
const originalButtonText =
  placeOrderBtn?.innerHTML || "Place Order";

const resetPlaceOrderButton = () => {
  if (!placeOrderBtn) return;

  placeOrderBtn.disabled = false;
  placeOrderBtn.innerHTML = originalButtonText;
};

const setPlaceOrderLoading = () => {
  if (!placeOrderBtn) return;

  placeOrderBtn.disabled = true;
  placeOrderBtn.innerHTML = `
    <span class="btn-spinner"></span>
    <span>Placing Order...</span>
  `;
};

const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve,ms));

placeOrderBtn?.addEventListener("click",async (event) => {
  event.preventDefault();

  const selectedAddress =
    document.querySelector(".address-radio:checked");

  const selectedPayment =
    document.querySelector(".payment-radio:checked");

  if (!selectedAddress) {
    return userToast("Please select address");
  }

  if (!selectedPayment) {
    return userToast("Please select payment method");
  }

  const isBuyNow =
    document.getElementById("isBuyNow")?.value === "true";

  const checkoutAgainOrderId =
    document.getElementById("checkoutAgainOrderId")?.value || null;

  const payload = {
    shippingAddress: selectedAddress.value,
    paymentMethod: selectedPayment.value,
    couponCode: appliedCouponCodeValue?.value || null,
    isBuyNow,
    checkoutAgainOrderId,
  };

  if (isBuyNow) {
    payload.variantId =
      document.getElementById("buyNowVariantId")?.value;

    payload.quantity = Number.parseInt(
      document.getElementById("buyNowQuantity")?.value,
      10,
    );
  }

  try {
    setPlaceOrderLoading();

    if (
      payload.paymentMethod === "CashOnDelivery" ||
      payload.paymentMethod === "Wallet"
    ) {
      const { data } = await axios.post(
        "/user/order/place",
        payload,
      );

      if (!data.success || !data.order?._id) {
        throw new Error(
          data.message || "Unable to place order",
        );
      }

      await delay(1000);

      window.location.href =
        `/user/order/success/${data.order._id}`;

      return;
    }

    if (payload.paymentMethod !== "Razorpay") {
      throw new Error("Invalid payment method");
    }

    const createResponse = await axios.post(
      "/user/order/create-razorpay-order",
      payload,
    );

    const paymentData = createResponse.data;

    if (
      !paymentData.success ||
      !paymentData.databaseOrderId ||
      !paymentData.order?.id
    ) {
      throw new Error(
        paymentData.message ||
        "Unable to initialize payment",
      );
    }

    const databaseOrderId =
      paymentData.databaseOrderId;

    const options = {
      key: paymentData.key,
      amount: paymentData.order.amount,
      currency: paymentData.order.currency,
      name: "Commoncore",
      description: "Order Payment",
      order_id: paymentData.order.id,
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

          await delay(1000);

          window.location.href =
            `/user/order/success/${result.orderId}`;
        } catch (error) {
          resetPlaceOrderButton();

          userToast(
            error.response?.data?.message ||
            error.message ||
            "Payment verification failed",
          );
        }
      },
      modal: {
        ondismiss: () => {
          resetPlaceOrderButton();

          window.location.href =
            `/user/order/payment-failed/${databaseOrderId}`;
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
      async (response) => {
        try {
          await axios.post(
            "/user/order/payment-failure",
            {
              databaseOrderId,
              error: {
                code: response.error?.code,
                description:
                  response.error?.description,
                reason: response.error?.reason,
                source: response.error?.source,
                step: response.error?.step,
              },
            },
          );
        } catch (error) {
          console.error(
            "Unable to record payment failure:",
            error.response?.data?.message ||
            error.message,
          );
        }

        window.location.href =
          `/user/order/payment-failed/${databaseOrderId}`;
      },
    );

    razorpayCheckout.open();
  } catch (error) {
    resetPlaceOrderButton();

    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to place order";

    const code =
      error.response?.data?.code;

    userToast(message);

    if (
      code === "INVALID_CART" ||
      code === "INVALID_CHECKOUT_AGAIN"
    ) {
      setTimeout(() => {
        window.location.href = "/user/checkout";
      },500);

      return;
    }

    if (code === "INVALID_COUPON") {
      if (appliedCouponIdInput) {
        appliedCouponIdInput.value = "";
      }

      if (appliedCouponCodeValue) {
        appliedCouponCodeValue.value = "";
      }

      if (couponCodeInput) {
        couponCodeInput.value = "";
        couponCodeInput.disabled = false;
      }

      if (appliedCouponCode) {
        appliedCouponCode.textContent = "";
      }

      if (appliedCouponMessage) {
        appliedCouponMessage.textContent = "";
      }

      appliedCoupon?.classList.add("hidden");
      qualifiedCouponsContainer?.classList.remove("hidden");
    }
  }
});

openAddAddressModal?.addEventListener("click",() => {
  addressForm.reset();

  clearAddressErrors();

  document.getElementById("addressId").value = "";

  addressFormTitle.innerText = "Add New Address";

  addressModal.classList.add("active");
});

closeAddressModal?.addEventListener("click",() => {
  addressModal.classList.remove("active");

  addressForm.reset();

  clearAddressErrors();
});

document
  .querySelectorAll(".checkout-edit-address-btn")
  .forEach((btn) => {
    btn.addEventListener("click",(event) => {
      event.preventDefault();
      event.stopPropagation();

      clearAddressErrors();

      addressFormTitle.innerText = "Edit Address";

      document.getElementById("addressId").value =
        btn.dataset.id;

      addressForm.fullName.value =
        btn.dataset.fullname;

      addressForm.phone.value =
        btn.dataset.phone;

      addressForm.line1.value =
        btn.dataset.line1;

      addressForm.line2.value =
        btn.dataset.line2;

      addressForm.city.value =
        btn.dataset.city;

      addressForm.state.value =
        btn.dataset.state;

      addressForm.pincode.value =
        btn.dataset.pincode;

      addressForm.isDefault.checked =
        btn.dataset.default === "true";

      addressModal.classList.add("active");
    });
  });

addressForm?.addEventListener("submit",async (event) => {
  event.preventDefault();

  clearAddressErrors();

  let isValid = true;

  const fullName =
    addressForm.fullName.value.trim();

  const phone =
    addressForm.phone.value.trim();

  const line1 =
    addressForm.line1.value.trim();

  const city =
    addressForm.city.value.trim();

  const state =
    addressForm.state.value.trim();

  const pincode =
    addressForm.pincode.value.trim();

  if (fullName.length < 3) {
    showAddressError(
      "fullNameError",
      "Minimum 3 characters required",
    );

    isValid = false;
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    showAddressError(
      "phoneError",
      "Invalid phone number",
    );

    isValid = false;
  }

  if (line1.length < 3) {
    showAddressError(
      "line1Error",
      "Address is required",
    );

    isValid = false;
  }

  if (city.length < 2) {
    showAddressError(
      "cityError",
      "City is required",
    );

    isValid = false;
  }

  if (state.length < 2) {
    showAddressError(
      "stateError",
      "State is required",
    );

    isValid = false;
  }

  if (!/^\d{6}$/.test(pincode)) {
    showAddressError(
      "pincodeError",
      "Invalid pincode",
    );

    isValid = false;
  }

  if (!isValid) {
    return;
  }

  const formData =
    new FormData(addressForm);

  const data =
    Object.fromEntries(formData.entries());

  data.isDefault =
    addressForm.isDefault.checked;

  const addressId =
    document.getElementById("addressId").value;

  try {
    if (addressId) {
      await axios.patch(
        `/user/address/update/${addressId}`,
        data,
      );

      userToast(
        "Address updated successfully",
      );
    } else {
      await axios.post(
        "/user/address/add",
        data,
      );

      userToast(
        "Address added successfully",
      );
    }

    setTimeout(() => {
      location.reload();
    },1200);
  } catch (error) {
    const errors =
      error.response?.data?.errors || [];

    if (errors.length === 0) {
      userToast(
        error.response?.data?.message ||
        "Unable to save address",
      );

      return;
    }

    errors.forEach((item) => {
      const field =
        Array.isArray(item.path)
          ? item.path[0]
          : item.path;

      showAddressError(
        `${field}Error`,
        item.message,
      );
    });
  }
});

function showAddressError(id,message) {
  const element =
    document.getElementById(id);

  if (!element) {
    return;
  }

  element.innerText = message;
  element.style.display = "block";
}

function clearAddressErrors() {
  document
    .querySelectorAll("#addressModal .error-msg")
    .forEach((element) => {
      element.innerText = "";
      element.style.display = "none";
    });
}