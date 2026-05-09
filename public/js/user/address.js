document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addressForm");
  if (!form) return;
  const addAddressBtn = document.getElementById("addAddressBtn"); //add button in card when empty state
  const addAddressBtnEmpty = document.getElementById("addAddressBtnEmpty");
  const cancelBtn = document.getElementById("cancelAddressBtn");
  const addAddressCard = document.getElementById("addAddressCard");
  const formTitle = document.querySelector(".add-address-card h3");
  function openAddForm() {
    form.reset();
    clearErrors();
    document.getElementById("addressList")?.classList.add("form-open");
      document.querySelector(".right-section").classList.add("active");
    document.getElementById("addressId").value = ""; //empty value for address id because it is newly adding one
    addAddressCard.style.display = "block";
    formTitle.innerText = "Add New Address";
  }
  addAddressBtn?.addEventListener("click", openAddForm);
  addAddressBtnEmpty?.addEventListener("click", openAddForm);
  cancelBtn?.addEventListener("click", () => {
    document.getElementById("addressList")?.classList.remove("form-open");
      document.querySelector(".right-section").classList.remove("active");
    addAddressCard.style.display = "none";

    form.reset();
    document.getElementById("addressId").value = "";
  });
  document.querySelectorAll(".editAddressBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      addAddressCard.style.display = "block";
      document.getElementById("addressList")?.classList.add("form-open");
      document.querySelector(".right-section").classList.add("active");
      formTitle.innerText = "Edit Address";
      document.getElementById("addressId").value = btn.dataset.id; //value for addresId from edit button
      form.fullName.value = btn.dataset.fullname;
      form.phone.value = btn.dataset.phone;
      form.line1.value = btn.dataset.line1;
      form.line2.value = btn.dataset.line2;
      form.city.value = btn.dataset.city;
      form.state.value = btn.dataset.state;
      form.pincode.value = btn.dataset.pincode;
      form.isDefault.checked = btn.dataset.default === "true";
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

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

      const data = Object.fromEntries(formData.entries());

      data.isDefault = form.isDefault.checked;

      const addressId = document.getElementById("addressId").value;

      try {
        if (addressId) {     //edit route for addressId active
                            
          await axios.patch(`/user/address/update/${addressId}`, data);
          utils.showToast("Address updated successfully", "success");

        } else {
          await axios.post("/user/address/add", data);
          utils.showToast("Address added successfully", "success");
        }
      document.getElementById("addressList")?.classList.remove("form-open");
      document.querySelector(".right-section").classList.remove("active");
       setTimeout(() => {
        window.location.href = "/user/address";
      }, 1200);
      } catch (err) {
        const errors = err.response?.data?.errors || [];

        errors.forEach((e) => {
          const field = e.path[0];

          const message = e.message;

          showError(field + "Error", message);
          utils.showToast(message, "error");
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

function clearErrors() {
  document.querySelectorAll(".error-msg").forEach((el) => {
    el.innerText = "";
    el.style.display = "none";
  });
}

let deleteId = "";

function openDeleteModal(id) {
  deleteId = id;
  document.getElementById("deleteModal").style.display = "block";
}

function closeDeleteModal() {
  document.getElementById("deleteModal").style.display = "none";
  deleteId = "";
}

async function confirmDelete() {
  if (deleteId) {
    try {
      await axios.delete(`/user/address/delete/${deleteId}`);
      utils.showToast("Address deleted successfully", "success");

      setTimeout(() => {
        window.location.href = "/user/address";
      }, 1200);
    } catch (err) {
      utils.showToast("Error deleting address", "error");
    }
  }
}

async function setDefault(addressId) {
  try {
    await axios.patch(`/user/address/default/${addressId}`);

    utils.showToast("Default address updated", "success");

    setTimeout(() => {
      window.location.href = "/user/address";
    }, 1200);
  } catch (err) {
    utils.showToast("Error setting default address", "error");
  }
}
