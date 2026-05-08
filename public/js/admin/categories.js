const form = document.getElementById("categoryForm");
const nameInput = document.getElementById("name");
const sizeTypeInput = document.getElementById("sizeType");

const nameError = document.getElementById("nameError");
const sizeTypeError = document.getElementById("sizeTypeError");
const validationError = document.getElementById("validationError");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  nameError.textContent = "";
  sizeTypeError.textContent = "";
  validationError.textContent = "";
  nameInput.classList.remove("input-error");
  sizeTypeInput.classList.remove("input-error");

  const name = nameInput.value.trim();
  const sizeType = sizeTypeInput.value;
  const isActive = document.getElementById("isActive").value;

  let hasError = false;
  const nameRegex = /^[A-Za-z\s]+$/;

  if (!name) {
    nameError.textContent = "category name is required";
    nameInput.classList.add("input-error");

    hasError = true;
  } else if (name.length < 3) {
    nameError.textContent = "category name must be atleast 3 characters";
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
      setTimeout(() => {
        window.location.href = "/admin/categories";
      }, 1000);
    }
  } catch (err) {
    const message = err.response?.data?.message;
    validationError.textContent = message;
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

//edit category

let editId = null;

const addCard = document.getElementById("addCard");
const editCard = document.getElementById("editCard");
const editName = document.getElementById("editName");
const editSizeType = document.getElementById("editSizeType");
const editIsActive = document.getElementById("editIsActive");
const editNameError = document.getElementById("editNameError");
const editSizeTypeError = document.getElementById("editSizeTypeError");
const editValidationError = document.getElementById("editValidationError");

document.querySelectorAll(".edit-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
  editNameError.textContent = "";
  editSizeTypeError.textContent = "";
  editValidationError.textContent = "";
    editId = btn.dataset.id;
    

    addCard.classList.add("hidden");
    editCard.classList.remove("hidden");

    editName.value = btn.dataset.name;
    editSizeType.value = btn.dataset.sizetype;
    editIsActive.value = btn.dataset.active;
  });
});

document.getElementById("cancelEdit").addEventListener("click", () => {
  editCard.classList.add("hidden");
  addCard.classList.remove("hidden");
    editNameError.textContent = "";
    editSizeTypeError.textContent = "";
    editValidationError.textContent = "";
    editName.classList.remove("input-error");
    editSizeType.classList.remove("input-error");

  editId = null;
});


document
  .getElementById("editCategoryForm")
  .addEventListener("submit", async (e) => {

    e.preventDefault();

    // clear errors
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
      hasError = true;
      editName.classList.add("input-error");

    }
    else if (name.length < 3) {
      editNameError.textContent = "Minimum 3 characters required";
      editName.classList.add("input-error");
      hasError = true;
    }
    else if (!/^[a-zA-Z ]+$/.test(name)) {
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
      const res = await axios.patch(
        `/admin/categories/update/${editId}`,
        { name, sizeType, isActive }
      );

      if (res.data.success) {
        utils.showToast(res.data.message);

        setTimeout(() => {
          window.location.href = "/admin/categories";
        }, 1000);
      }

    } catch (err) {
      editValidationError.textContent =
        err.response?.data?.message || "Error updating category";
    }

  });

  document.querySelectorAll(".toggle-status-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      const id = btn.dataset.id;
      const currentStatus = btn.dataset.active === "true";

      const res = await axios.patch(
        `/admin/categories/toggle-status/${id}`,
        { isActive: !currentStatus }
      );

      if (res.data.success) {
        utils.showToast(res.data.message);

        setTimeout(() => {
          window.location.reload();
        }, 500);
      }

    } catch (err) {
      console.log(err);
      utils.showToast(
        err.response?.data?.message || "Error updating status",
        "error"
      );
    }
  });
});

document.querySelector(".discard-btn").addEventListener("click", (e) => {
  e.preventDefault();

  form.reset();


  document.querySelectorAll(".error").forEach((el) => {
    el.textContent = "";
  });

  document.querySelectorAll(".input-error").forEach((el) => {
    el.classList.remove("input-error");
  });
});