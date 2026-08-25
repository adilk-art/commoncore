const contactForm = document.getElementById("contactForm");
const contactSubmitBtn = document.getElementById("contactSubmitBtn");
const contactFormSection = document.getElementById("contactFormSection");
const contactSuccess = document.getElementById("contactSuccess");
const sendAnotherMessageBtn = document.getElementById("sendAnotherMessageBtn");

const contactName = document.getElementById("contactName");
const contactEmail = document.getElementById("contactEmail");
const contactSubject = document.getElementById("contactSubject");
const contactMessage = document.getElementById("contactMessage");

function showContactError(field, message) {
  const error = document.getElementById(`${field}Error`);
  const input = contactForm.elements[field];

  if (error) {
    error.textContent = message;
    error.style.display = "block";
  }

  input?.classList.add("input-error");
}

function clearContactErrors() {
  document.querySelectorAll(".contact-error").forEach((error) => {
    error.textContent = "";
    error.style.display = "none";
  });

  contactForm?.querySelectorAll(".input-error").forEach((input) => {
    input.classList.remove("input-error");
  });
}

function validateContactForm() {
  const name = contactName.value.trim();
  const email = contactEmail.value.trim();
  const subject = contactSubject.value.trim();
  const message = contactMessage.value.trim();

  let valid = true;

  if (!name) {
    showContactError("name", "Name is required");
    valid = false;
  } else if (name.length < 3) {
    showContactError("name", "Name must be at least 3 characters");
    valid = false;
  } else if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(name)) {
    showContactError("name", "Enter a valid name");
    valid = false;
  }

  if (!email) {
    showContactError("email", "Email is required");
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showContactError("email", "Enter a valid email address");
    valid = false;
  }

  if (!subject) {
    showContactError("subject", "Subject is required");
    valid = false;
  } else if (subject.length < 3) {
    showContactError("subject", "Subject must be at least 3 characters");
    valid = false;
  }

  if (!message) {
    showContactError("message", "Message is required");
    valid = false;
  } else if (message.length < 10) {
    showContactError("message", "Message must be at least 10 characters");
    valid = false;
  }

  return valid;
}

contactForm?.querySelectorAll("input, textarea").forEach((input) => {
  input.addEventListener("input", () => {
    input.classList.remove("input-error");

    const error = document.getElementById(`${input.name}Error`);

    if (error) {
      error.textContent = "";
      error.style.display = "none";
    }
  });
});

contactForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (contactSubmitBtn.disabled) return;

  clearContactErrors();

  if (!validateContactForm()) return;

  const data = {
    name: contactName.value.trim(),
    email: contactEmail.value.trim(),
    subject: contactSubject.value.trim(),
    message: contactMessage.value.trim(),
  };

  const originalContent = contactSubmitBtn.innerHTML;

  contactSubmitBtn.disabled = true;
  contactSubmitBtn.innerHTML = `
    <span class="contact-btn-loader"></span>
    Sending...
  `;

  try {
    const response = await axios.post("/user/contact", data);

    if (response.data.success) {
      contactForm.reset();
      clearContactErrors();

      contactFormSection.style.display = "none";
      contactSuccess.classList.add("show");

      utils.showToast(
        response.data.message || "Message sent successfully",
        "success",
      );
    }
  } catch (err) {
    const errors = err.response?.data?.errors;

    if (Array.isArray(errors) && errors.length) {
      errors.forEach((error) => {
        const field = error.path?.[0];

        if (field) {
          showContactError(field, error.message);
        }
      });

      utils.showToast(
        errors[0]?.message || "Please check the entered details",
        "error",
      );
    } else {
      utils.showToast(
        err.response?.data?.message || "Unable to send message",
        "error",
      );
    }
  } finally {
    contactSubmitBtn.disabled = false;
    contactSubmitBtn.innerHTML = originalContent;
  }
});

sendAnotherMessageBtn?.addEventListener("click", () => {
  contactSuccess.classList.remove("show");
  contactFormSection.style.display = "block";

  contactForm.reset();
  clearContactErrors();

  setTimeout(() => {
    contactName?.focus();
  }, 100);
});
