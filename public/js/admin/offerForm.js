const form = document.getElementById("form");

const mode = form.dataset.mode;
const action = form.dataset.action;

const titleInput = document.getElementById("title");
const scopeInput = document.getElementById("offerScope");

const productGroup = document.getElementById("productGroup");
const categoryGroup = document.getElementById("categoryGroup");

const productInput = document.getElementById("productId");
const categoryInput = document.getElementById("categoryId");

const discountTypeInput =
  document.getElementById("discountType");

const discountValueInput =
  document.getElementById("discountValue");

const maxDiscountGroup =
  document.getElementById("maxDiscountGroup");

const maxDiscountInput =
  document.getElementById("maxDiscountAmount");

const maxDiscountWarning =
  document.getElementById("maxDiscountWarning");

const startDateInput =
  document.getElementById("startDate");

const endDateInput =
  document.getElementById("endDate");

const statusInput =
  document.getElementById("isActive");

const submitBtn =
  form.querySelector("button[type='submit']");

const previewScope =
  document.getElementById("previewScope");

const previewTarget =
  document.getElementById("previewTarget");

const previewType =
  document.getElementById("previewType");

const previewValue =
  document.getElementById("previewValue");

const previewMaxDiscount =
  document.getElementById("previewMaxDiscount");

const previewMaxDiscountRow =
  document.getElementById("previewMaxDiscountRow");

const previewDates =
  document.getElementById("previewDates");

const previewStatus =
  document.getElementById("previewStatus");

const showError = (id, message) => {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = message;
  }
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
    "startDateError",
    "endDateError",
    "validationError",
  ].forEach((id) => showError(id, ""));
};

function saveScrollPosition() {
  const content =
    document.querySelector(".content");

  if (!content) return;

  sessionStorage.setItem(
    "contentScroll",
    content.scrollTop,
  );
}

function restoreScrollPosition() {
  const content =
    document.querySelector(".content");

  const saved =
    sessionStorage.getItem("contentScroll");

  if (!content || saved === null) return;

  requestAnimationFrame(() => {
    content.scrollTop = Number(saved);

    sessionStorage.removeItem(
      "contentScroll",
    );
  });
}

function toggleScopeFields() {
  const scope = scopeInput.value;

  productGroup.style.display =
    scope === "PRODUCT" ? "flex" : "none";

  categoryGroup.style.display =
    scope === "CATEGORY" ? "flex" : "none";
}

function updateMaxDiscountWarning() {
  if (!maxDiscountWarning) return;

  const isPercentage =
    discountTypeInput.value ===
    "PERCENTAGE";

  const hasMaximum =
    maxDiscountInput.value.trim() !== "";

  maxDiscountWarning.hidden =
    !isPercentage || hasMaximum;
}

function toggleDiscountFields() {
  const isPercentage =
    discountTypeInput.value ===
    "PERCENTAGE";

  maxDiscountGroup.style.display =
    isPercentage ? "flex" : "none";

  if (previewMaxDiscountRow) {
    previewMaxDiscountRow.style.display =
      isPercentage ? "flex" : "none";
  }

  if (!isPercentage) {
    maxDiscountInput.value = "";
    showError("maxDiscountError", "");
  }

  updateMaxDiscountWarning();
}

function getSelectedOptionText(select) {
  if (!select.value) {
    return "Not Selected";
  }

  return (
    select.options[select.selectedIndex]
      ?.textContent.trim() ||
    "Not Selected"
  );
}

function updatePreview() {
  const scope = scopeInput.value;
  const discountType =
    discountTypeInput.value;

  previewScope.textContent =
    scope === "PRODUCT"
      ? "Product"
      : scope === "CATEGORY"
        ? "Category"
        : "Not Selected";

  if (scope === "PRODUCT") {
    previewTarget.textContent =
      getSelectedOptionText(productInput);
  } else if (scope === "CATEGORY") {
    previewTarget.textContent =
      getSelectedOptionText(categoryInput);
  } else {
    previewTarget.textContent =
      "Not Selected";
  }

  previewType.textContent =
    discountType === "PERCENTAGE"
      ? "Percentage"
      : discountType === "FLAT"
        ? "Flat"
        : "—";

  const discountValue =
    Number(discountValueInput.value) || 0;

  if (discountType === "PERCENTAGE") {
    previewValue.textContent =
      `${discountValue}% OFF`;
  } else if (discountType === "FLAT") {
    previewValue.textContent =
      `₹${discountValue.toLocaleString(
        "en-IN",
      )} OFF`;
  } else {
    previewValue.textContent = "—";
  }

  if (discountType === "PERCENTAGE") {
    const maxDiscount =
      Number(maxDiscountInput.value);

    previewMaxDiscount.textContent =
      maxDiscountInput.value.trim()
        ? `₹${maxDiscount.toLocaleString(
            "en-IN",
          )}`
        : "No Limit";
  } else {
    previewMaxDiscount.textContent = "—";
  }

  if (
    startDateInput.value &&
    endDateInput.value
  ) {
    previewDates.textContent =
      `${startDateInput.value} → ${endDateInput.value}`;
  } else {
    previewDates.textContent =
      "Not selected";
  }

  const isActive =
    statusInput.value === "true";

  previewStatus.textContent =
    isActive ? "Active" : "Inactive";

  previewStatus.className =
    `status ${isActive ? "active" : "inactive"}`;
}

scopeInput.addEventListener(
  "change",
  () => {
    if (scopeInput.value === "PRODUCT") {
      categoryInput.value = "";
    } else if (
      scopeInput.value === "CATEGORY"
    ) {
      productInput.value = "";
    }

    toggleScopeFields();
    updatePreview();
  },
);

discountTypeInput.addEventListener(
  "change",
  () => {
    toggleDiscountFields();
    updatePreview();
  },
);

maxDiscountInput.addEventListener(
  "input",
  () => {
    updateMaxDiscountWarning();
    showError("maxDiscountError", "");
    updatePreview();
  },
);

form.addEventListener("input", () => {
  clearErrors();
  updatePreview();
});

[
  productInput,
  categoryInput,
  discountValueInput,
  startDateInput,
  endDateInput,
  statusInput,
].forEach((element) => {
  element.addEventListener(
    "change",
    updatePreview,
  );
});

form.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    clearErrors();

    let hasError = false;

    const title = titleInput.value
      .trim()
      .replace(/\s+/g, " ");

    const offerScope =
      scopeInput.value;

    const appliesTo =
      offerScope === "PRODUCT"
        ? productInput.value
        : offerScope === "CATEGORY"
          ? categoryInput.value
          : "";

    const appliesToModel =
      offerScope === "PRODUCT"
        ? "Product"
        : offerScope === "CATEGORY"
          ? "Category"
          : "";

    const discountType =
      discountTypeInput.value;

    const discountValue =
      Number(discountValueInput.value);

    const maxDiscountAmount =
      discountType === "PERCENTAGE" &&
      maxDiscountInput.value.trim()
        ? Number(maxDiscountInput.value)
        : null;

    const startDate =
      startDateInput.value;

    const endDate =
      endDateInput.value;

    const isActive =
      statusInput.value === "true";

    if (!title) {
      showError(
        "titleError",
        "Offer title is required",
      );

      hasError = true;
    }

    if (!offerScope) {
      showError(
        "offerScopeError",
        "Select offer scope",
      );

      hasError = true;
    }

    if (
      offerScope === "PRODUCT" &&
      !productInput.value
    ) {
      showError(
        "productError",
        "Select a product",
      );

      hasError = true;
    }

    if (
      offerScope === "CATEGORY" &&
      !categoryInput.value
    ) {
      showError(
        "categoryError",
        "Select a category",
      );

      hasError = true;
    }

    if (!discountType) {
      showError(
        "discountTypeError",
        "Select discount type",
      );

      hasError = true;
    }

    if (
      !Number.isFinite(discountValue) ||
      discountValue <= 0
    ) {
      showError(
        "discountValueError",
        "Enter a valid discount",
      );

      hasError = true;
    }

    if (
      discountType === "PERCENTAGE" &&
      discountValue > 100
    ) {
      showError(
        "discountValueError",
        "Percentage cannot exceed 100",
      );

      hasError = true;
    }

    if (
      discountType === "PERCENTAGE" &&
      maxDiscountAmount !== null &&
      (
        !Number.isFinite(
          maxDiscountAmount,
        ) ||
        maxDiscountAmount <= 0
      )
    ) {
      showError(
        "maxDiscountError",
        "Maximum discount must be greater than 0",
      );

      hasError = true;
    }

    if (!startDate) {
      showError(
        "startDateError",
        "Start date required",
      );

      hasError = true;
    }

    if (!endDate) {
      showError(
        "endDateError",
        "End date required",
      );

      hasError = true;
    }

    if (
      startDate &&
      endDate &&
      new Date(endDate) <=
        new Date(startDate)
    ) {
      showError(
        "endDateError",
        "End date must be after start date",
      );

      hasError = true;
    }

    if (hasError) return;

    const originalText =
      submitBtn.innerHTML;

    submitBtn.disabled = true;

    submitBtn.innerHTML = `
      <span class="btn-loader"></span>
      ${mode === "edit"
        ? "Updating..."
        : "Saving..."}
    `;

    try {
      const payload = {
        title,
        offerScope,
        appliesTo,
        appliesToModel,
        discountType,
        discountValue,
        maxDiscountAmount,
        startDate,
        endDate,
        isActive,
      };

      const response =
        mode === "edit"
          ? await axios.patch(
              action,
              payload,
            )
          : await axios.post(
              action,
              payload,
            );

      if (!response.data.success) {
        throw new Error(
          response.data.message ||
          "Unable to save offer",
        );
      }

      utils.showToast(
        mode === "edit"
          ? "Offer updated successfully"
          : "Offer created successfully",
      );

      saveScrollPosition();

      setTimeout(() => {
        window.location.href =
          "/admin/offers";
      }, 1000);
    } catch (error) {
      showError(
        "validationError",
        error.response?.data?.message ||
          error.message ||
          "Something went wrong",
      );

      submitBtn.disabled = false;
      submitBtn.innerHTML =
        originalText;
    }
  },
);

document.addEventListener(
  "DOMContentLoaded",
  restoreScrollPosition,
);

toggleScopeFields();
toggleDiscountFields();
updatePreview();