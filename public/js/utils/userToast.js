function userToast(message, type = "info") {
  let container = document.querySelector(".toast-container");

  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;

  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close">&times;</button>
  `;

  container.appendChild(toast);

  const removeToast = () => {
    toast.classList.add("toast-hide");

    setTimeout(() => {
      toast.remove();
    }, 200);
  };

  toast.querySelector(".toast-close").addEventListener("click", removeToast);

  setTimeout(removeToast, 3000);
}
