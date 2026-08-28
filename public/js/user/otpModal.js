let interval;

let currentPurpose = "";
let currentEmail = "";

let isResending = false;
let isVerifying = false;

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

  if (otpContent) {
    otpContent.style.display = "block";
  }

  if (otpSuccess) {
    otpSuccess.style.display = "none";
  }

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

  startTimer();
}

function closeOtpModal() {
  const modal = document.getElementById("otpModal");

  if (modal) {
    modal.style.display = "none";
  }

  clearInterval(interval);

  clearOtpError();

  isResending = false;
  isVerifying = false;
}

function startTimer() {
  const timerEl = document.getElementById("timer");
  const resendBtn = document.getElementById("resendBtn");

  if (!timerEl || !resendBtn) return;

  clearInterval(interval);

  let timeLeft = 60;

  resendBtn.disabled = true;

  const update = () => {
    const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const sec = String(timeLeft % 60).padStart(2, "0");

    timerEl.textContent = `${min}:${sec}`;

    if (timeLeft <= 0) {
      clearInterval(interval);

      resendBtn.disabled = false;
      resendBtn.textContent = "Resend";

      timerEl.textContent = "00:00";

      return;
    }

    timeLeft--;
  };

  update();

  interval = setInterval(update, 1000);
}

inputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    const value = input.value.replace(/\D/g, "");

    input.value = value.slice(-1);

    if (input.value && index < inputs.length - 1) {
      inputs[index + 1].focus();
    }

    clearOtpError();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Backspace" && !input.value && index > 0) {
      inputs[index - 1].focus();
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputs[index - 1].focus();
    }

    if (event.key === "ArrowRight" && index < inputs.length - 1) {
      event.preventDefault();
      inputs[index + 1].focus();
    }
  });

  input.addEventListener("paste", (event) => {
    event.preventDefault();

    const pasted = (event.clipboardData || window.clipboardData)
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    pasted.split("").forEach((digit, i) => {
      if (inputs[i]) {
        inputs[i].value = digit;
      }
    });

    const nextIndex = Math.min(pasted.length, inputs.length - 1);

    inputs[nextIndex]?.focus();

    clearOtpError();
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
  if (isVerifying) return;

  const otp = getOtp();

  if (otp.length !== 6) {
    showOtpError("Enter complete OTP");
    return;
  }

  isVerifying = true;

  const verifyBtn = document.querySelector(".verify-btn");

  const originalText = verifyBtn?.textContent || "Verify";

  if (verifyBtn) {
    verifyBtn.disabled = true;
    verifyBtn.textContent = "Verifying...";
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

      clearInterval(interval);

      setTimeout(() => {
        if (res.data.redirect) {
          window.location.href = res.data.redirect;
        } else {
          window.location.reload();
        }
      }, 1000);

      return;
    }

    showOtpError(res.data.message || "Invalid OTP");
  } catch (err) {
    const msg = err.response?.data?.message || "Something went wrong";

    showOtpError(msg);
  } finally {
    isVerifying = false;

    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.textContent = originalText;
    }
  }
}

async function resendOtp() {
  if (isResending) return;

  if (!currentPurpose) {
    showOtpError("OTP session expired. Please try again.");
    return;
  }

  const resendBtn = document.getElementById("resendBtn");

  isResending = true;

  clearOtpError();

  if (resendBtn) {
    resendBtn.disabled = true;
    resendBtn.textContent = "Sending...";
  }

  try {
    const res = await axios.post("/user/resend-otp", {
      email: currentEmail,
      purpose: currentPurpose,
    });

    if (!res.data.success) {
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.textContent = "Resend";
      }

      showOtpError(res.data.message || "Failed to resend OTP");

      return;
    }

    resetInputs();

    startTimer();

    if (resendBtn) {
      resendBtn.textContent = "Sent ✓";
    }

    setTimeout(() => {
      if (resendBtn) {
        resendBtn.textContent = "Resend";
      }
    }, 800);
  } catch (err) {
    const message = err.response?.data?.message || "Failed to resend OTP";

    showOtpError(message);

    if (resendBtn) {
      resendBtn.disabled = false;
      resendBtn.textContent = "Resend";
    }
  } finally {
    isResending = false;
  }
}

window.openOtpModal = openOtpModal;
window.closeOtpModal = closeOtpModal;
window.verifyOtp = verifyOtp;
window.resendOtp = resendOtp;
