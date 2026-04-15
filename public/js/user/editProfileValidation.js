const form = document.querySelector("form");

const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");

const nameError = document.getElementById("nameError");
const phoneError = document.getElementById("phoneError");

form.addEventListener("submit", (e) => {
  let isValid = true;

  nameError.innerText = "";
  phoneError.innerText = "";
  phoneInput.classList.remove("input-error");
  nameInput.classList.remove("input-error");

  // NAME VALIDATION
  const name = nameInput.value.trim();

  if (!name) {
    nameError.innerText = "Name is required";
    nameError.style.display="block"
    nameInput.classList.add("input-error");
    isValid = false;
  } else if (name.length < 1) {
    nameError.innerText = "Name must be at least 3 characters";
    nameError.style.display="block"
    nameInput.classList.add("input-error");
    isValid = false;
  }

  // PHONE VALIDATION
  const phone = phoneInput.value.trim();

  if (phone) {
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
      phoneError.innerText = "Enter valid 10-digit phone number";
      phoneError.style.display="block"
      phoneInput.classList.add("input-error");
      isValid = false;
    }
  }

  // STOP FORM SUBMIT
  if (!isValid) {
    e.preventDefault();
  }
});