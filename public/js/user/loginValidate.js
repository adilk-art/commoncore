const form = document.getElementById("form");
const email = document.getElementById("email");
const password = document.getElementById("password");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const serverErrorMessage = document.getElementById("serverError");

const showError = (element, message) => {
  element.textContent = message;
  element.style.display = "block";
};
function clearError(element) {
  element.textContent = "";
  element.style.display = "none";
}
function clearServerError() {
  serverErrorMessage.style.display = "none";
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
  if (value.length < 6) {
    showError(passwordError, "Password must be atleast 6 characters");
    return false;
  }
  clearError(passwordError);
  return true;
}

[email, password].forEach((element) => {
  element.addEventListener("input", clearServerError);
});
email.addEventListener("blur", validateEmail);
password.addEventListener("blur", validatePassword);

form.addEventListener("submit", (event) => {
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();

  if (!isEmailValid || !isPasswordValid) {
    event.preventDefault();
  }
});
