const form = document.getElementById("categoryForm");
const nameInput = document.getElementById("name");
const sizeTypeInput = document.getElementById("sizeType");

const nameError = document.getElementById("nameError");
const sizeTypeError = document.getElementById("sizeTypeError");
const validationError = document.getElementById("validationError");

const addModal = document.getElementById("addCategoryModal");
const editModal = document.getElementById("editCategoryModal");

const openAddModalBtn = document.getElementById("openAddModal");
const closeAddModalBtn = document.getElementById("closeAddModal");
const cancelAddModalBtn = document.getElementById("cancelAddModal");

const closeEditModalBtn = document.getElementById("closeEditModal");
const cancelEditBtn = document.getElementById("cancelEdit");

let editId = null;

const editName = document.getElementById("editName");
const editSizeType = document.getElementById("editSizeType");
const editIsActive = document.getElementById("editIsActive");

const editNameError = document.getElementById("editNameError");
const editSizeTypeError = document.getElementById("editSizeTypeError");
const editValidationError = document.getElementById("editValidationError");

function clearAllErrors() {
  document.querySelectorAll(".error").forEach((el) => {
    el.textContent = "";
  });

  document.querySelectorAll(".input-error").forEach((el) => {
    el.classList.remove("input-error");
  });
}

openAddModalBtn.addEventListener("click", () => {
  addModal.classList.remove("hidden");
});

function closeAddModal() {
  addModal.classList.add("hidden");
  form.reset();
  clearAllErrors();
}

closeAddModalBtn.addEventListener("click", closeAddModal);
cancelAddModalBtn.addEventListener("click", closeAddModal);

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  clearAllErrors();

  const name = nameInput.value.trim();
  const sizeType = sizeTypeInput.value;
  const isActive = document.getElementById("isActive").value;

  let hasError = false;

  const nameRegex = /^[A-Za-z\s]+$/;

  if (!name) {
    nameError.textContent = "Category name is required";
    nameInput.classList.add("input-error");
    hasError = true;
  } else if (name.length < 3) {
    nameError.textContent = "Category name must be atleast 3 characters";
    nameInput.classList.add("input-error");
    hasError = true;
  } else if (!nameRegex.test(name)) {
    nameError.textContent = "Only alphabets and spaces allowed";
    nameInput.classList.add("input-error");
    hasError = true;
  }

  if (!sizeType) {
    sizeTypeError.textContent = "Select a size type";
    sizeTypeInput.classList.add("input-error");
    hasError = true;
  }

  if (hasError) return;

  try {
    const res = await axios.post("/admin/categories/add-category", {
      name,
      sizeType,
      isActive,
    });

    if (res.data.success) {
      utils.showToast(res.data.message);

      closeAddModal();

      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  } catch (err) {
    validationError.textContent = err.response?.data?.message;
  }
});

nameInput.addEventListener("input", () => {
  nameError.textContent = "";
  validationError.textContent = "";
  nameInput.classList.remove("input-error");
});

sizeTypeInput.addEventListener("change", () => {
  sizeTypeError.textContent = "";
  validationError.textContent = "";
  sizeTypeInput.classList.remove("input-error");
});

document.querySelectorAll(".edit-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    editId = btn.dataset.id;

    editName.value = btn.dataset.name;
    editSizeType.value = btn.dataset.sizetype;
    editIsActive.value = btn.dataset.active;

    editNameError.textContent = "";
    editSizeTypeError.textContent = "";
    editValidationError.textContent = "";

    editName.classList.remove("input-error");
    editSizeType.classList.remove("input-error");

    editModal.classList.remove("hidden");
  });
});

function closeEditModal() {
  editModal.classList.add("hidden");

  editNameError.textContent = "";
  editSizeTypeError.textContent = "";
  editValidationError.textContent = "";

  editName.classList.remove("input-error");
  editSizeType.classList.remove("input-error");

  editId = null;
}

closeEditModalBtn.addEventListener("click", closeEditModal);
cancelEditBtn.addEventListener("click", closeEditModal);

document
  .getElementById("editCategoryForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    editNameError.textContent = "";
    editSizeTypeError.textContent = "";
    editValidationError.textContent = "";

    editName.classList.remove("input-error");
    editSizeType.classList.remove("input-error");

    const name = editName.value.trim();
    const sizeType = editSizeType.value;
    const isActive = editIsActive.value;

    let hasError = false;

    if (!name) {
      editNameError.textContent = "Category name is required";
      editName.classList.add("input-error");
      hasError = true;
    } else if (name.length < 3) {
      editNameError.textContent = "Minimum 3 characters required";
      editName.classList.add("input-error");
      hasError = true;
    } else if (!/^[a-zA-Z ]+$/.test(name)) {
      editNameError.textContent = "Only letters and spaces allowed";
      editName.classList.add("input-error");
      hasError = true;
    }

    if (!sizeType) {
      editSizeTypeError.textContent = "Select a size type";
      editSizeType.classList.add("input-error");
      hasError = true;
    }

    if (hasError) return;

    try {
      const res = await axios.patch(`/admin/categories/update/${editId}`, {
        name,
        sizeType,
        isActive,
      });

      if (res.data.success) {
        utils.showToast(res.data.message);

        closeEditModal();

        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } catch (err) {
      editValidationError.textContent =
        err.response?.data?.message || "Error updating category";
    }
  });

document.querySelectorAll(".toggle-status-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.id;
    const currentStatus = btn.dataset.active === "true";

    openConfirmModal("Change category status?", async () => {
      try {
        const res = await axios.patch(`/admin/categories/toggle-status/${id}`, {
          isActive: !currentStatus,
        });

        if (res.data.success) {
          utils.showToast(res.data.message);

          setTimeout(() => {
            window.location.reload();
          }, 800);
        }
      } catch (err) {
        utils.showToast(err.response?.data?.message || "Error updating status");
      }
    });
  });
});
