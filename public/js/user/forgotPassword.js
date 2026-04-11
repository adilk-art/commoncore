const form       = document.getElementById("emailForm");
const emailInput = document.getElementById("email");
const errorMsg   = document.getElementById("errorMsg");

const showError = (element, message) => {
  element.textContent = message;
  element.style.display = "block";
};

const clearError = (element) => {
  element.textContent = "";
  element.style.display = "none";
};

emailInput.addEventListener('input', () => clearError(errorMsg));

form.addEventListener('submit', (e) => {
  const value = emailInput.value.trim();

  if (!value) {
    e.preventDefault();
    showError(errorMsg, 'Please enter your email address');
    return;
  }
  if (!/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(value)) {
    e.preventDefault();
    showError(errorMsg, 'Please enter a valid email address');
    return;
  }
  clearError(errorMsg);
});