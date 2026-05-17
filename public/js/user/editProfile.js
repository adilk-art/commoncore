const form = document.getElementById("form");

const size = document.getElementById("size");
const stock = document.getElementById("stock");
const price = document.getElementById("price");
const colorName = document.getElementById("colorName");
const colorCode = document.getElementById("colorCode");
const imageInput = document.getElementById("images");
const previewGrid = document.getElementById("previewGrid");

const cropModal = document.getElementById("cropModal");
const cropImageEl = document.getElementById("cropImage");
const cropBtn = document.getElementById("cropBtn");
const cancelCropBtn = document.getElementById("cancelCropBtn");

let cropper;
let selectedFiles = [];
let currentIndex = 0;
let croppedFiles = [];

const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];

function setError(id, msg) {
  document.getElementById(id).textContent = msg;
}

function clearErrors() {
  document.querySelectorAll(".error").forEach(el => el.textContent = "");
}

function isValidImage(file) {
  const mimeOk = allowedMime.includes(file.type.toLowerCase());
  const ext = "." + file.name.split(".").pop().toLowerCase();
  const extOk = allowedExt.includes(ext);

  return mimeOk || extOk;
}

function openCropModal(file) {
  const reader = new FileReader();

  reader.onload = (e) => {
    cropImageEl.src = e.target.result;
    cropModal.classList.add("active");

    if (cropper) cropper.destroy();

    cropper = new Cropper(cropImageEl, {
      aspectRatio: 4 / 5,
      viewMode: 1,
      autoCropArea: 1,
      dragMode: "move",
    });
  };

  reader.readAsDataURL(file);
}

function closeCropModal() {
  cropModal.classList.remove("active");

  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
}

function loadNextImage() {
  if (currentIndex >= selectedFiles.length) {
    closeCropModal();
    return;
  }

  openCropModal(selectedFiles[currentIndex]);
}

function cropCurrentImage() {
  if (!cropper) return;

  const canvas = cropper.getCroppedCanvas({
    width: 800,
    height: 1000,
  });

  const base64 = canvas.toDataURL("image/jpeg", 0.9);

  fetch(base64)
    .then(res => res.blob())
    .then(blob => {
      const file = new File(
        [blob],
        `variant-${Date.now()}-${currentIndex}.jpg`,
        { type: "image/jpeg" }
      );

      croppedFiles.push(file);

      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.className = "preview-box";

      previewGrid.appendChild(img);

      currentIndex++;
      loadNextImage();
    });
}

imageInput.addEventListener("change", (e) => {
  clearErrors();

  selectedFiles = [...e.target.files];
  croppedFiles = [];
  currentIndex = 0;
  previewGrid.innerHTML = "";

  if (!selectedFiles.length) return;

  for (const file of selectedFiles) {
    if (!isValidImage(file)) {
      imageInput.value = "";
      closeCropModal();
      setError("imagesError", "Only JPG, PNG or WEBP images allowed");
      return;
    }
  }

  loadNextImage();
});

cropBtn.addEventListener("click", cropCurrentImage);

cancelCropBtn.addEventListener("click", () => {
  closeCropModal();
  imageInput.value = "";
  selectedFiles = [];
  croppedFiles = [];
  previewGrid.innerHTML = "";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  clearErrors();

  let valid = true;

  if (!size.value) {
    setError("sizeError", "Select size");
    valid = false;
  }

  if (!stock.value || Number(stock.value) < 0) {
    setError("stockError", "Enter valid stock");
    valid = false;
  }

  if (!price.value || Number(price.value) <= 0) {
    setError("priceError", "Enter valid price");
    valid = false;
  }

  if (!colorName.value.trim()) {
    setError("colorNameError", "Enter color name");
    valid = false;
  }

  if (!colorCode.value) {
    setError("colorCodeError", "Choose color");
    valid = false;
  }

  if (croppedFiles.length < 3) {
    setError("imagesError", "Minimum 3 images required");
    valid = false;
  }

  if (!valid) return;

  const formData = new FormData();

  formData.append("size", size.value);
  formData.append("stock", stock.value);
  formData.append("price", price.value);
  formData.append("colorName", colorName.value.trim());
  formData.append("colorCode", colorCode.value);

  croppedFiles.forEach(file => {
    formData.append("images", file);
  });

  try {
    await axios.post(window.location.pathname, formData);

    window.location.reload();

  } catch (error) {
    setError("imagesError", error.response?.data?.message || "Something went wrong");
  }
});