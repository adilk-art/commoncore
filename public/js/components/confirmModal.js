const confirmModal = document.getElementById("confirmModal");
const confirmMessage = document.getElementById("confirmMessage");
const confirmBtn = document.getElementById("confirmBtn");

 const openConfirmModal = (message, callback) => {
  confirmMessage.textContent = message;

  confirmModal.classList.add("show");

  confirmBtn.onclick = () => {
    callback();
    closeConfirmModal();
  };
};

 const closeConfirmModal = () => {
  confirmModal.classList.remove("show");
};