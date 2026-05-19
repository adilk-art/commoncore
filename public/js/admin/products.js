const form = document.getElementById("form");

const nameInput = document.getElementById("name");
const descriptionInput = document.getElementById("description");
const categoryInput = document.getElementById("category");
const fitInput = document.getElementById("fit");
const materialInput = document.getElementById("material");
const basePriceInput = document.getElementById("basePrice");
const isActiveInput = document.getElementById("isActive");
const washCareInput = document.getElementById("washCare");

const showError = (id, msg) => {
  document.getElementById(id).textContent = msg;
};

const clearErrors = () => {
  [
    "nameError",
    "descriptionError",
    "categoryError",
    "fitError",
    "materialError",
    "basePriceError",
    "isActiveError",
    "washCareError",
    "validationError"
  ].forEach((id) => showError(id, ""));
};

/* SCROLL PRESERVE */

function saveScrollPosition() {
  const content = document.querySelector(".content");
  if (!content) return;

  sessionStorage.setItem("contentScroll", content.scrollTop);
}

function restoreScrollPosition() {
  const content = document.querySelector(".content");
  const saved = sessionStorage.getItem("contentScroll");

  if (!content || saved === null) return;

  requestAnimationFrame(() => {
    content.scrollTop = Number(saved);
    sessionStorage.removeItem("contentScroll");
  });
}

document.addEventListener("DOMContentLoaded", restoreScrollPosition);

/* FORM SUBMIT */

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearErrors();

    let hasError = false;

    const name = nameInput.value.trim().replace(/\s+/g, " ");
    const description = descriptionInput.value.trim();
    const category = categoryInput.value;
    const fit = fitInput.value;
    const material = materialInput.value.trim();
    const basePrice = Number(basePriceInput.value);
    const isActive = isActiveInput.value;
    const washCare = washCareInput.value;

    if (!name) {
      showError("nameError", "Product name is required");
      hasError = true;
    } else if (name.length < 3) {
      showError("nameError", "Product name must be at least 3 characters");
      hasError = true;
    } else if (!/[a-zA-Z]/.test(name)) {
      showError("nameError", "Product name must contain at least one letter");
      hasError = true;
    }

    if (!description || description.length < 5) {
      showError("descriptionError", "Description must be atleast 5 characters");
      hasError = true;
    }

    if (!category) {
      showError("categoryError", "Please select Category");
      hasError = true;
    }

    if (!fit) {
      showError("fitError", "Please select fit");
      hasError = true;
    }

    if (!material || material.length < 3) {
      showError("materialError", "Material is required");
      hasError = true;
    } else if (!/[a-zA-Z]/.test(material)) {
      showError("materialError", "Enter a valid material");
      hasError = true;
    }

    if (!basePrice || basePrice < 1) {
      showError("basePriceError", "Please provide base price");
      hasError = true;
    }

    if (!isActive) {
      showError("isActiveError", "Status is required");
      hasError = true;
    }

    if (!washCare) {
      showError("washCareError", "Wash care is required");
      hasError = true;
    }

    if (hasError) return;

    const productId = form.dataset.id;

    try {
      let res;

      if (productId) {
        res = await axios.patch(`/admin/products/edit/${productId}`, {
          name,
          description,
          category,
          fit,
          material,
          basePrice,
          isActive,
          washCare
        });
      } else {
        res = await axios.post("/admin/products/add", {
          name,
          description,
          category,
          fit,
          material,
          basePrice,
          isActive,
          washCare
        });
      }

      if (res.data.success) {
        utils.showToast(res.data.message);

        saveScrollPosition();

        setTimeout(() => {
          window.location.href = "/admin/products";
        }, 1000);
      }

    } catch (err) {
      showError("validationError", err.response?.data?.message);
    }
  });
}

/* CLEAR ERROR */

if (form) {
  form.addEventListener("input", () => {
    clearErrors();
  });
}

/* STATUS BUTTON */

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".status-btn");

  if (!btn) return;

  const id = btn.dataset.id;

  openConfirmModal("Change product status?", () => {
    changeProductStatus(id);
  });
});

const changeProductStatus = async (id) => {
  try {
    const res = await axios.patch(`/admin/products/status/${id}`);

    if (res.data.success) {
      utils.showToast(res.data.message);

      saveScrollPosition();

      setTimeout(() => {
        window.location.href = "/admin/products";
      }, 1000);
    }

  } catch (err) {
    utils.showToast("Something went wrong");
  }
};