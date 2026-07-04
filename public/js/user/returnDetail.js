const cancelReturnBtn = document.querySelector(".cancel-return-btn");

cancelReturnBtn?.addEventListener("click", async () => {
  const returnId = cancelReturnBtn.dataset.returnId;

  const confirmed = confirm(
    "Are you sure you want to cancel this return request?",
  );
  if (!confirmed) return;

  try {
    cancelReturnBtn.disabled = true;
    cancelReturnBtn.textContent = "Cancelling...";

    const res = await axios.patch(`/user/returns/${returnId}/cancel`);

    if (res.data.success) {
      window.location.reload();
    }
  } catch (error) {
    alert(error.response?.data?.message || "Failed to cancel return request");
    cancelReturnBtn.disabled = false;
    cancelReturnBtn.textContent = "Cancel Return";
  }
});

const openCancelReturnModalBtn = document.getElementById(
  "openCancelReturnModal",
);
const cancelReturnModal = document.getElementById("cancelReturnModal");
const closeCancelReturnModalBtn = document.getElementById(
  "closeCancelReturnModal",
);
const keepReturnBtn = document.getElementById("keepReturnBtn");
const confirmCancelReturnBtn = document.getElementById(
  "confirmCancelReturnBtn",
);

const openCancelReturnModal = () => {
  cancelReturnModal?.classList.remove("hidden");
  document.body.style.overflow = "hidden";
};

const closeCancelReturnModal = () => {
  cancelReturnModal?.classList.add("hidden");
  document.body.style.overflow = "";
};

openCancelReturnModalBtn?.addEventListener("click", openCancelReturnModal);
closeCancelReturnModalBtn?.addEventListener("click", closeCancelReturnModal);
keepReturnBtn?.addEventListener("click", closeCancelReturnModal);

cancelReturnModal?.addEventListener("click", (event) => {
  if (event.target === cancelReturnModal) {
    closeCancelReturnModal();
  }
});

confirmCancelReturnBtn?.addEventListener("click", async () => {
  const returnId = confirmCancelReturnBtn.dataset.returnId;

  try {
    confirmCancelReturnBtn.disabled = true;
    confirmCancelReturnBtn.textContent = "Cancelling...";

    const res = await axios.patch(`/user/returns/${returnId}/cancel`);

    if (res.data.success) {
      window.location.reload();
    }
  } catch (error) {
    alert(error.response?.data?.message || "Failed to cancel return request");
    confirmCancelReturnBtn.disabled = false;
    confirmCancelReturnBtn.textContent = "Confirm Cancellation";
  }
});
