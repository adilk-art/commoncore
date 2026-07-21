const form = document.getElementById("form");

const titleInput = document.getElementById("title");
const scopeInput = document.getElementById("offerScope");

const productGroup = document.getElementById("productGroup");
const categoryGroup = document.getElementById("categoryGroup");

const productInput = document.getElementById("productId");
const categoryInput = document.getElementById("categoryId");

const discountTypeInput = document.getElementById("discountType");
const discountValueInput = document.getElementById("discountValue");

const maxDiscountGroup = document.getElementById("maxDiscountGroup");
const maxDiscountInput = document.getElementById("maxDiscountAmount");

const minOrderInput = document.getElementById("minOrderAmount");

const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");

const statusInput = document.getElementById("isActive");
const submitBtn = form?.querySelector("button[type='submit']");


const previewScope = document.getElementById("previewScope");
const previewTarget = document.getElementById("previewTarget");
const previewType = document.getElementById("previewType");
const previewValue = document.getElementById("previewValue");
const previewMinOrder = document.getElementById("previewMinOrder");
const previewMaxDiscount = document.getElementById("previewMaxDiscount");
const previewDates = document.getElementById("previewDates");
const previewStatus = document.getElementById("previewStatus");


const showError = (id, msg) => {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
};

const clearErrors = () => {
  [
    "titleError",
    "offerScopeError",
    "productError",
    "categoryError",
    "discountTypeError",
    "discountValueError",
    "maxDiscountError",
    "minOrderError",
    "startDateError",
    "endDateError",
    "validationError",
  ].forEach((id) => showError(id, ""));
};

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


scopeInput.addEventListener("change", () => {
  if (scopeInput.value === "PRODUCT") {
    productGroup.style.display = "flex";
    categoryGroup.style.display = "none";
    categoryInput.value = "";
  } else if (scopeInput.value === "CATEGORY") {
    categoryGroup.style.display = "flex";
    productGroup.style.display = "none";
    productInput.value = "";
  } else {
    productGroup.style.display = "none";
    categoryGroup.style.display = "none";
  }

  updatePreview();
});


discountTypeInput.addEventListener("change", () => {
  if (discountTypeInput.value === "PERCENTAGE") {
    maxDiscountGroup.style.display = "flex";
  } else {
    maxDiscountGroup.style.display = "none";
    maxDiscountInput.value = "";
  }

  updatePreview();
});


function updatePreview() {
  previewScope.textContent =
    scopeInput.value === "CATEGORY"
      ? "Category"
      : scopeInput.value === "PRODUCT"
        ? "Product"
        : "Not Selected";

  let target = "Not Selected";

  if (scopeInput.value === "PRODUCT") {
    target =
      productInput.options[productInput.selectedIndex]?.text || "Not Selected";
  }

  if (scopeInput.value === "CATEGORY") {
    target =
      categoryInput.options[categoryInput.selectedIndex]?.text ||
      "Not Selected";
  }

  previewTarget.textContent = target;

  previewType.textContent =
    discountTypeInput.value === "PERCENTAGE"
      ? "Percentage"
      : discountTypeInput.value === "FLAT"
        ? "Flat"
        : "-";

  if (discountTypeInput.value === "PERCENTAGE") {
    previewValue.textContent = `${discountValueInput.value || 0}% OFF`;
  } else if (discountTypeInput.value === "FLAT") {
    previewValue.textContent = `₹${discountValueInput.value || 0} OFF`;
  } else {
    previewValue.textContent = "-";
  }

  previewMinOrder.textContent = minOrderInput.value
    ? `₹${minOrderInput.value}`
    : "—";

  previewMaxDiscount.textContent =
    discountTypeInput.value === "PERCENTAGE"
      ? `₹${maxDiscountInput.value || 0}`
      : "—";

  if (startDateInput.value && endDateInput.value) {
    previewDates.textContent = `${startDateInput.value} → ${endDateInput.value}`;
  } else {
    previewDates.textContent = "Not selected";
  }

  const active = statusInput.value === "true";

  previewStatus.textContent = active ? "Active" : "Inactive";

  previewStatus.className = `status ${active ? "active" : "inactive"}`;
}


form.addEventListener("submit", async (e) => {
  e.preventDefault();

  clearErrors();

  let hasError = false;

  const title = titleInput.value.trim().replace(/\s+/g, " ");

  const offerScope = scopeInput.value;

  const appliesTo = offerScope === "PRODUCT" ? productInput.value : categoryInput.value;

  const discountType = discountTypeInput.value;

  const discountValue = Number(discountValueInput.value);

  const maxDiscountAmount = maxDiscountInput.value;

  const minOrderAmount = minOrderInput.value;

  const startDate = startDateInput.value;

  const endDate = endDateInput.value;

  const isActive = statusInput.value;

  const appliesToModel = offerScope === "PRODUCT" ? "Product" : "Category";

  if (!title) {
    showError("titleError", "Offer title is required");
    hasError = true;
  }

  if (!offerScope) {
    showError("offerScopeError", "Select offer scope");
    hasError = true;
  }

  if (offerScope === "PRODUCT" && !productInput.value) {
    showError("productError", "Select a product");
    hasError = true;
  }

  if (offerScope === "CATEGORY" && !categoryInput.value) {
    showError("categoryError", "Select a category");
    hasError = true;
  }

  if (!discountType) {
    showError("discountTypeError", "Select discount type");
    hasError = true;
  }

  if (!discountValue || discountValue <= 0) {
    showError("discountValueError", "Enter valid discount");
    hasError = true;
  }

  if (discountType === "PERCENTAGE" && discountValue > 100) {
    showError("discountValueError", "Percentage cannot exceed 100");
    hasError = true;
  }

  if (discountType === "PERCENTAGE" && !maxDiscountAmount) {
    showError("maxDiscountError", "Maximum discount required");
    hasError = true;
  }

  if (!startDate) {
    showError("startDateError", "Start date required");
    hasError = true;
  }

  if (!endDate) {
    showError("endDateError", "End date required");
    hasError = true;
  }

  if (startDate && endDate) {
    if (new Date(endDate) <= new Date(startDate)) {
      showError("endDateError", "End date must be after start date");
      hasError = true;
    }
  }

  if (hasError) return;

  const originalText = submitBtn.innerHTML;

  submitBtn.disabled = true;

  submitBtn.innerHTML = `
      <span class="btn-loader"></span>
      Saving...
  `;

  try {
    const res = await axios.post("/admin/offers/add", {
      title,
      offerScope,
      appliesTo,
      appliesToModel,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      startDate,
      endDate,
      isActive,
    });

    if (res.data.success) {
      utils.showToast(res.data.message);

      saveScrollPosition();

      setTimeout(() => {
        window.location.href = "/admin/offers";
      }, 1000);
    }
  } catch (err) {
    showError(
      "validationError",
      err.response?.data?.message || "Something went wrong",
    );

    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});


form.addEventListener("input", () => {
  clearErrors();
  updatePreview();
});

[
  productInput,
  categoryInput,
  discountTypeInput,
  discountValueInput,
  maxDiscountInput,
  minOrderInput,
  startDateInput,
  endDateInput,
  statusInput,
].forEach((el) => {
  el.addEventListener("change", updatePreview);
});

updatePreview();

