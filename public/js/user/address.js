
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

  const nameRegex =
    /^[A-Za-z]+(?:[.'-]?[A-Za-z]+)*(?:\s+[A-Za-z]+(?:[.'-]?[A-Za-z]+)*)*$/;

  const locationRegex =
    /^[A-Za-z]+(?:[.'-]?[A-Za-z]+)*(?:\s+[A-Za-z]+(?:[.'-]?[A-Za-z]+)*)*$/;

  const addressRegex = /[A-Za-z0-9]/;

  function clearErrors() {
    form.querySelectorAll(".error-msg").forEach((el) => {
      el.textContent = "";
      el.style.display = "none";
    });

    form.querySelectorAll(".input-error").forEach((input) => {
      input.classList.remove("input-error");
    });
  }

  function showError(field, message) {
    const errorEl = document.getElementById(`${field}Error`);
    const input = form.elements[field];

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = "block";
    }

    if (input) {
      input.classList.add("input-error");
    }
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

      form.fullName.value = btn.dataset.fullname || "";
      form.phone.value = btn.dataset.phone || "";
      form.line1.value = btn.dataset.line1 || "";
      form.line2.value = btn.dataset.line2 || "";
      form.city.value = btn.dataset.city || "";
      form.state.value = btn.dataset.state || "";
      form.pincode.value = btn.dataset.pincode || "";

      form.isDefault.checked =
        btn.dataset.default === "true";

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
        `${input.name}Error`
      );

      if (error) {
        error.textContent = "";
        error.style.display = "none";
      }
    });
  });

  function validateForm() {
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
        "fullName",
        "Name must be at least 3 characters"
      );
      valid = false;
    } else if (fullName.length > 50) {
      showError(
        "fullName",
        "Name cannot exceed 50 characters"
      );
      valid = false;
    } else if (!nameRegex.test(fullName)) {
      showError(
        "fullName",
        "Enter a valid name using letters and spaces only"
      );
      valid = false;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      showError(
        "phone",
        "Enter a valid 10-digit Indian mobile number"
      );
      valid = false;
    }

    if (line1.length < 5) {
      showError(
        "line1",
        "Address must be at least 5 characters"
      );
      valid = false;
    } else if (line1.length > 150) {
      showError(
        "line1",
        "Address cannot exceed 150 characters"
      );
      valid = false;
    } else if (!addressRegex.test(line1)) {
      showError(
        "line1",
        "Enter a valid address"
      );
      valid = false;
    }

    if (line2.length > 100) {
      showError(
        "line2",
        "Landmark cannot exceed 100 characters"
      );
      valid = false;
    } else if (
      line2 !== "" &&
      !addressRegex.test(line2)
    ) {
      showError(
        "line2",
        "Enter a valid landmark"
      );
      valid = false;
    }

    if (city.length < 2) {
      showError(
        "city",
        "City must be at least 2 characters"
      );
      valid = false;
    } else if (city.length > 50) {
      showError(
        "city",
        "City cannot exceed 50 characters"
      );
      valid = false;
    } else if (!locationRegex.test(city)) {
      showError(
        "city",
        "Enter a valid city name"
      );
      valid = false;
    }

    if (state.length < 2) {
      showError(
        "state",
        "State must be at least 2 characters"
      );
      valid = false;
    } else if (state.length > 50) {
      showError(
        "state",
        "State cannot exceed 50 characters"
      );
      valid = false;
    } else if (!locationRegex.test(state)) {
      showError(
        "state",
        "Enter a valid state name"
      );
      valid = false;
    }

    if (!/^[1-9]\d{5}$/.test(pincode)) {
      showError(
        "pincode",
        "Enter a valid 6-digit pincode"
      );
      valid = false;
    }

    return valid;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (saveBtn.disabled) return;

    const valid = validateForm();

    if (!valid) {
      utils.showToast(
        "Please correct the highlighted fields",
        "error"
      );

      return;
    }

    const id = addressId.value;

    const data = {
      fullName: form.fullName.value.trim(),
      phone: form.phone.value.trim(),
      line1: form.line1.value.trim(),
      line2: form.line2.value.trim(),
      city: form.city.value.trim(),
      state: form.state.value.trim(),
      pincode: form.pincode.value.trim(),
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
          data
        );

        utils.showToast(
          "Address updated successfully",
          "success"
        );
      } else {
        await axios.post(
          "/user/address/add",
          data
        );

        utils.showToast(
          "Address added successfully",
          "success"
        );
      }

      setTimeout(() => {
        window.location.href = "/user/address";
      }, 800);
    } catch (err) {
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;

      clearErrors();

      const backendMessage =
        err.response?.data?.message;

      if (backendMessage) {
        utils.showToast(
          backendMessage,
          "error"
        );
      } else {
        utils.showToast(
          "Unable to save address",
          "error"
        );
      }
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
      `/user/address/delete/${deleteId}`
    );

    utils.showToast(
      "Address deleted successfully",
      "success"
    );

    setTimeout(() => {
      window.location.href = "/user/address";
    }, 800);
  } catch (err) {
    utils.showToast(
      err.response?.data?.message ||
        "Error deleting address",
      "error"
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
      `/user/address/default/${addressId}`
    );

    utils.showToast(
      "Default address updated",
      "success"
    );

    setTimeout(() => {
      window.location.href = "/user/address";
    }, 800);
  } catch (err) {
    utils.showToast(
      err.response?.data?.message ||
        "Error setting default address",
      "error"
    );

    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.setDefault = setDefault;

