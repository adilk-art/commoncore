function openEmailModal() {
  document.getElementById("emailModal").style.display = "flex";

  document.getElementById("step1").style.display = "block";
  document.getElementById("step2").style.display = "none";

  clearErrors();
}

function closeEmailModal() {
  document.getElementById("emailModal").style.display = "none";
  document.getElementById("confirmPassword").value = "";
}

function clearErrors() {
  document.getElementById("passwordError").textContent = "";
  document.getElementById("emailError").textContent = "";
}

async function verifyPasswordStep() {
  const password = document.getElementById("confirmPassword").value;
  const passwordError = document.getElementById("passwordError");
  passwordError.textContent = "";
  if (!password) {
    passwordError.textContent = "Password is required";
    passwordError.style.display = "block";
    return;
  }

  try {
    await axios.post("/user/profile/verify-password", { password });

    document.getElementById("step1").style.display = "none";
    document.getElementById("step2").style.display = "block";
  } catch (err) {
    passwordError.textContent =
      err.response?.data?.message || "Incorrect password";
    passwordError.style.display = "block";
  }
}

async function sendOtp() {
  const email = document.getElementById("newEmail").value;
  const emailError = document.getElementById("emailError");

  emailError.textContent = "";

  if (!email) {
    emailError.textContent = "Email is required";
    emailError.style.display = "block";
    return;
  }

  try {
    const res = await axios.post("/user/profile/email-change", {
      email,
    });

    if (res.data.success) {
      closeEmailModal();
      openOtpModal("email-change", email);
    }
  } catch (err) {
    const msg = err.response?.data?.message || "Something went wrong";
    emailError.textContent = msg;
    emailError.style.display = "block";
  }
}

document.getElementById("confirmPassEye").addEventListener("click", () => {
  const input = document.getElementById("confirmPassword");
  const icon = document.querySelector("#confirmPassEye i");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
});
