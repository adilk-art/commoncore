let selectedUserId = null;
let isBlockedState = false;

function openModal(userId, isBlocked) {
  selectedUserId = userId;
  isBlockedState = isBlocked;

  document.getElementById("confirmModal").style.display = "flex";

  const text = isBlocked
    ? "Do you want to unblock this user?"
    : "Do you want to block this user?";

  document.getElementById("modalText").innerText = text;
}

function closeModal() {
  document.getElementById("confirmModal").style.display = "none";
}

function confirmAction() {
  const form = document.getElementById("blockForm");

  const message = isBlockedState
    ? "User unblocked successfully"
    : "User blocked successfully";

  sessionStorage.setItem("userActionToast", message);

  form.action = `/admin/users/toggle-block/${selectedUserId}`;
  form.submit();
}

document.addEventListener("DOMContentLoaded", () => {
  const message = sessionStorage.getItem("userActionToast");

  if (message) {
    sessionStorage.removeItem("userActionToast");

    setTimeout(() => {
      utils.showToast(message, "success");
    }, 100);
  }
});