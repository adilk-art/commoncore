function openEmailModal() {
  document.getElementById("emailModal").style.display = "block";
}

function closeEmailModal() {
  document.getElementById("emailModal").style.display = "none";
  resetModal();
}

function resetModal() {
  document.getElementById("stepEmail").style.display = "block";
  document.getElementById("stepOtp").style.display = "none";

  document.getElementById("newEmail").value = "";
  document.getElementById("otp").value = "";

  document.getElementById("otpMsg").innerText = "";
  document.getElementById("emailError").innerText = "";
  document.getElementById("emailError").style.display = "none";
}

let currentEmail = "";

async function sendOtp() {
  currentEmail = document.getElementById("newEmail").value.trim();
  const emailError = document.getElementById("emailError");
  const btn = document.querySelector("#stepEmail button");

  emailError.style.display = "none";
  emailError.innerText = "";

  if (!currentEmail) {
    emailError.innerText = "Email is required";
    emailError.style.display = "block";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(currentEmail)) {
    emailError.innerText = "Enter a valid email address";
    emailError.style.display = "block";
    return;
  }

  btn.disabled = true;
  btn.innerText = "Sending...";

  try {
    const res = await fetch("/user/profile/email-change", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ newEmail: currentEmail })
    });

    const data = await res.json();

    if (data.success) {
      document.getElementById("stepEmail").style.display = "none";
      document.getElementById("stepOtp").style.display = "block";
      startTimer();
    } else {
      emailError.innerText = data.message;
      emailError.style.display = "block";
    }

  } catch (err) {
    emailError.innerText = "Something went wrong. Please try again.";
    emailError.style.display = "block";
  }

  btn.disabled = false;
  btn.innerText = "Send OTP";
}

async function verifyOtp() {
  const otp = document.getElementById("otp").value.trim();
  const otpMsg = document.getElementById("otpMsg");

  otpMsg.innerText = "";

  if (!otp) {
    otpMsg.innerText = "OTP is required";
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    otpMsg.innerText = "Enter a valid 6-digit OTP";
    return;
  }

  const res = await fetch("/user/profile/email-change-verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({
      email: currentEmail,
      otp,
      purpose: "email-change"
    })
  });

  const data = await res.json();

  if (data.success) {
    alert("Email updated successfully");
    closeEmailModal();
    location.reload();
  } else {
    otpMsg.innerText = data.message;
  }
}

let timer;
let timeLeft = 60;

function startTimer() {
  const btn = document.getElementById("resendBtn");
  const text = document.getElementById("timerText");

  btn.disabled = true;
  timeLeft = 60;

  clearInterval(timer);

  timer = setInterval(() => {
    timeLeft--;

    text.innerText = `Resend OTP in ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      btn.disabled = false;
      text.innerText = "You can resend OTP now";
    }
  }, 1000);
}