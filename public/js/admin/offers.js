document.addEventListener("click", (e) => {
  const btn = e.target.closest(".toggle-status-btn");

  if (!btn) return;

  const id = btn.dataset.id;
  const isActive = btn.dataset.active === "true";

  openConfirmModal(
    `Are you sure you want to ${isActive ? "deactivate" : "activate"} this offer?`,
    () => changeOfferStatus(id),
  );
});

const changeOfferStatus = async (id) => {
  try {
    const res = await axios.patch(`/admin/offers/status/${id}`);

    if (res.data.success) {
      utils.showToast(res.data.message);

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (err) {
    console.error(err);

    utils.showToast(
      err.response?.data?.message || "Something went wrong",
      "error",
    );
  }
};
