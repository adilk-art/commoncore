let interval;

let currentPurpose = "";
let currentEmail = "";


const inputs = document.querySelectorAll(".otp-inputs input");
const otpError = document.getElementById("otpError");

function openOtpModal(purpose, email) {

  currentPurpose = purpose;
  currentEmail = email;

  const modal = document.getElementById("otpModal");
  modal.style.display = "flex";

  document.getElementById("otpPurpose").innerText =
    purpose === "signup"
      ? "Verify your signup OTP"
      : "Enter OTP sent to your email";

  resetInputs();

  requestAnimationFrame(() => {
    startTimer();
  });
}

function closeOtpModal() {
  document.getElementById("otpModal").style.display = "none";
  clearInterval(interval);
  clearOtpError();
}

function startTimer() {
  const timerEl = document.getElementById("timer");
  const resendBtn = document.getElementById("resendBtn");

  clearInterval(interval);
  let timeLeft = 59;

  resendBtn.disabled = true;


  const update=() => {
    let min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    let sec = String(timeLeft % 60).padStart(2, "0");

    timerEl.textContent = `${min}:${sec}`;

    if (timeLeft <= 0) {
      clearInterval(interval);
      resendBtn.disabled = false;
      timerEl.textContent = "00:00";
      return;
    }

    timeLeft--;
  };
  update()
  interval=setInterval(update,1000)
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
  inputs.forEach((i) => (i.value = ""));
  inputs[0]?.focus();
}

function getOtp() {
  return Array.from(inputs)
    .map((i) => i.value)
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
      document.getElementById("otpContent").style.display = "none";
      document.getElementById("otpSuccess").style.display = "block";
      // closeOtpModal();
     setTimeout(() => {
  document.getElementById("otpContent").style.display = "none";

  const successBox = document.getElementById("otpSuccess");
 
    successBox.style.display = "block";

  setTimeout(() => {
    window.location.href = res.data.redirect;
  }, 500);

}, 3000);
    }

  } catch (err) {
  const msg = err.response?.data?.message || "Something went wrong";
  showError(document.getElementById("otpError"), msg);
}
}

async function resendOtp() {
  try {
    await axios.post("/user/resend-otp", {
      email:currentEmail,
      purpose: currentPurpose,
    });

    startTimer(); // restart timer

  } catch (err) {
    showOtpError("Failed to resend OTP");
  }
}

// ===== Make functions global =====
window.openOtpModal = openOtpModal;
window.closeOtpModal = closeOtpModal;
window.verifyOtp = verifyOtp;
window.resendOtp = resendOtp;