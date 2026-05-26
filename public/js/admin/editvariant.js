import {
  isValidImage,
  openCropper,
  cropToFile,
} from "../utils/imageCropper.js";

const editForm = document.getElementById("editForm");
const editCard = document.getElementById("editCard");
const addCard = document.getElementById("addCard");

const editSize = document.getElementById("editSize");
const editStock = document.getElementById("editStock");
const editPrice = document.getElementById("editPrice");
const editColorName = document.getElementById("editColorName");
const editColorCode = document.getElementById("editColorCode");
const editImages = document.getElementById("editImages");
const editPreviewGrid = document.getElementById("editPreviewGrid");
const editIsActive = document.getElementById("editIsActive");
const editIsDefault = document.getElementById("editIsDefault");
const editVariantId = document.getElementById("editVariantId");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let editSelectedFiles = [];
let editCroppedFiles = [];
let editCurrentIndex = 0;
let existingImages = [];
let editCropper = null;

const cropModal = document.getElementById("cropModal");
const cropImageEl = document.getElementById("cropImage");
const cropBtn = document.getElementById("cropBtn");

document.querySelectorAll(".edit-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const variant = JSON.parse(btn.dataset.variant); //getting the variant as object from the edit-variant button

    addCard.style.display = "none";
    editCard.style.display = "block";

    editVariantId.value = variant._id;
    editSize.value = variant.size;
    editStock.value = variant.stock;
    editPrice.value = variant.price;
    editColorName.value = variant.color.name;
    editColorCode.value = variant.color.code;
    editIsActive.value = String(variant.isActive);
    editIsDefault.value = String(variant.isDefault);

    existingImages = [...variant.images];
    editCroppedFiles = [];

    renderEditImages();
  });
});

function renderEditImages() {
  editPreviewGrid.innerHTML = "";

  existingImages.forEach((img, index) => {
    addPreview(img.url, index, "existing");
  });

  editCroppedFiles.forEach((file, index) => {
    addPreview(URL.createObjectURL(file), index, "new");
  });
}
function openZoom(src) {
  const zoomModal = document.getElementById("zoomModal");
  const zoomImage = document.getElementById("zoomImage");

  if (!zoomModal || !zoomImage) return;

  zoomImage.src = src;
  zoomModal.classList.add("active");
}
function addPreview(src, index, type) {
  const wrapper = document.createElement("div");
  wrapper.className = "preview-item";

  const img = document.createElement("img");
  img.src = src;
  img.className = "preview-box";
   img.addEventListener("click", () => {
    openZoom(src);
  });

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-img";
  removeBtn.innerHTML = "×";

  removeBtn.addEventListener("click", () => {
    if (type === "existing") existingImages.splice(index, 1);
    else editCroppedFiles.splice(index, 1);

    renderEditImages();
  });

  wrapper.append(img, removeBtn);
  editPreviewGrid.appendChild(wrapper);
}

editImages.addEventListener("change", async (e) => {
  const files = [...e.target.files];

  for (const file of files) {
    if (!isValidImage(file)) return;
  }

  editSelectedFiles = files;
  editCurrentIndex = 0;

  await loadEditCrop();
});

async function loadEditCrop() {
  if (editCurrentIndex >= editSelectedFiles.length) {
    closeEditCrop();
    return;
  }

  editCropper = await openCropper(
    editSelectedFiles[editCurrentIndex],
    cropImageEl,
    cropModal,
    editCropper,
  );
}

function closeEditCrop() {
  cropModal.classList.remove("active");

  if (editCropper) {
    editCropper.destroy();
    editCropper = null;
  }
}

cropBtn.addEventListener("click", async () => {
  if (!editCard || editCard.style.display === "none") return;
  if (!editCropper) return;

  const file = await cropToFile(editCropper, editCurrentIndex);

  editCroppedFiles.push(file);
  editCurrentIndex++;

  renderEditImages();
  await loadEditCrop();
});

function setEditError(id, msg) {
  document.getElementById(id).textContent = msg;
}

function clearEditErrors() {
  document.querySelectorAll("#editCard .error").forEach(el => {
    el.textContent = "";
  });
}

const updateBtn = editForm.querySelector(".save-btn");

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  clearEditErrors();

  let valid = true;

  if (!editSize.value) {
    setEditError("editSizeError", "Select size");
    valid = false;
  }

  if (!editStock.value || Number(editStock.value) < 0) {
    setEditError("editStockError", "Enter valid stock");
    valid = false;
  }

  if (!editPrice.value || Number(editPrice.value) <= 0) {
    setEditError("editPriceError", "Enter valid price");
    valid = false;
  }

  if (!editColorName.value.trim()) {
    setEditError("editColorNameError", "Enter color name");
    valid = false;
  }

  if (!editColorCode.value) {
    setEditError("editColorCodeError", "Choose color");
    valid = false;
  }

  if (!editIsActive.value) {
    setEditError("editIsActiveError", "Select status");
    valid = false;
  }

  if (!editIsDefault.value) {
    setEditError("editIsDefaultError", "Select valid default option");
    valid = false;
  }

  const totalImages = existingImages.length + editCroppedFiles.length;

  if (totalImages < 3) {
    setEditError("editImagesError", "Minimum 3 images required");
    valid = false;
  }

  if (!valid) return;

  const originalBtnText = updateBtn.innerHTML;

  updateBtn.disabled = true;
  updateBtn.innerHTML = `
    <span class="btn-loader"></span>
    Updating...
  `;

  const formData = new FormData();

  formData.append("size", editSize.value);
  formData.append("stock", editStock.value);
  formData.append("price", editPrice.value);
  formData.append("colorName", editColorName.value.trim());
  formData.append("colorCode", editColorCode.value);
  formData.append("isActive", editIsActive.value);
  formData.append("isDefault", editIsDefault.value);
  formData.append("existingImages", JSON.stringify(existingImages));

  editCroppedFiles.forEach((file) => {
    formData.append("images", file);
  });

  try {

    const res = await axios.patch(
      `/admin/products/variants/edit/${editVariantId.value}`,
      formData
    );

    if (res.data.success) {

      utils.showToast(res.data.message);

      setTimeout(() => {
        window.location.reload();
      }, 1000);

    }

  } catch (err) {

    setEditError(
      "editValidationError",
      err.response?.data?.message || "Something went wrong"
    );

    updateBtn.disabled = false;
    updateBtn.innerHTML = originalBtnText;

  }

});

cancelEditBtn.addEventListener("click", () => {
  editCard.style.display = "none";
  addCard.style.display = "block";

  editForm.reset();
  editPreviewGrid.innerHTML = "";
  existingImages = [];
  editCroppedFiles = [];
});
