const showToast = (message, type = "success") => {
  const existingToast = document.querySelector(".custom-toast");

  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");

  toast.className = `custom-toast ${type}`;

  toast.innerHTML = `

    <div class="toast-content">

      <i class="fa-solid ${
        type === "success" ? "fa-circle-check" : "fa-circle-exclamation"
      }"></i>

      <span>${message}</span>

    </div>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
};

window.utils = {
  showToast,
};
