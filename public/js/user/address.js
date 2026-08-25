document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addressForm");
  const modal = document.getElementById("addressModal");
  const modalTitle = document.getElementById("addressModalTitle");
  const addBtn = document.getElementById("addAddressBtn");
  const emptyAddBtn = document.getElementById("addAddressBtnEmpty");
  const closeBtn = document.getElementById("closeAddressModal");
  const cancelBtn = document.getElementById("cancelAddressBtn");
  const saveBtn = document.getElementById("saveAddressBtn");
  const addressId = document.getElementById("addressId");

  if (!form || !modal) return;

  function clearErrors() {
    form.querySelectorAll(".error-msg").forEach((el) => {
      el.textContent = "";
      el.style.display = "none";
    });

    form.querySelectorAll(".input-error").forEach((input) => {
      input.classList.remove("input-error");
    });
  }

  function showError(id, message) {
    const el = document.getElementById(id);

    if (!el) return;

    el.textContent = message;
    el.style.display = "block";

    const fieldName = id.replace("Error", "");

    form.elements[fieldName]?.classList.add("input-error");
  }

  function openAddModal() {
    form.reset();
    clearErrors();

    addressId.value = "";
    modalTitle.textContent = "Add New Address";
    saveBtn.textContent = "Save Address";

    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      form.fullName.focus();
    }, 100);
  }

  function closeAddressModal() {
    if (saveBtn.disabled) return;

    modal.classList.remove("active");
    document.body.style.overflow = "";

    form.reset();
    clearErrors();
    addressId.value = "";
  }

  addBtn?.addEventListener("click", openAddModal);
  emptyAddBtn?.addEventListener("click", openAddModal);
  closeBtn?.addEventListener("click", closeAddressModal);
  cancelBtn?.addEventListener("click", closeAddressModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeAddressModal();
    }
  });

  document.querySelectorAll(".editAddressBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      form.reset();
      clearErrors();

      addressId.value = btn.dataset.id;
      form.fullName.value = btn.dataset.fullname;
      form.phone.value = btn.dataset.phone;
      form.line1.value = btn.dataset.line1;
      form.line2.value = btn.dataset.line2 || "";
      form.city.value = btn.dataset.city;
      form.state.value = btn.dataset.state;
      form.pincode.value = btn.dataset.pincode;
      form.isDefault.checked = btn.dataset.default === "true";

      modalTitle.textContent = "Edit Address";
      saveBtn.textContent = "Update Address";

      modal.classList.add("active");
      document.body.style.overflow = "hidden";

      setTimeout(() => {
        form.fullName.focus();
      }, 100);
    });
  });

  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("input-error");

      const error = document.getElementById(
        `${input.name}Error`,
      );

      if (error) {
        error.textContent = "";
        error.style.display = "none";
      }
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (saveBtn.disabled) return;

    clearErrors();

    const fullName = form.fullName.value.trim();
    const phone = form.phone.value.trim();
    const line1 = form.line1.value.trim();
    const line2 = form.line2.value.trim();
    const city = form.city.value.trim();
    const state = form.state.value.trim();
    const pincode = form.pincode.value.trim();

    let valid = true;

    if (fullName.length < 3) {
      showError(
        "fullNameError",
        "Minimum 3 characters required",
      );

      valid = false;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      showError(
        "phoneError",
        "Enter a valid 10-digit phone number",
      );

      valid = false;
    }

    if (line1.length < 3) {
      showError(
        "line1Error",
        "Address is required",
      );

      valid = false;
    }

    if (city.length < 2) {
      showError(
        "cityError",
        "City is required",
      );

      valid = false;
    }

    if (state.length < 2) {
      showError(
        "stateError",
        "State is required",
      );

      valid = false;
    }

    if (!/^\d{6}$/.test(pincode)) {
      showError(
        "pincodeError",
        "Enter a valid 6-digit pincode",
      );

      valid = false;
    }

    if (!valid) return;

    const id = addressId.value;

    const data = {
      fullName,
      phone,
      line1,
      line2,
      city,
      state,
      pincode,
      isDefault: form.isDefault.checked,
    };

    const originalText = saveBtn.textContent;

    saveBtn.disabled = true;

    saveBtn.innerHTML = `
      <span class="btn-spinner"></span>
      ${id ? "Updating..." : "Saving..."}
    `;

    try {
      if (id) {
        await axios.patch(
          `/user/address/update/${id}`,
          data,
        );

        utils.showToast(
          "Address updated successfully",
          "success",
        );
      } else {
        await axios.post(
          "/user/address/add",
          data,
        );

        utils.showToast(
          "Address added successfully",
          "success",
        );
      }

      setTimeout(() => {
        window.location.href = "/user/address";
      }, 800);
    } catch (err) {
      const errors = err.response?.data?.errors;

      if (Array.isArray(errors) && errors.length) {
        errors.forEach((error) => {
          const field = error.path?.[0];

          if (field) {
            showError(
              `${field}Error`,
              error.message,
            );
          }
        });

        utils.showToast(
          errors[0]?.message ||
            "Please check the entered details",
          "error",
        );
      } else {
        utils.showToast(
          err.response?.data?.message ||
            "Unable to save address",
          "error",
        );
      }

      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  });
});

let deleteId = "";

function openDeleteModal(id) {
  deleteId = id;

  const modal = document.getElementById("deleteModal");

  modal?.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeDeleteModal() {
  const btn = document.getElementById("confirmDeleteBtn");

  if (btn?.disabled) return;

  deleteId = "";

  document
    .getElementById("deleteModal")
    ?.classList.remove("active");

  document.body.style.overflow = "";
}

async function confirmDelete() {
  if (!deleteId) return;

  const btn = document.getElementById("confirmDeleteBtn");

  if (!btn || btn.disabled) return;

  const originalText = btn.textContent;

  btn.disabled = true;

  btn.innerHTML = `
    <span class="btn-spinner"></span>
    Deleting...
  `;

  try {
    await axios.delete(
      `/user/address/delete/${deleteId}`,
    );

    utils.showToast(
      "Address deleted successfully",
      "success",
    );

    setTimeout(() => {
      window.location.href = "/user/address";
    }, 800);
  } catch (err) {
    utils.showToast(
      err.response?.data?.message ||
        "Error deleting address",
      "error",
    );

    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function setDefault(addressId, btn) {
  if (
    !addressId ||
    !btn ||
    btn.disabled
  ) {
    return;
  }

  const originalText = btn.innerHTML;

  btn.disabled = true;

  btn.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin"></i>
    Updating
  `;

  try {
    await axios.patch(
      `/user/address/default/${addressId}`,
    );

    utils.showToast(
      "Default address updated",
      "success",
    );

    setTimeout(() => {
      window.location.href = "/user/address";
    }, 800);
  } catch (err) {
    utils.showToast(
      err.response?.data?.message ||
        "Error setting default address",
      "error",
    );

    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.setDefault = setDefault;