let interval;

let currentPurpose = "";
let currentEmail = "";

const inputs = document.querySelectorAll(".otp-inputs input");
const otpError = document.getElementById("otpError");

function openOtpModal(purpose, email = "") {
  currentPurpose = purpose;
  currentEmail = email;

  const modal = document.getElementById("otpModal");
  const otpContent = document.getElementById("otpContent");
  const otpSuccess = document.getElementById("otpSuccess");
  const otpPurpose = document.getElementById("otpPurpose");

  if (!modal) return;

  modal.style.display = "flex";

  if (otpContent) otpContent.style.display = "block";
  if (otpSuccess) otpSuccess.style.display = "none";

  if (otpPurpose) {
    if (purpose === "signup") {
      otpPurpose.innerText = "Verify your signup OTP";
    } else if (purpose === "forgot-password") {
      otpPurpose.innerText = "Verify password reset OTP";
    } else if (purpose === "email-change") {
      otpPurpose.innerText = "Verify your new email";
    } else {
      otpPurpose.innerText = "Enter OTP sent to your email";
    }
  }

  resetInputs();
  clearOtpError();

  requestAnimationFrame(() => {
    startTimer();
  });
}

function closeOtpModal() {
  const modal = document.getElementById("otpModal");

  if (modal) {
    modal.style.display = "none";
  }

  clearInterval(interval);
  clearOtpError();
}

function startTimer() {
  const timerEl = document.getElementById("timer");
  const resendBtn = document.getElementById("resendBtn");

  if (!timerEl || !resendBtn) return;

  clearInterval(interval);

  let timeLeft = 59;

  resendBtn.disabled = true;

  const update = () => {
    const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");

    const sec = String(timeLeft % 60).padStart(2, "0");

    timerEl.textContent = `${min}:${sec}`;

    if (timeLeft <= 0) {
      clearInterval(interval);
      resendBtn.disabled = false;
      timerEl.textContent = "00:00";
      return;
    }

    timeLeft--;
  };

  update();

  interval = setInterval(update, 1000);
}

inputs.forEach((input, i) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^0-9]/g, "");

    if (input.value && i < inputs.length - 1) {
      inputs[i + 1].focus();
    }

    clearOtpError();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && i > 0) {
      inputs[i - 1].focus();
    }
  });
});

function resetInputs() {
  inputs.forEach((input) => {
    input.value = "";
  });

  inputs[0]?.focus();
}

function getOtp() {
  return Array.from(inputs)
    .map((input) => input.value)
    .join("");
}

function showOtpError(message) {
  if (!otpError) return;

  otpError.textContent = message;
  otpError.style.display = "block";
}

function clearOtpError() {
  if (!otpError) return;

  otpError.textContent = "";
  otpError.style.display = "none";
}

async function verifyOtp() {
  const otp = getOtp();

  if (otp.length !== 6) {
    showOtpError("Enter complete OTP");

    return;
  }

  try {
    const res = await axios.post("/user/verify-otp", {
      otp,
      purpose: currentPurpose,
    });

    if (res.data.success) {
      const otpContent = document.getElementById("otpContent");

      const successBox = document.getElementById("otpSuccess");

      if (otpContent) {
        otpContent.style.display = "none";
      }

      if (successBox) {
        successBox.style.display = "block";
      }

      setTimeout(() => {
        if (res.data.redirect) {
          window.location.href = res.data.redirect;
        } else {
          window.location.reload();
        }
      }, 1000);
    }
  } catch (err) {
    const msg = err.response?.data?.message || "Something went wrong";

    showOtpError(msg);
  }
}

async function resendOtp() {
  const resendBtn = document.getElementById("resendBtn");

  if (!currentPurpose) {
    showOtpError("OTP session expired. Please try again.");

    return;
  }

  if (resendBtn) {
    resendBtn.disabled = true;
    resendBtn.textContent = "Sending...";
  }

  clearOtpError();

  try {
    const res = await axios.post("/user/resend-otp", {
      email: currentEmail,
      purpose: currentPurpose,
    });

    if (res.data.success) {
      resetInputs();
      startTimer();
    }
  } catch (err) {
    showOtpError(err.response?.data?.message || "Failed to resend OTP");

    if (resendBtn) {
      resendBtn.disabled = false;
    }
  } finally {
    if (resendBtn) {
      resendBtn.textContent = "Resend OTP";
    }
  }
}

window.openOtpModal = openOtpModal;
window.closeOtpModal = closeOtpModal;
window.verifyOtp = verifyOtp;
window.resendOtp = resendOtp;
