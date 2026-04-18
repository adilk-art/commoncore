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
const passwordEye = document.getElementById("passwordEye");
const confirmPasswordEye = document.getElementById("confirmPassEye");


passwordEye.addEventListener("click", () => {
  const isPassword = password.type === "password";
  password.type = isPassword ? "text" : "password";
  passwordEye.innerHTML = isPassword
    ? `<i class="fa-regular fa-eye-slash"></i>`
    : `<i class="fa-regular fa-eye"></i>`;
});
confirmPasswordEye.addEventListener("click", () => {
  const isPassword = confirmPassword.type === "password";
  confirmPassword.type = isPassword ? "text" : "password";
  confirmPasswordEye.innerHTML = isPassword
    ? `<i class="fa-regular fa-eye-slash"></i>`
    : `<i class="fa-regular fa-eye"></i>`;
});

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
  if (value.length < 8) {
    showError(passwordError, "Password must be at least 8 characters");
    return false;
  }
  if (!/[0-9]/.test(value)) {
    showError(passwordError, "password must contain atleast one number");
    return false;
  }
  if (!/[@$!%*?&]/.test(value)) {
    showError(passwordError, "password must contain special character");
    clearServerError();
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

name.addEventListener("input", () => clearError(nameError));
email.addEventListener("input", () => clearError(emailError));
password.addEventListener("input", () => clearError(passwordError));
confirmPassword.addEventListener("input", () =>
  clearError(confirmPasswordError),
);

[name, email, password, confirmPassword].forEach((element) => {
  element.addEventListener("input", clearServerError);
});

const fieldMap = [
  { input: name, error: nameError },
  { input: email, error: emailError },
  { input: password, error: passwordError },
  { input: confirmPassword, error: confirmPasswordError },
];

fieldMap.forEach(({ input, error }) => {
  input.addEventListener("input", () => clearError(error));
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearServerError();
  const isNameValid = validateName();
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();
  const isConfirmPasswordValid = validateConfirmPassword();

  const isFormValid =
    isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid;

  if (!isFormValid) return;

  try {
    const res = await axios.post("/user/signup/initiate", {
      name: name.value,
      email: email.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
    });
  
   if (res.data.success) {
      openOtpModal("signup",email.value);
    }
  } catch (err) {
    console.log(err);
    const data = err.response?.data;
    if (data?.errors) {
      Object.keys(data.errors).forEach((field) => {
        if (field === "general") {
          showError(serverErrorMessage, data.errors[field]);
        } else {
          const el = document.getElementById(field + "Error");
          if (el) showError(el, data.errors[field]);
        }
      });
    }
  }

});
