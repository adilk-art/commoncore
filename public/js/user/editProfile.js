const form = document.getElementById("editProfileForm");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");

const nameError = document.getElementById("nameError");
const phoneError = document.getElementById("phoneError");
const serverErr = document.getElementById("serverErr");

const input = document.getElementById("profileImageInput");
const preview = document.getElementById("previewImg");

const cropModal = document.getElementById("cropModal");
const cropImg = document.getElementById("cropImage");
const imageSelectError = document.getElementById("imageSelectError");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  let isValid = true;

  nameError.innerText = "";
  phoneError.innerText = "";
  nameError.style.display = "none";
  phoneError.style.display = "none";
  serverErr.textContent = "";
  serverErr.style.display = "none";

  phoneInput.classList.remove("input-error");
  nameInput.classList.remove("input-error");

  const name = nameInput.value.trim();

  if (!name) {
    nameError.innerText = "Name is required";
    nameError.style.display = "block";
    nameInput.classList.add("input-error");
    isValid = false;
  } else if (name.length < 3) {
    nameError.innerText = "Name must be at least 3 characters";
    nameError.style.display = "block";
    nameInput.classList.add("input-error");
    isValid = false;
  }

  const phone = phoneInput.value.trim();

  if (phone) {
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
      phoneError.innerText = "Enter valid 10-digit phone number";
      phoneError.style.display = "block";
      phoneInput.classList.add("input-error");
      isValid = false;
    }
  }

  if (!isValid) return;

  const formData = new FormData(form);

  try {
    const res = await axios.patch("/user/profile/edit", formData);

    if (res.data.success) {
      const successBox = document.getElementById("profileUpdateSuccessMsg");
      const actionBtns = document.getElementById("profileActionBtns");

      successBox.classList.add("show-success");
      successBox.querySelector(".profile-success-text").textContent =
        res.data.message || "Profile updated successfully";
      imageSelectError.textContent = "";
      actionBtns.style.display = "none";
      actionBtns.classList.add("profile-action-hide");

      setTimeout(() => {
        window.location.href = "/user/profile";
      }, 1500);
    }
  } catch (err) {
    const data = err.response?.data;
    serverErr.textContent = data?.errors.msg|| "Something went wrong";
    serverErr.style.display = "block";
  }
});

let cropper;

input.addEventListener("change", () => {
  const file = input.files[0];
  imageSelectError.textContent = "";

  if (!file) return;

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = 2 * 1024 * 1024;

  if (!allowed.includes(file.type)) {
    imageSelectError.textContent = "Only JPG, PNG, WEBP allowed";
    input.value = "";
    setTimeout(() => {
      imageSelectError.textContent = "";
      imageSelectError.classList.remove("show-error");
    }, 3000);
    return;
  }

  if (file.size > maxSize) {
    imageSelectError.textContent = "Max size is 2MB";
    input.value = "";
    setTimeout(() => {
      imageSelectError.textContent = "";
      imageSelectError.classList.remove("show-error");
    }, 3000);
    return;
  }

  // set image
  cropImg.src = URL.createObjectURL(file);
  cropModal.classList.add("active");

  setTimeout(() => {
    if (cropper) cropper.destroy();

    cropper = new Cropper(cropImg, {
      aspectRatio: 1,
      viewMode: 1,
      responsive: true,
    });
  }, 50);
});

function cropImage() {
  if (!cropper) return;

  const canvas = cropper.getCroppedCanvas({
    width: 300,
    height: 300,
  });

  const base64 = canvas.toDataURL("image/jpeg");

  preview.src = base64;

  fetch(base64)
    .then((res) => res.blob())
    .then((blob) => {
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
    });

  closeCropModal();
}

function closeCropModal() {
  cropModal.classList.remove("active");
  if (cropper) cropper.destroy();
}

function openEmailModal() {
  document.getElementById("emailModal").style.display = "flex";

  document.getElementById("step1").style.display = "block";
  document.getElementById("step2").style.display = "none";

  clearErrors();
}

function closeEmailModal() {
  document.getElementById("emailModal").style.display = "none";
  document.getElementById("confirmPassword").value = "";
}

function clearErrors() {
  document.getElementById("passwordError").textContent = "";
  document.getElementById("emailError").textContent = "";
}

async function verifyPasswordStep() {
  const password = document.getElementById("confirmPassword").value;
  const passwordError = document.getElementById("passwordError");
  passwordError.textContent = "";
  if (!password) {
    passwordError.textContent = "Password is required";
    passwordError.style.display = "block";
    return;
  }

  try {
    await axios.post("/user/profile/verify-password", { password });

    document.getElementById("step1").style.display = "none";
    document.getElementById("step2").style.display = "block";
  } catch (err) {
    passwordError.textContent =
      err.response?.data?.message || "Incorrect password";
    passwordError.style.display = "block";
  }
}

async function sendOtp() {
  const email = document.getElementById("newEmail").value;
  const emailError = document.getElementById("emailError");

  emailError.textContent = "";

  if (!email) {
    emailError.textContent = "Email is required";
    emailError.style.display = "block";
    return;
  }

  try {
    const res = await axios.patch("/user/profile/email-change", {
      email,
    });

    if (res.data.success) {
      closeEmailModal();
      openOtpModal("email-change", email);
    }
  } catch (err) {
    const msg = err.response?.data?.message || "Something went wrong";
    emailError.textContent = msg;
    emailError.style.display = "block";
  }
}

document.getElementById("confirmPassEye").addEventListener("click", () => {
  const input = document.getElementById("confirmPassword");
  const icon = document.querySelector("#confirmPassEye i");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
});

function pwd_openModal() {
  document.getElementById("pwd_modal").style.display = "flex";
}

function pwd_closeModal() {
  document.getElementById("pwd_modal").style.display = "none";

  document.getElementById("pwd_current").value = "";
  document.getElementById("pwd_new").value = "";
  document.getElementById("pwd_confirm").value = "";
  document.getElementById("pwd_error").textContent = "";
}

function pwd_validate(password) {
  const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
  return regex.test(password);
}

async function pwd_changePassword() {
  const current = document.getElementById("pwd_current").value;
  const newPass = document.getElementById("pwd_new").value;
  const confirm = document.getElementById("pwd_confirm").value;

  const error = document.getElementById("pwd_error");
  error.textContent = "";

  if (!current || !newPass || !confirm) {
    error.textContent = "All fields are required";
    return;
  }

  if (!pwd_validate(newPass)) {
    error.textContent =
      "Min 8 chars, 1 number and 1 special character required";
    return;
  }

  if (newPass !== confirm) {
    error.textContent = "Passwords do not match";
    return;
  }

  try {
    const res = await axios.post("/user/profile/change-password", {
      currentPassword: current,
      newPassword: newPass,
    });

    if (res.data.success) {
      pwd_closeModal();
      document.getElementById("successModal").style.display = "flex";
    }
  } catch (err) {
    error.textContent =
      err.response?.data?.message || "Error updating password";
  }
}

function goToLogin() {
  window.location.href = "/user/login";
}

function togglePwd(inputId, icon) {
  const input = document.getElementById(inputId);

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
