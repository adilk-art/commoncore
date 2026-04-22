function validateLoginForm(email, password) {
  const errors = {};

  if (!email) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Invalid email format";
  }

  if (!password) {
    errors.password = "Password is required";
  } else {
    if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } 
    else if (!/[0-9]/.test(password)) {
      errors.password = "Password must contain at least one number";
    } 
    else if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
      errors.password = "Password must contain at least one special character";
    }
  }

  return errors;
}

document.querySelector("form").addEventListener("submit", (e) => {
  e.preventDefault();
  document.getElementById("emailError").innerText = "";
  document.getElementById("passwordError").innerText = "";
  document.getElementById("generalError").innerText = "";

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const errors = validateLoginForm(email, password);

    // show errors
  if (errors.email) {
    document.getElementById("emailError").innerText = errors.email;
  }

  if (errors.password) {
    document.getElementById("passwordError").innerText = errors.password;
  }

  if (Object.keys(errors).length > 0) return;

  e.target.submit();
});

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

emailInput.addEventListener("input", () => {
  document.getElementById("emailError").innerText = "";
  document.getElementById("generalError").innerText = "";
});

passwordInput.addEventListener("input", () => {
  document.getElementById("passwordError").innerText = "";
  document.getElementById("generalError").innerText = "";
});