document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addressForm");

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // CLEAR ERRORS
    document.querySelectorAll(".error-msg").forEach((el) => {
      el.innerText = "";
      el.style.display = "none";
    });

    let isValid = true;

    const fullName = form.fullName.value.trim();
    const phone = form.phone.value.trim();
    const line1 = form.line1.value.trim();
    const city = form.city.value.trim();
    const state = form.state.value.trim();
    const pincode = form.pincode.value.trim();

    if (fullName.length < 3) {
      showError("fullNameError", "Minimum 3 characters required");
      isValid = false;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      showError("phoneError", "Invalid phone number");
      isValid = false;
    }

    if (line1.length < 3) {
      showError("line1Error", "Address is required");
      isValid = false;
    }

    if (city.length < 2) {
      showError("cityError", "City is required");
      isValid = false;
    }

    if (state.length < 2) {
      showError("stateError", "State is required");
      isValid = false;
    }

    if (!/^\d{6}$/.test(pincode)) {
      showError("pincodeError", "Invalid pincode");
      isValid = false;
    }

    if (isValid) {
      form.submit();
    }
  });
});

function showError(id, message) {
  const el = document.getElementById(id);
  if (el) {
    el.innerText = message;
    el.style.display = "block";
  }
}
