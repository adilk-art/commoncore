const form = document.getElementById("resetForm");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const errorMsg = document.getElementById("errorMsg");

function showError(element, message) {
  element.textContent = message;
  element.style.display = "block";
}

function clearError(element) {
  element.textContent = "";
  element.style.display = "none";
}

function validatePassword() {
  const value = password.value;
  if (!value) {
    showError(errorMsg, "Password is Required");
    return false;
  }
  if (/\s/.test(value)) {
    showError(errorMsg, "Password cannot contain whitespaces");
    return false;
  }
  if (value.length < 6) {
    showError(errorMsg, "Password must be at least 6 characters");
    return false;
  }
  if (!/[0-9]/.test(value)) {
    showError(errorMsg, "password must contain atleast one number");
    return false;
  }

  clearError(errorMsg);
  return true;
}

function validateConfirmPassword() {
  const value = confirmPassword.value;
  if (!value) {
    showError(errorMsg, "Please confirm your password");
    return false;
  }
  if (value !== password.value) {
    showError(errorMsg, "Passwords do not match");
    return false;
  }
  clearError(errorMsg);
  return true;
}

password.addEventListener("blur", validatePassword);
confirmPassword.addEventListener("blur", validateConfirmPassword);

form.addEventListener("submit", function (e) {
  const isPasswordValid=validatePassword();
  const isConfirmPasswordValid=validateConfirmPassword();
  if(!isPasswordValid||!isConfirmPasswordValid){
    e.preventDefault()
  }
});
