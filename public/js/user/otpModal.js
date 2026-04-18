let interval;
let timeLeft = 60;

let currentPurpose = "";
let currentEmail = "";

/* =====================
   OPEN MODAL
===================== */
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
  startTimer();
}

/* =====================
   CLOSE MODAL
===================== */
function closeOtpModal() {
  document.getElementById("otpModal").style.display = "none";
  clearInterval(interval);
}

/* =====================
   TIMER
===================== */
function startTimer() {
  const timerEl = document.getElementById("timer");
  const resendBtn = document.getElementById("resendBtn");

  clearInterval(interval);
  timeLeft = 60;

  resendBtn.disabled = true;
  resendBtn.classList.remove("active");

  interval = setInterval(() => {
    let min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    let sec = String(timeLeft % 60).padStart(2, "0");

    timerEl.textContent = `${min}:${sec}`;

    if (timeLeft <= 0) {
      clearInterval(interval);
      timerEl.textContent = "00:00";
      resendBtn.disabled = false;
      resendBtn.classList.add("active");
      return;
    }

    timeLeft--;
  }, 1000);
}

/* =====================
   OTP INPUT HANDLING
===================== */
const inputs = document.querySelectorAll(".otp-inputs input");

inputs.forEach((input, i) => {
  input.addEventListener("input", () => {
    if (input.value && i < inputs.length - 1) {
      inputs[i + 1].focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && i > 0) {
      inputs[i - 1].focus();
    }
  });
});

function resetInputs() {
  inputs.forEach(i => i.value = "");
  inputs[0]?.focus();
}

/* =====================
   GET OTP
===================== */
function getOtp() {
  return Array.from(inputs).map(i => i.value).join("");
}

/* =====================
   VERIFY OTP
===================== */
async function verifyOtp() {
  const otp = getOtp();

  try {
    const res = await axios.post("/user/signup/verify-otp", {
      otp,
      purpose: currentPurpose
    });

    if (res.data.success) {
      window.location.href = "/user/login";
    }
  } catch (err) {
    console.log(err.response?.data?.errors);
  }
}

/* =====================
   RESEND OTP
===================== */
async function resendOtp() {
  try {
    await axios.post("/user/signup/initiate", {
      email: currentEmail
    });

    startTimer();
  } catch (err) {
    console.log(err.response?.data);
  }
}

/* =====================
   GLOBAL EXPORT
===================== */
window.openOtpModal = openOtpModal;
window.closeOtpModal = closeOtpModal;
window.verifyOtp = verifyOtp;
window.resendOtp = resendOtp;