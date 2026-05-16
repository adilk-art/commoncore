import {
  isValidImage,
  openCropper,
  cropToFile,
} from "../utils/imageCropper.js";

const form = document.getElementById("form");

const size = document.getElementById("size");
const stock = document.getElementById("stock");
const price = document.getElementById("price");
const colorName = document.getElementById("colorName");
const colorCode = document.getElementById("colorCode");
const imageInput = document.getElementById("images");
const previewGrid = document.getElementById("previewGrid");
const isActive = document.getElementById("isActive");
const isDefault = document.getElementById("isDefault");

const cropModal = document.getElementById("cropModal");
const cropImageEl = document.getElementById("cropImage");
const cropBtn = document.getElementById("cropBtn");
const cancelCropBtn = document.getElementById("cancelCropBtn");

let cropper = null;
let selectedFiles = []; //all selected files from input

let croppedFiles = []; //final cropped files.only these are uploaded

let currentIndex = 0; // current image index while cropping one by one

function setError(id, msg) {
  document.getElementById(id).textContent = msg;
}

function clearErrors() {
  document.querySelectorAll(".error").forEach((el) => {
    el.textContent = "";
  });
}

function closeCropModal() {
   cropModal.classList.remove("active");

  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
}

async function loadNextImage() {  //opens next selected image in cropper.one image at a time.*/
  

  if (currentIndex >= selectedFiles.length) {
    closeCropModal();
    return;
  }

  cropper = await openCropper(
    selectedFiles[currentIndex],
    cropImageEl,
    cropModal,
    cropper,
  );
}

imageInput.addEventListener("change", async (e) => {
  clearErrors();

  const newFiles = [...e.target.files];

  if (!newFiles.length) return;

  selectedFiles = newFiles;
  currentIndex = 0;

  for (const file of newFiles) {
    if (!isValidImage(file)) {
      imageInput.value = "";
      setError("imagesError", "Only JPG, PNG or WEBP images allowed");
      return;
    }
  }

  await loadNextImage();
});

cropBtn.addEventListener("click", async () => {
  
  if (!cropper) return;
  const file = await cropToFile(
    cropper,
    currentIndex,
  ); //convert cropper result to file*/
  croppedFiles.push(file); //store final cropped image*/
  const wrapper = document.createElement("div");
  wrapper.className = "preview-item";

  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.className = "preview-box";

  img.addEventListener("click", () => {
    openZoom(img.src);
  });

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-img";
  removeBtn.innerHTML = "×";

  removeBtn.addEventListener("click", () => {
    const index = Array.from(previewGrid.children).indexOf(wrapper);

    croppedFiles.splice(index, 1);
    wrapper.remove();
  });

  wrapper.appendChild(img);
  wrapper.appendChild(removeBtn);
  previewGrid.appendChild(wrapper);
  currentIndex++;                      //move to next image*/
  await loadNextImage();
});

const zoomModal = document.getElementById("zoomModal");
const zoomImage = document.getElementById("zoomImage");

function openZoom(src) {
  zoomImage.src = src;
  zoomModal.classList.add("active");
}

zoomModal.addEventListener("click", () => {
  zoomModal.classList.remove("active");
});

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
  if (!isActive.value) {
    setError("isActiveError", "Select status");
    valid = false;
  }
  if (!isDefault.value) {
    setError("isDefaultError", "Select valid default option");
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
  formData.append("isActive", isActive.value);
  formData.append("isDefault", isDefault.value);

  croppedFiles.forEach((file) => {
    formData.append("images", file);
  });

  try {
    const res = await axios.post(window.location.pathname, formData);
    if (res.data.success) {
      utils.showToast(res.data.message);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (error) {
    setError(
      "validationError",
      error.response?.data?.message || "Something went wrong",
    );
  }
});

const discardBtn = document.querySelector(".discard-btn");

discardBtn.addEventListener("click", () => {
  clearErrors();

  imageInput.value = "";
  selectedFiles = [];
  croppedFiles = [];
  currentIndex = 0;

  previewGrid.innerHTML = "";

  closeCropModal();
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".status-btn");
  if (!btn) return;

  const id = btn.dataset.id;

  openConfirmModal("Change variant status?", () => {
    changeVariantStatus(id);
  });
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".status-btn");
  if (!btn) return;

  const id = btn.dataset.id;

  openConfirmModal("Change variant status?", () => {
    changeVariantStatus(id);
  });
});

const changeVariantStatus = async (id) => {
  try {
    const res = await axios.patch(`/admin/products/variants/status/${id}`);

    if (res.data.success) {
      const content = document.querySelector(".content");

  if (content) {
    sessionStorage.setItem("contentScroll", content.scrollTop);
    sessionStorage.setItem("contentScrollIntent", "true");
  }
      utils.showToast(res.data.message);

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }

  } catch (err) {
    utils.showToast("Something went wrong");
  }
};

function preserveScroll() {
  const content = document.querySelector(".content");
  if (!content) return;

  const SCROLL_KEY = "contentScroll";
  const INTENT_KEY = "contentScrollIntent";

  const saved = sessionStorage.getItem(SCROLL_KEY);
  const intentional = sessionStorage.getItem(INTENT_KEY);

  if (saved !== null && intentional === "true") {
    requestAnimationFrame(() => {
      content.scrollTop = Number(saved);
      sessionStorage.removeItem(SCROLL_KEY);
      sessionStorage.removeItem(INTENT_KEY);
    });
  } else {
    sessionStorage.removeItem(SCROLL_KEY);
    sessionStorage.removeItem(INTENT_KEY);
  }

  document
    .querySelectorAll(".pagination a, .search-box button, .clear-btn")
    .forEach((el) => {
      el.addEventListener("click", () => {
        sessionStorage.setItem(SCROLL_KEY, content.scrollTop);
        sessionStorage.setItem(INTENT_KEY, "true");
      });
    });
}

document.addEventListener("DOMContentLoaded", preserveScroll);
