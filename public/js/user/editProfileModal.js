

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
}

let currentEmail = "";

async function sendOtp() {
  currentEmail = document.getElementById("newEmail").value.trim();

  if (!currentEmail) {
    document.getElementById("otpMsg").innerText = "Email is required";
    return;
  }

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
      document.getElementById("emailError").innerText = data.message;
    }

  } catch (err) {
    document.getElementById("emailError").innerText =
      "Something went wrong. Please try again.";
  }
}



async function verifyOtp() {
  const otp = document.getElementById("otp").value;

  const res = await fetch("/user/profile/email-change-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json",
        "Accept":"application/json"
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
    document.getElementById("otpMsg").innerText = data.message;
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


