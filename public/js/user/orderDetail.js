const modal = document.getElementById("cancelItemModal");
const modalImage = document.getElementById("modalImage");
const modalName = document.getElementById("modalName");
const modalColor = document.getElementById("modalColor");
const modalSize = document.getElementById("modalSize");
const modalPrice = document.getElementById("modalPrice");
const cancelOrderBtn = document.querySelector(".cancel-order-btn");

let selectedOrderId = null;
let selectedItemId = null;
let isOrderCancellation = false;


if (cancelOrderBtn) {
  cancelOrderBtn.addEventListener("click", () => {
    isOrderCancellation = true;

    selectedOrderId = cancelOrderBtn.dataset.orderId;
    selectedItemId = null;
    modalImage.style.display = "none";
    modalName.textContent = "Entire Order";
    modalColor.textContent = "";
    modalSize.textContent = "";
    modalPrice.textContent = "";
    document.getElementById("cancelReason").value = "";
    document.getElementById("cancelComment").value = "";
    modal.classList.remove("hidden");
  });
}


document.querySelectorAll(".cancel-item-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    isOrderCancellation = false;
    selectedOrderId = btn.dataset.orderId;
    selectedItemId = btn.dataset.itemId;
    modalImage.style.display = "block";
    modalImage.src = btn.dataset.image;
    modalName.textContent = btn.dataset.name;
    modalColor.textContent = `Color: ${btn.dataset.color}`;
    modalSize.textContent = `Size: ${btn.dataset.size}`;
    modalPrice.textContent = `₹${btn.dataset.price}`;
    document.getElementById("cancelReason").value = "";
    document.getElementById("cancelComment").value = "";
    modal.classList.remove("hidden");
  });
});


document.getElementById("closeCancelModal").addEventListener("click", () => {
  modal.classList.add("hidden");

  modalImage.style.display = "block";
});

document.getElementById("keepItemBtn").addEventListener("click", () => {
  modal.classList.add("hidden");

  modalImage.style.display = "block";
});


document
  .getElementById("confirmCancelItem")
  .addEventListener("click", async () => {
    const reason = document.getElementById("cancelReason").value;

    const comment = document.getElementById("cancelComment").value;

    if (!reason) {
      userToast("Please select a reason");

      return;
    }

    try {
      let response;

      if (isOrderCancellation) {
        response = await axios.patch(`/user/order/${selectedOrderId}/cancel`, {
          reason,
          comment,
        });
      } else {
        response = await axios.patch(
          `/user/order/${selectedOrderId}/items/${selectedItemId}/cancel`,
          {
            reason,
            comment,
          },
        );
      }

      if (!response.data.success) {
        userToast(response.data.message);

        return;
      }

      userToast(isOrderCancellation ? "Order cancelled" : "Item cancelled");

      setTimeout(() => {
        location.reload();
      }, 700);
    } catch (error) {
      userToast(error.response?.data?.message || "Cancellation failed");
    }
  });
