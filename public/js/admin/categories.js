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
