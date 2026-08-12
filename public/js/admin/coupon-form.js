document.addEventListener("DOMContentLoaded", () => {
  const couponForm = document.getElementById("couponForm");

  if (!couponForm) {
    console.error("Coupon form not found");
    return;
  }

  const submitCouponBtn = document.getElementById("submitCouponBtn");
  const submitBtnText = submitCouponBtn?.querySelector(".btn-text");
  const submitBtnLoader = submitCouponBtn?.querySelector(".btn-loader");

  const nameInput = document.getElementById("name");
  const codeInput = document.getElementById("code");
  const descriptionInput = document.getElementById("description");
  const discountTypeInput = document.getElementById("discountType");
  const discountValueInput = document.getElementById("discountValue");

  const minimumPurchaseInput = document.getElementById(
    "minimumPurchaseAmount",
  );

  const maximumDiscountInput = document.getElementById(
    "maximumDiscountAmount",
  );

  const maximumDiscountGroup = document.getElementById(
    "maximumDiscountGroup",
  );

  const discountValuePrefix = document.getElementById(
    "discountValuePrefix",
  );

  const validFromInput = document.getElementById("validFrom");
  const validUntilInput = document.getElementById("validUntil");
  const usageLimitInput = document.getElementById("usageLimit");
  const isActiveInput = document.getElementById("isActive");
  const statusLabel = document.getElementById("statusLabel");

  const previewCode = document.getElementById("previewCode");
  const previewName = document.getElementById("previewName");
  const previewDescription = document.getElementById(
    "previewDescription",
  );
  const previewDiscount = document.getElementById("previewDiscount");
  const previewMaximum = document.getElementById("previewMaximum");
  const previewMinimum = document.getElementById("previewMinimum");
  const previewUsage = document.getElementById("previewUsage");
  const previewValidity = document.getElementById("previewValidity");
  const previewStatus = document.getElementById("previewStatus");

  const showToast = (message, type = "success") => {
    if (typeof adminToast === "function") {
      adminToast(message, type);
      return;
    }

    if (
      typeof window.utils !== "undefined" &&
      typeof window.utils.showToast === "function"
    ) {
      window.utils.showToast(message, type);
      return;
    }

    alert(message);
  };

  const showFieldError = (fieldName, message) => {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(
      `${fieldName}Error`,
    );

    field?.classList.add("input-error");

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add("show");
    }
  };

  const clearFieldError = (fieldName) => {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(
      `${fieldName}Error`,
    );

    field?.classList.remove("input-error");

    if (errorElement) {
      errorElement.textContent = "";
      errorElement.classList.remove("show");
    }
  };

  const clearAllErrors = () => {
    document.querySelectorAll(".field-error").forEach((error) => {
      error.textContent = "";
      error.classList.remove("show");
    });

    document.querySelectorAll(".input-error").forEach((field) => {
      field.classList.remove("input-error");
    });
  };

  const focusFirstError = () => {
    const firstInvalidField =
      document.querySelector(".input-error");

    firstInvalidField?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    firstInvalidField?.focus();
  };

  const validateCouponForm = () => {
    clearAllErrors();

    let isValid = true;

    const name = nameInput.value.trim();
    const code = codeInput.value.trim();
    const description = descriptionInput.value.trim();
    const discountType = discountTypeInput.value;
    const discountValue = discountValueInput.value.trim();

    const minimumPurchaseAmount =
      minimumPurchaseInput.value.trim();

    const maximumDiscountAmount =
      maximumDiscountInput.value.trim();

    const validFrom = validFromInput.value;
    const validUntil = validUntilInput.value;
    const usageLimit = usageLimitInput.value.trim();

    if (!name) {
      showFieldError("name", "Coupon name is required.");
      isValid = false;
    } else if (name.length < 3) {
      showFieldError(
        "name",
        "Coupon name must contain at least 3 characters.",
      );
      isValid = false;
    }

    if (!code) {
      showFieldError("code", "Coupon code is required.");
      isValid = false;
    } else if (code.length < 3) {
      showFieldError(
        "code",
        "Coupon code must contain at least 3 characters.",
      );
      isValid = false;
    } else if (!/^[A-Z0-9_-]+$/.test(code)) {
      showFieldError(
        "code",
        "Use only letters, numbers, hyphens and underscores.",
      );
      isValid = false;
    }

    if (!description) {
      showFieldError(
        "description",
        "Coupon description is required.",
      );
      isValid = false;
    } else if (description.length < 5) {
      showFieldError(
        "description",
        "Description must contain at least 5 characters.",
      );
      isValid = false;
    }

    if (!discountType) {
      showFieldError(
        "discountType",
        "Please select a discount type.",
      );
      isValid = false;
    }

    if (discountValue === "") {
      showFieldError(
        "discountValue",
        "Discount value is required.",
      );
      isValid = false;
    } else if (
      !Number.isFinite(Number(discountValue)) ||
      Number(discountValue) <= 0
    ) {
      showFieldError(
        "discountValue",
        "Discount value must be greater than 0.",
      );
      isValid = false;
    } else if (
      discountType === "PERCENTAGE" &&
      Number(discountValue) > 100
    ) {
      showFieldError(
        "discountValue",
        "Percentage discount cannot exceed 100.",
      );
      isValid = false;
    }

    if (minimumPurchaseAmount === "") {
      showFieldError(
        "minimumPurchaseAmount",
        "Minimum purchase amount is required.",
      );
      isValid = false;
    } else if (
      !Number.isFinite(Number(minimumPurchaseAmount)) ||
      Number(minimumPurchaseAmount) < 0
    ) {
      showFieldError(
        "minimumPurchaseAmount",
        "Minimum purchase amount cannot be negative.",
      );
      isValid = false;
    }

    if (discountType === "PERCENTAGE") {
      if (maximumDiscountAmount === "") {
        showFieldError(
          "maximumDiscountAmount",
          "Maximum discount amount is required.",
        );
        isValid = false;
      } else if (
        !Number.isFinite(Number(maximumDiscountAmount)) ||
        Number(maximumDiscountAmount) <= 0
      ) {
        showFieldError(
          "maximumDiscountAmount",
          "Maximum discount must be greater than 0.",
        );
        isValid = false;
      }
    }

    if (!validFrom) {
      showFieldError(
        "validFrom",
        "Valid from date is required.",
      );
      isValid = false;
    }

    if (!validUntil) {
      showFieldError(
        "validUntil",
        "Valid until date is required.",
      );
      isValid = false;
    }

    if (
      validFrom &&
      validUntil &&
      new Date(validUntil) <= new Date(validFrom)
    ) {
      showFieldError(
        "validUntil",
        "Valid until must be later than valid from.",
      );
      isValid = false;
    }

    if (
      usageLimit !== "" &&
      (!Number.isInteger(Number(usageLimit)) ||
        Number(usageLimit) < 1)
    ) {
      showFieldError(
        "usageLimit",
        "Usage limit must be a whole number greater than 0.",
      );
      isValid = false;
    }

    if (!isValid) {
      focusFirstError();
    }

    return isValid;
  };

  const setSubmitLoading = (loading) => {
    if (!submitCouponBtn) return;

    submitCouponBtn.disabled = loading;
    submitBtnText?.classList.toggle("hidden", loading);
    submitBtnLoader?.classList.toggle("hidden", !loading);
  };

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (value) => {
    if (!value) return "";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const updateDiscountFields = () => {
    const discountType = discountTypeInput.value;

    if (discountType === "PERCENTAGE") {
      maximumDiscountGroup.style.display = "";
      discountValuePrefix.textContent = "%";
      return;
    }

    maximumDiscountGroup.style.display = "none";
    discountValuePrefix.textContent = "₹";
    maximumDiscountInput.value = "";

    clearFieldError("maximumDiscountAmount");
  };

  const updateStatusPreview = () => {
    const active = isActiveInput.checked;

    statusLabel.textContent = active ? "Active" : "Inactive";
    previewStatus.textContent = active ? "Active" : "Inactive";

    previewStatus.classList.toggle("active", active);
    previewStatus.classList.toggle("inactive", !active);
  };

  const updatePreview = () => {
    const name = nameInput.value.trim();
    const code = codeInput.value.trim();
    const description = descriptionInput.value.trim();
    const discountType = discountTypeInput.value;
    const discountValue = discountValueInput.value;
    const minimumPurchase = minimumPurchaseInput.value;
    const maximumDiscount = maximumDiscountInput.value;
    const usageLimit = usageLimitInput.value;
    const validFrom = validFromInput.value;
    const validUntil = validUntilInput.value;

    previewName.textContent = name || "Coupon Name";
    previewCode.textContent = code || "COUPONCODE";

    previewDescription.textContent =
      description || "Coupon description will appear here.";

    if (
      discountType === "PERCENTAGE" &&
      discountValue
    ) {
      previewDiscount.textContent = `${Number(
        discountValue,
      )}% OFF`;
    } else if (
      discountType === "FLAT" &&
      discountValue
    ) {
      previewDiscount.textContent =
        `₹${formatCurrency(discountValue)} OFF`;
    } else {
      previewDiscount.textContent = "Discount";
    }

    if (
      discountType === "PERCENTAGE" &&
      maximumDiscount
    ) {
      previewMaximum.textContent =
        `Maximum discount ₹${formatCurrency(
          maximumDiscount,
        )}`;
    } else {
      previewMaximum.textContent = "";
    }

    previewMinimum.textContent = minimumPurchase
      ? `₹${formatCurrency(minimumPurchase)}`
      : "₹0";

    previewUsage.textContent = usageLimit
      ? `${usageLimit} uses`
      : "Unlimited";

    if (validFrom && validUntil) {
      previewValidity.textContent =
        `${formatDate(validFrom)} - ${formatDate(validUntil)}`;
    } else if (validFrom) {
      previewValidity.textContent =
        `From ${formatDate(validFrom)}`;
    } else if (validUntil) {
      previewValidity.textContent =
        `Until ${formatDate(validUntil)}`;
    } else {
      previewValidity.textContent = "Select validity dates";
    }

    updateStatusPreview();
  };

  const getPayload = () => {
    const discountType = discountTypeInput.value;
    const usageLimit = usageLimitInput.value.trim();

    return {
      name: nameInput.value.trim(),
      code: codeInput.value.trim().toUpperCase(),
      description: descriptionInput.value.trim(),
      discountType,
      discountValue: Number(discountValueInput.value),
      minimumPurchaseAmount: Number(
        minimumPurchaseInput.value,
      ),
      maximumDiscountAmount:
        discountType === "PERCENTAGE"
          ? Number(maximumDiscountInput.value)
          : null,
      validFrom: validFromInput.value,
      validUntil: validUntilInput.value,
      usageLimit:
        usageLimit === "" ? null : Number(usageLimit),
      isActive: isActiveInput.checked,
    };
  };

  const handleServerErrors = (errors) => {
    if (!errors) return false;

    let handled = false;

    if (Array.isArray(errors)) {
      errors.forEach((error) => {
        const fieldName =
          error.field ||
          error.path?.[0] ||
          error.param;

        if (
          fieldName &&
          document.getElementById(fieldName)
        ) {
          showFieldError(
            fieldName,
            error.message || "Invalid value.",
          );

          handled = true;
        }
      });
    } else if (typeof errors === "object") {
      Object.entries(errors).forEach(
        ([fieldName, message]) => {
          if (document.getElementById(fieldName)) {
            showFieldError(
              fieldName,
              Array.isArray(message)
                ? message[0]
                : message,
            );

            handled = true;
          }
        },
      );
    }

    if (handled) {
      focusFirstError();
    }

    return handled;
  };

  codeInput.addEventListener("input", () => {
    codeInput.value = codeInput.value
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "");

    clearFieldError("code");
    updatePreview();
  });

  discountTypeInput.addEventListener("change", () => {
    clearFieldError("discountType");
    updateDiscountFields();
    updatePreview();
  });

  isActiveInput.addEventListener(
    "change",
    updateStatusPreview,
  );

  couponForm
    .querySelectorAll("input, textarea, select")
    .forEach((field) => {
      field.addEventListener("input", () => {
        clearFieldError(field.id);
        updatePreview();
      });

      field.addEventListener("change", () => {
        clearFieldError(field.id);
        updatePreview();
      });
    });

  couponForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    console.log("Coupon form submit intercepted");

    if (!validateCouponForm()) {
      return;
    }

    const couponId = couponForm.dataset.id;
    const isEdit = couponForm.dataset.edit === "true";
    const payload = getPayload();

    try {
      setSubmitLoading(true);

            const response = isEdit
            ? await axios.patch(
                `/admin/coupons/${couponId}/edit`,
                payload,
                )
            : await axios.post(
                "/admin/coupons/add",
                payload,
                );

      if (!response.data.success) {
        showToast(
          response.data.message || "Unable to save coupon.",
          "error",
        );
        return;
      }

      showToast(
        response.data.message ||
          `Coupon ${
            isEdit ? "updated" : "created"
          } successfully.`,
      );

      setTimeout(() => {
        window.location.href = "/admin/coupons";
      }, 800);
    } catch (error) {
      const responseData = error.response?.data;

      if (handleServerErrors(responseData?.errors)) {
        return;
      }

      if (
        responseData?.field &&
        document.getElementById(responseData.field)
      ) {
        showFieldError(
          responseData.field,
          responseData.message || "Invalid value.",
        );

        focusFirstError();
        return;
      }

      if (
        responseData?.message
          ?.toLowerCase()
          .includes("code")
      ) {
        showFieldError(
          "code",
          responseData.message,
        );

        focusFirstError();
        return;
      }

      showToast(
        responseData?.message || "Something went wrong.",
        "error",
      );
    } finally {
      setSubmitLoading(false);
    }
  });

  updateDiscountFields();
  updatePreview();

});