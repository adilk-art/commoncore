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

function showError(element, message) {
  element.textContent = message;
  element.style.display = "block";
}

function clearError(element) {
  element.textContent = "";
  element.style.display = "none";
}
function clearServerError() {
  serverErrorMessage.style.display = "none";
}
function validateName() {
  const value = name.value.trim();
  if (!value) {
    showError(nameError, "Name is required");
    return false;
  }
  if (value.length < 3) {
    showError(nameError, "Name Must be at least 3 Characters");
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
    showError(emailError, "Email is Required");
    return false;
  }
  if (!/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(value)) {
    showError(emailError, "Please enter a valid Email address");
    return false;
  }
  clearError(emailError);
  return true;
}

function validatePassword() {
  const value = password.value;
  if (!value) {
    showError(passwordError, "Password is Required");
    return false;
  }
  if (/\s/.test(value)) {
    showError(passwordError, "Password cannot contain whitespaces");
    return false;
  }
  if (value.length < 6) {
    showError(passwordError, "Password must be at least 6 characters");
    return false;
  }
  if (!/[0-9]/.test(value)) {
    showError(passwordError, "password must contain atleast one number");
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

name.addEventListener("blur", validateName);
email.addEventListener("blur", validateEmail);
password.addEventListener("blur", validatePassword);
confirmPassword.addEventListener("blur", validateConfirmPassword);
[name, email, password, confirmPassword].forEach((element) => {
  element.addEventListener("input", clearServerError);
});

form.addEventListener("submit", (event) => {
  const isNameValid = validateName();
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();
  const isConfirmPasswordValid = validateConfirmPassword();

  if (
    !isNameValid ||
    !isEmailValid ||
    !isPasswordValid ||
    !isConfirmPasswordValid
  ) {
    event.preventDefault();
  }
});
