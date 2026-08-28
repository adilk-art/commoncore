const form = document.getElementById("signupForm");

const name = document.getElementById("name");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

const serverErrorMessage = document.getElementById("serverError");

const nameError = document.getElementById("nameError");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const confirmPasswordError = document.getElementById("confirmPasswordError");
const referralCodeError = document.getElementById("referralCodeError");

const passwordEye = document.getElementById("passwordEye");
const confirmPasswordEye = document.getElementById("confirmPassEye");

const referralCode = document.getElementById("referralCode");
const createBtn = form?.querySelector(".create-btn");

let buttonLoadingInterval = null;

passwordEye?.addEventListener("click", () => {
  const isPassword = password.type === "password";

  password.type = isPassword ? "text" : "password";

  passwordEye.innerHTML = isPassword
    ? `<i class="fa-regular fa-eye-slash"></i>`
    : `<i class="fa-regular fa-eye"></i>`;

  passwordEye.setAttribute(
    "aria-label",
    isPassword ? "Hide password" : "Show password",
  );
});

confirmPasswordEye?.addEventListener("click", () => {
  const isPassword = confirmPassword.type === "password";

  confirmPassword.type = isPassword ? "text" : "password";

  confirmPasswordEye.innerHTML = isPassword
    ? `<i class="fa-regular fa-eye-slash"></i>`
    : `<i class="fa-regular fa-eye"></i>`;

  confirmPasswordEye.setAttribute(
    "aria-label",
    isPassword ? "Hide password" : "Show password",
  );
});

function showError(element, message) {
  if (!element) return;

  element.textContent = message;
  element.style.display = "block";
}

function clearError(element) {
  if (!element) return;

  element.textContent = "";
  element.style.display = "none";
}

function clearServerError() {
  if (!serverErrorMessage) return;

  serverErrorMessage.textContent = "";
  serverErrorMessage.style.display = "none";
}

function startButtonLoading() {
  if (!createBtn) return;

  clearInterval(buttonLoadingInterval);

  createBtn.disabled = true;
  createBtn.classList.add("loading");

  let dots = "";

  createBtn.textContent = "Sending";

  buttonLoadingInterval = setInterval(() => {
    dots = dots.length >= 3 ? "" : dots + ".";
    createBtn.textContent = `Sending OTP${dots}`;
  }, 300);
}

function stopButtonLoading() {
  if (!createBtn) return;

  clearInterval(buttonLoadingInterval);

  buttonLoadingInterval = null;

  createBtn.disabled = false;
  createBtn.classList.remove("loading");
  createBtn.textContent = "Create Account";
}

function validateName() {
  const value = name.value.trim();

  if (!value) {
    showError(nameError, "Name is required");
    return false;
  }

  if (value.length < 3) {
    showError(nameError, "Name must be at least 3 characters");
    return false;
  }

  if (!/^[A-Za-z\s]+$/.test(value)) {
    showError(nameError, "Name can only contain letters");
    return false;
  }

  clearError(nameError);
  return true;
}

function validateEmail() {
  const value = email.value.trim();

  if (!value) {
    showError(emailError, "Email is required");
    return false;
  }

  if (!/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(value)) {
    showError(emailError, "Please enter a valid email address");
    return false;
  }

  clearError(emailError);
  return true;
}

function validatePassword() {
  const value = password.value;

  if (!value) {
    showError(passwordError, "Password is required");
    return false;
  }

  if (/\s/.test(value)) {
    showError(passwordError, "Password cannot contain whitespaces");
    return false;
  }

  if (value.length < 8) {
    showError(passwordError, "Password must be at least 8 characters");
    return false;
  }

  if (!/[0-9]/.test(value)) {
    showError(passwordError, "Password must contain at least one number");
    return false;
  }

  if (!/[@$!%*?&]/.test(value)) {
    showError(passwordError, "Password must contain a special character");
    return false;
  }

  clearError(passwordError);
  return true;
}

function validateConfirmPassword() {
  const value = confirmPassword.value;

  if (!value) {
    showError(confirmPasswordError, "Please confirm your password");
    return false;
  }

  if (value !== password.value) {
    showError(confirmPasswordError, "Passwords do not match");
    return false;
  }

  clearError(confirmPasswordError);
  return true;
}

referralCode?.addEventListener("input", () => {
  referralCode.value = referralCode.value.toUpperCase();

  clearError(referralCodeError);
  clearServerError();
});

name?.addEventListener("input", () => {
  clearError(nameError);
  clearServerError();
});

email?.addEventListener("input", () => {
  clearError(emailError);
  clearServerError();
});

password?.addEventListener("input", () => {
  clearError(passwordError);
  clearServerError();
});

confirmPassword?.addEventListener("input", () => {
  clearError(confirmPasswordError);
  clearServerError();
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (createBtn?.disabled) return;

  clearServerError();

  const isNameValid = validateName();
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();
  const isConfirmPasswordValid = validateConfirmPassword();

  const isFormValid =
    isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid;

  if (!isFormValid) return;

  startButtonLoading();

  try {
    const res = await axios.post("/user/signup/initiate", {
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
      confirmPassword: confirmPassword.value,
      referralCode: referralCode?.value.trim() || "",
    });

    if (res.data.success) {
      stopButtonLoading();

      openOtpModal("signup", email.value.trim());

      return;
    }

    stopButtonLoading();

    showError(serverErrorMessage, res.data.message || "Unable to send OTP.");
  } catch (err) {
    stopButtonLoading();

    const data = err.response?.data;

    if (data?.errors) {
      Object.keys(data.errors).forEach((field) => {
        if (field === "general") {
          showError(serverErrorMessage, data.errors[field]);
          return;
        }

        const element = document.getElementById(`${field}Error`);

        if (element) {
          showError(element, data.errors[field]);
        }
      });

      return;
    }

    showError(
      serverErrorMessage,
      data?.message || "Unable to send OTP. Please try again.",
    );
  }
});
