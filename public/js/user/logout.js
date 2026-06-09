function openUserLogoutModal() {
  const modal = document.getElementById("userLogoutModal");

  if (modal) {
    modal.style.display = "flex";
  }
}

function closeUserLogoutModal() {
  const modal = document.getElementById("userLogoutModal");

  if (modal) {
    modal.style.display = "none";
  }
}

window.addEventListener("click", (e) => {
  const modal = document.getElementById("userLogoutModal");

  if (e.target === modal) {
    closeUserLogoutModal();
  }
});