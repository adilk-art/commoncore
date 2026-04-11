const otpInput = document.getElementById("otp");
const otpForm = document.getElementById("otpForm");
const otpError = document.getElementById("otpError");
const resendButton = document.getElementById("resendBtn");
const countDown = document.getElementById("countdown");

let timer;
let timeLeft = 60;
function startTimer() {
  clearInterval(timer);
  timeLeft = 60;
  resendButton.disabled = true;

  timer = setInterval(() => {
    timeLeft--;
    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, 0); //pad start used to always use 2 digits,use leading 0 if no 2digit
    const seconds = String(Math.floor(timeLeft % 60)).padStart(2, 0);
    countDown.textContent = `Resend OTP in ${minutes}:${seconds}`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      countDown.textContent = "";
      resendButton.disabled = false; //enabled resend button
    }
  }, 1000);
}

startTimer()

otpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (otpInput.value.length < 6) {
    otpError.className = "error-msg error";
    otpError.textContent = "Please enter the complete 6 digit otp";
    otpError.style.display = "block";
    return;
  }

  if (!/^[0-9]{6}$/.test(otpInput.value)) {
    otpError.className = "error-msg error";
    otpError.textContent = "Otp must contain numbers only";
    otpError.style.display = "block";
    return;
  }
  try {
    const email = document.getElementById("hiddenEmail").value;
    const purpose = document.getElementById("hiddenPurpose").value;
    const otp = otpInput.value;

    res = await fetch("/user/verify-otp", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ email, purpose, otp }),
    });

    const data = await res.json();

    if (data.success) {
      if(purpose==='forgot-password'){
        window.location.href = '/user/reset-password';
      }else{

        window.location.href = "/user/login";
      }
    } else {
      otpError.className = "error-msg error";
      otpError.textContent = data.message;
      otpError.style.display = "block";
    }
  } catch (error) {
    otpError.className = "error-msg error";
    otpError.textContent = "Something went wrong,please try again";
    otpError.display.style = "block";
  }
});

resendButton.addEventListener("click", async () => {
  resendButton.disabled = true;
  startTimer();
  const email = document.getElementById("hiddenEmail").value; //getting the value of email recieved from backend
  const purpose = document.getElementById("hiddenPurpose").value;
  try {
    const res = await fetch("/user/resend-otp", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ email, purpose }),
    });
    const data = await res.json();
    if (data.success) {
      // startTimer();
      otpInput.focus();
      otpInput.value = "";
      otpError.textContent = "New OTP has been sent to your gmail";
      otpError.className = "error-msg success";
      otpError.style.display = "block";
    } else {
      otpError.className = "error-msg error";
      otpError.textContent = data.message || "Failed to resend OTP";
      otpError.style.display = "block";
      resendButton.disabled = false;
    }
  } catch (err) {
    otpError.className = "error-msg error";
    otpError.textContent = "something went wrong resend,please try again";
    otpError.display.style = "block";
    resendButton.disabled = false;
  }
});
