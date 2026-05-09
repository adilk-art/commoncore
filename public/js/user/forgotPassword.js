const form = document.getElementById("emailForm");
const emailInput = document.getElementById("email");
const errorMsg = document.getElementById("errorMsg");

const showError = (element, message) => {
  element.textContent = message;
  element.style.display = "block";
};

const clearError = (element) => {
  element.textContent = "";
  element.style.display = "none";
};

emailInput.addEventListener("input", () => clearError(errorMsg));

async function sendForgotOtp(email) {
  try {
    const res = await axios.post("/user/forgot-password", { email });
    if (res.data.success) {
      openOtpModal("forgot-password", email);
    }
  } catch (err) {
    const msg = err.response?.data?.message;
    showError(errorMsg, msg);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = emailInput.value.trim();

  if (!value) {
    showError(errorMsg, "Please enter your email address");
    return;
  }
  if (!/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(value)) {
    showError(errorMsg, "Please enter a valid email address");
    return;
  }
  sendForgotOtp(value);

  clearError(errorMsg);
});
