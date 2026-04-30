document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addressForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    // e.preventDefault();

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
      const formData = new FormData(form);
      console.log(formData);
      const data = Object.fromEntries(formData.entries());

      data.isDefault = form.isDefault.checked;

      const addressId = formData.get("addressId");
      try {
        const res = await axios.patch(
          `/user/address/update/${addressId}`,
          data,
        );
        window.location.href = "/user/address";
      } catch (err) {
        errors.forEach((e) => {
          const errors = err.response.data.errors;
          const field = e.path[0];
          const message = e.message;

          showError(field + "Error", message);
        });
      }
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
