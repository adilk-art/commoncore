const updateStatusBtn = document.getElementById("updateReturnStatusBtn");
const statusSelect = document.getElementById("returnStatusSelect");
const rejectBtn = document.getElementById("rejectReturnBtn");

const rejectModal = document.getElementById("rejectReturnModal");
const closeRejectModal = document.getElementById("closeRejectModal");
const cancelRejectBtn = document.getElementById("cancelRejectBtn");
const confirmRejectBtn = document.getElementById("confirmRejectBtn");
const rejectReasonInput = document.getElementById("rejectReason");

const refundBtn = document.getElementById("processRefundBtn");


function closeRejectDialog() {
  rejectModal?.classList.add("hidden");
  if (rejectReasonInput) rejectReasonInput.value = "";
}

rejectBtn?.addEventListener("click", () => {
  rejectModal?.classList.remove("hidden");
});

closeRejectModal?.addEventListener("click", closeRejectDialog);
cancelRejectBtn?.addEventListener("click", closeRejectDialog);

confirmRejectBtn?.addEventListener("click", async () => {
  const returnId = confirmRejectBtn.dataset.returnId;
  const rejectionReason = rejectReasonInput?.value.trim();

  if (!rejectionReason) {
    utils.showToast("Please enter rejection reason", "error");
    return;
  }

  try {
    confirmRejectBtn.disabled = true;
    confirmRejectBtn.textContent = "Rejecting...";

    const { data } = await axios.patch(`/admin/returns/${returnId}/reject`, {
      rejectionReason,
    });

    if (data.success) {
      utils.showToast(data.message || "Return rejected successfully", "success");
      closeRejectDialog();
      setTimeout(() => window.location.reload(), 700);
    }
  } catch (error) {
    utils.showToast(
      error.response?.data?.message || "Failed to reject return",
      "error",
    );
  } finally {
    confirmRejectBtn.disabled = false;
    confirmRejectBtn.textContent = "Reject Return";
  }
});

updateStatusBtn?.addEventListener("click", async () => {
  const returnId = updateStatusBtn.dataset.returnId;
  const status = statusSelect?.value;

  if (!status) {
    utils.showToast("Please select a status", "error");
    return;
  }

  try {
    updateStatusBtn.disabled = true;
    updateStatusBtn.textContent = "Updating...";

    const { data } = await axios.patch(`/admin/returns/${returnId}/status`, {
      status,
    });

    if (data.success) {
      utils.showToast(data.message || "Return status updated successfully", "success");
      setTimeout(() => window.location.reload(), 700);
    }
  } catch (error) {
    utils.showToast(
      error.response?.data?.message || "Failed to update return status",
      "error",
    );
  } finally {
    updateStatusBtn.disabled = false;
    updateStatusBtn.textContent = "Update Status";
  }
});

refundBtn?.addEventListener("click", async () => {
  const returnId = refundBtn.dataset.returnId;

  try {
    refundBtn.disabled = true;
    refundBtn.textContent = "Processing...";

    const { data } = await axios.patch(`/admin/returns/${returnId}/refund`);

    if (data.success) {
      utils.showToast(data.message || "Refund processed successfully", "success");
      setTimeout(() => window.location.reload(), 700);
    }
  } catch (error) {
    utils.showToast(
      error.response?.data?.message || "Failed to process refund",
      "error",
    );
  } finally {
    refundBtn.disabled = false;
    refundBtn.textContent = "Process Refund";
  }
});