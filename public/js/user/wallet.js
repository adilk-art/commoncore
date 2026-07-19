const modal = document.getElementById("walletModal");
const addMoneyBtn = document.getElementById("addMoneyBtn");
const cancelBtn = document.getElementById("cancelWalletBtn");
const continueBtn = document.getElementById("continueWalletBtn");
const amountInput = document.getElementById("walletAmount");
const amountError = document.getElementById("walletAmountError");
const chips = document.querySelectorAll(".amount-chip");
const successModal = document.getElementById("walletSuccessModal");
const failedModal = document.getElementById("walletFailedModal");

const successAmount = document.getElementById("successAmount");
const successBalance = document.getElementById("successBalance");
const successTransaction = document.getElementById("successTransaction");

const successBtn = document.getElementById("walletSuccessBtn");
const retryBtn = document.getElementById("retryWalletPaymentBtn");
const backBtn = document.getElementById("backToWalletBtn");

addMoneyBtn?.addEventListener("click", () => {
  amountError.textContent = "";
  amountInput.value = "";
  chips.forEach((chip) => chip.classList.remove("active"));
  modal.classList.remove("hidden");
});

cancelBtn?.addEventListener("click", () => {
  modal.classList.add("hidden");
});

modal?.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    amountInput.value = chip.dataset.amount;
    amountError.textContent = "";
  });
});

amountInput?.addEventListener("input", () => {
  chips.forEach((chip) => {
    chip.classList.remove("active");
  });

  amountError.textContent = "";
});

continueBtn?.addEventListener("click", async () => {
  try {
    amountError.textContent = "";

    const amount = Number(amountInput.value);

    if (!amount || amount < 100) {
      amountError.textContent = "Minimum amount is ₹100.";

      return;
    }

    continueBtn.disabled = true;
    continueBtn.textContent = "Please wait...";

    const res = await axios.post("/user/wallet/add-money", { amount });

    modal.classList.add("hidden");

    let failureHandled = false;

    const options = {
      key: res.data.key,

      amount: res.data.order.amount,

      currency: res.data.order.currency,

      name: "Commoncore",

      description: "Wallet Top-up",

      order_id: res.data.order.id,

      handler: async function (response) {
        try {
          const verifyRes = await axios.post(
            "/user/wallet/verify-payment",
            response,
          );

          if (verifyRes.data.success) {
            showSuccessModal(verifyRes.data);
          }
        } catch {
          window.location.href = "/user/wallet/payment-failed";
        }
      },

      modal: {
        ondismiss() {
          continueBtn.disabled = false;
          continueBtn.textContent = "Proceed to Payment";
        },
      },

      theme: {
        color: "#4e5566",
      },
    };

    const razorpay = new Razorpay(options);

    razorpay.on("payment.failed", function () {
      window.location.href = "/user/wallet/payment-failed";
    });

    razorpay.open();
  } catch (err) {
    continueBtn.disabled = false;
    continueBtn.textContent = "Proceed to Payment";

    utils.showToast(
      err.response?.data?.message || "Something went wrong.",
      "error",
    );
  }
});

function showSuccessModal(data) {
  successAmount.textContent = `₹${Number(data.amount).toFixed(2)}`;
  successBalance.textContent = `₹${Number(data.balance).toFixed(2)}`;
  successTransaction.textContent = data.transactionId;
  successModal.classList.remove("hidden");
}

const failedMessage = document.getElementById("failedMessage");

function showFailedModal(message = "Your payment could not be completed.") {
  failedMessage.textContent = message;
  failedModal.classList.remove("hidden");
}

function closeSuccessModal() {
  successModal.classList.add("hidden");
}

function closeFailedModal() {
  failedModal.classList.add("hidden");
}

successBtn?.addEventListener("click", () => {
  window.location.reload();
});

backBtn?.addEventListener("click", () => {
  window.location.reload();
});
if (window.walletPaymentSuccess) {
  showSuccessModal(window.walletPaymentSuccess);
}

window.addEventListener("beforeunload", () => {
  sessionStorage.setItem("walletScrollPosition", window.scrollY);
});

window.addEventListener("load", () => {
  const scrollPosition = sessionStorage.getItem("walletScrollPosition");

  if (scrollPosition) {
    window.scrollTo({
      top: Number(scrollPosition),
      behavior: "instant",
    });

    sessionStorage.removeItem("walletScrollPosition");
  }
});
