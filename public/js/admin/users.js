let selectedUserId = null;
let isBlockedState = false;

function openModal(userId, isBlocked) {
  selectedUserId = userId;
  isBlockedState = isBlocked;
  document.getElementById("confirmModal").style.display = "flex";

  console.log(isBlocked);

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
  form.action = `/admin/users/toggle-block/${selectedUserId}`;
  form.submit();
}
