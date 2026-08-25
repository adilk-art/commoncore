const form = document.getElementById("editProfileForm");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const profileImageInput = document.getElementById("profileImageInput");
const previewImg = document.getElementById("previewImg");
const nameError = document.getElementById("nameError");
const phoneError = document.getElementById("phoneError");
const imageSelectError = document.getElementById("imageSelectError");
const serverErr = document.getElementById("serverErr");
const successMsg = document.getElementById("profileUpdateSuccessMsg");
const successText = document.querySelector(".profile-success-text");
const actionBtns = document.getElementById("profileActionBtns");

const cropModal = document.getElementById("cropModal");
const cropImageEl = document.getElementById("cropImage");

let cropper = null;
let croppedProfileFile = null;

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

function showError(element, message) {
  if (!element) return;
  element.textContent = message;
  element.style.display = "block";
}

function clearError(element) {
  if (!element) return;
  element.textContent = "";
  element.style.display = "none";
}

function clearProfileErrors() {
  clearError(nameError);
  clearError(phoneError);
  clearError(imageSelectError);
  clearError(serverErr);
  nameInput?.classList.remove("input-error");
  phoneInput?.classList.remove("input-error");
}

function validateName() {
  const name = nameInput.value.trim();

  clearError(nameError);
  nameInput.classList.remove("input-error");

  if (!name) {
    showError(nameError, "Name is required");
    nameInput.classList.add("input-error");
    return false;
  }

  if (name.length < 3) {
    showError(nameError, "Name must be at least 3 characters");
    nameInput.classList.add("input-error");
    return false;
  }

  if (!/^[A-Za-z\s]+$/.test(name)) {
    showError(nameError, "Name can only contain letters");
    nameInput.classList.add("input-error");
    return false;
  }

  return true;
}

function validatePhone() {
  const phone = phoneInput.value.trim();

  clearError(phoneError);
  phoneInput.classList.remove("input-error");

  if (!phone) return true;

  if (!/^[6-9]\d{9}$/.test(phone)) {
    showError(phoneError, "Enter a valid 10-digit phone number");
    phoneInput.classList.add("input-error");
    return false;
  }

  return true;
}

nameInput?.addEventListener("input", () => {
  clearError(nameError);
  nameInput.classList.remove("input-error");
});

phoneInput?.addEventListener("input", () => {
  clearError(phoneError);
  phoneInput.classList.remove("input-error");
});

profileImageInput?.addEventListener("change", (e) => {
  clearError(imageSelectError);

  const file = e.target.files?.[0];

  if (!file) return;

  if (!allowedImageTypes.includes(file.type)) {
    profileImageInput.value = "";
    showError(imageSelectError, "Only JPG, PNG or WEBP images are allowed");
    return;
  }

  const reader = new FileReader();

  reader.onload = (event) => {
    cropImageEl.src = event.target.result;
    cropModal.classList.add("active");

    if (cropper) cropper.destroy();

    cropper = new Cropper(cropImageEl, {
      aspectRatio: 1,
      viewMode: 1,
      autoCropArea: 1,
      dragMode: "move",
    });
  };

  reader.readAsDataURL(file);
});

function closeCropModal() {
  cropModal?.classList.remove("active");

  if (cropper) {
    cropper.destroy();
    cropper = null;
  }

  if (!croppedProfileFile && profileImageInput) {
    profileImageInput.value = "";
  }
}

function cropImage() {
  if (!cropper) return;

  const canvas = cropper.getCroppedCanvas({
    width: 600,
    height: 600,
  });

  canvas.toBlob(
    (blob) => {
      if (!blob) return;

      croppedProfileFile = new File([blob], `profile-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      if (previewImg) {
        previewImg.src = URL.createObjectURL(croppedProfileFile);
      }

      cropModal.classList.remove("active");
      cropper.destroy();
      cropper = null;
    },
    "image/jpeg",
    0.9,
  );
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  clearProfileErrors();

  const validName = validateName();
  const validPhone = validatePhone();

  if (!validName || !validPhone) return;

  const submitBtn = form.querySelector(".submit-btn");
  const originalText = submitBtn?.innerHTML;

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";
  }

  const formData = new FormData();

  formData.append("name", nameInput.value.trim());
  formData.append("phone", phoneInput.value.trim());

  if (croppedProfileFile) {
    formData.append("profileImage", croppedProfileFile);
  }

  try {
    const response = await axios.patch("/user/profile/edit", formData);

    if (response.data.success) {
      if (successText) {
        successText.textContent =
          response.data.message || "Profile updated successfully";
      }

      successMsg?.classList.add("show-success");
      actionBtns?.classList.add("profile-action-hide");

      setTimeout(() => {
        window.location.href = "/user/profile";
      }, 1000);
    }
  } catch (error) {
    showError(
      serverErr,
      error.response?.data?.message || "Unable to update profile",
    );

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
});

const emailModal = document.getElementById("emailModal");
const emailStep1 = document.getElementById("step1");
const emailStep2 = document.getElementById("step2");
const confirmPassword = document.getElementById("confirmPassword");
const newEmail = document.getElementById("newEmail");
const passwordError = document.getElementById("passwordError");
const emailError = document.getElementById("emailError");
const confirmPassEye = document.getElementById("confirmPassEye");

function openEmailModal() {
  if (!emailModal) return;

  emailModal.style.display = "flex";
  emailStep1.style.display = "block";
  emailStep2.style.display = "none";

  confirmPassword.value = "";
  newEmail.value = "";
  passwordError.textContent = "";
  emailError.textContent = "";
}

function closeEmailModal() {
  if (!emailModal) return;

  emailModal.style.display = "none";
  emailStep1.style.display = "block";
  emailStep2.style.display = "none";

  confirmPassword.value = "";
  newEmail.value = "";
  passwordError.textContent = "";
  emailError.textContent = "";
}

async function verifyPasswordStep() {
  const password = confirmPassword.value.trim();

  passwordError.textContent = "";

  if (!password) {
    passwordError.textContent = "Enter your current password";
    return;
  }

  try {
    const response = await axios.post("/user/profile/verify-password", {
      password,
    });

    if (response.data.success) {
      emailStep1.style.display = "none";
      emailStep2.style.display = "block";
    }
  } catch (error) {
    passwordError.textContent =
      error.response?.data?.message || "Incorrect password";
  }
}

async function sendOtp() {
  const email = newEmail.value.trim().toLowerCase();

  emailError.textContent = "";

  if (!email) {
    emailError.textContent = "Enter your new email";
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError.textContent = "Enter a valid email address";
    return;
  }

  const sendOtpBtn = document.getElementById("sendEmailOtpBtn");

  if (sendOtpBtn) {
    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = "Sending...";
  }

  try {
    const response = await axios.patch("/user/profile/email-change", {
      email,
    });

    if (response.data.success) {
      if (sendOtpBtn) {
        sendOtpBtn.textContent = "OTP Sent";
      }

      closeEmailModal();

      openOtpModal("email-change", email);
    }
  } catch (error) {
    emailError.textContent =
      error.response?.data?.message || "Unable to send OTP";

    if (sendOtpBtn) {
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = "Send OTP";
    }
  }
}

confirmPassEye?.addEventListener("click", () => {
  const icon = confirmPassEye.querySelector("i");

  if (confirmPassword.type === "password") {
    confirmPassword.type = "text";
    icon?.classList.remove("fa-eye");
    icon?.classList.add("fa-eye-slash");
  } else {
    confirmPassword.type = "password";
    icon?.classList.remove("fa-eye-slash");
    icon?.classList.add("fa-eye");
  }
});

emailModal?.addEventListener("click", (e) => {
  if (e.target === emailModal) {
    closeEmailModal();
  }
});

const pwdModal = document.getElementById("pwd_modal");
const pwdCurrent = document.getElementById("pwd_current");
const pwdNew = document.getElementById("pwd_new");
const pwdConfirm = document.getElementById("pwd_confirm");
const pwdError = document.getElementById("pwd_error");
const successModal = document.getElementById("successModal");

function pwd_openModal() {
  if (!pwdModal) return;

  pwdModal.style.display = "flex";
  pwdCurrent.value = "";
  pwdNew.value = "";
  pwdConfirm.value = "";
  pwdError.textContent = "";
}

function pwd_closeModal() {
  if (!pwdModal) return;

  pwdModal.style.display = "none";
  pwdCurrent.value = "";
  pwdNew.value = "";
  pwdConfirm.value = "";
  pwdError.textContent = "";
}

function togglePwd(inputId, icon) {
  const input = document.getElementById(inputId);

  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

async function pwd_changePassword() {
  const currentPassword = pwdCurrent.value.trim();
  const newPassword = pwdNew.value.trim();
  const confirmNewPassword = pwdConfirm.value.trim();

  pwdError.textContent = "";

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    pwdError.textContent = "All password fields are required";
    return;
  }

  if (newPassword.length < 8) {
    pwdError.textContent = "Password must be at least 8 characters";
    return;
  }

  if (!/\d/.test(newPassword)) {
    pwdError.textContent = "Password must contain at least one number";
    return;
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(newPassword)) {
    pwdError.textContent =
      "Password must contain at least one special character";
    return;
  }

  if (newPassword !== confirmNewPassword) {
    pwdError.textContent = "Passwords do not match";
    return;
  }

  if (currentPassword === newPassword) {
    pwdError.textContent =
      "New password must be different from current password";
    return;
  }

  try {
    const response = await axios.post("/user/profile/change-password", {
      currentPassword,
      newPassword,
      confirmPassword: confirmNewPassword,
    });

    if (response.data.success) {
      pwd_closeModal();

      if (successModal) {
        successModal.style.display = "flex";
      }
    }
  } catch (error) {
    pwdError.textContent =
      error.response?.data?.message || "Unable to change password";
  }
}

function goToLogin() {
  window.location.href = "/user/login";
}

pwdModal?.addEventListener("click", (e) => {
  if (e.target === pwdModal) {
    pwd_closeModal();
  }
});

window.closeCropModal = closeCropModal;
window.cropImage = cropImage;
window.openEmailModal = openEmailModal;
window.closeEmailModal = closeEmailModal;
window.verifyPasswordStep = verifyPasswordStep;
window.sendOtp = sendOtp;
window.pwd_openModal = pwd_openModal;
window.pwd_closeModal = pwd_closeModal;
window.togglePwd = togglePwd;
window.pwd_changePassword = pwd_changePassword;
window.goToLogin = goToLogin;
