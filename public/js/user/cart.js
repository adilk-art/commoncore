const formatPrice = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

document.querySelectorAll(".qty-change").forEach((button) => {
  button.addEventListener("click", async () => {
    const itemId = button.dataset.id;
    const action = button.dataset.action;

    const quantityBox = button.closest(".cart-qty-box");
    const quantityValue = document.getElementById(`qty-value-${itemId}`);
    const lineTotal = document.getElementById(`line-total-${itemId}`);
    const errorBox = document.getElementById(`qty-error-${itemId}`);

    const increaseButton = quantityBox?.querySelector(
      '[data-action="increase"]',
    );
    const decreaseButton = quantityBox?.querySelector(
      '[data-action="decrease"]',
    );

    if (!quantityBox || !quantityValue) return;

    if (errorBox) {
      errorBox.textContent = "";
    }

    button.disabled = true;

    try {
      const { data } = await axios.patch("/user/cart/quantity", {
        itemId,
        action,
      });

      const updatedItem = data.item;
      const summary = data.summary;

      quantityValue.textContent = updatedItem.quantity;

      if (lineTotal) {
        lineTotal.textContent = `₹${formatPrice(updatedItem.lineTotal)}`;
      }

      if (decreaseButton) {
        decreaseButton.disabled = !updatedItem.canDecrease;
      }

      if (increaseButton) {
        increaseButton.disabled = !updatedItem.canIncrease;
      }

      const subtotalElement = document.getElementById("cartSubtotal");

      const discountElement = document.getElementById("cartDiscount");

      const discountRow = document.getElementById("discountRow");

      const shippingElement = document.getElementById("cartShipping");

      const totalElement = document.getElementById("cartTotal");

      if (subtotalElement) {
        subtotalElement.textContent = `₹${formatPrice(summary.subtotal)}`;
      }

      if (discountElement) {
        discountElement.textContent = `−₹${formatPrice(summary.totalDiscount)}`;
      }

      if (discountRow) {
        discountRow.hidden = Number(summary.totalDiscount) <= 0;
      }

      if (shippingElement) {
        shippingElement.textContent =
          summary.shipping === 0 ? "Free" : `₹${formatPrice(summary.shipping)}`;
      }

      if (totalElement) {
        totalElement.textContent = `₹${formatPrice(summary.total)}`;
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Unable to update quantity";

      if (errorBox) {
        errorBox.textContent = message;
      }

      userToast(message);
    } finally {
      const currentQuantity = Number(quantityValue.textContent) || 1;

      const stock = Number(quantityBox.dataset.stock) || 0;

      if (decreaseButton) {
        decreaseButton.disabled = currentQuantity <= 1;
      }

      if (increaseButton) {
        increaseButton.disabled =
          currentQuantity >= 5 || currentQuantity >= stock;
      }
    }
  });
});

document.querySelectorAll(".remove-item").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const itemId = btn.dataset.id;

    try {
      const { data } = await axios.delete(`/user/cart/item/${itemId}`);

      userToast(data.message || "Item removed");

      setTimeout(() => {
        location.reload();
      }, 300);
    } catch (error) {
      userToast(error.response?.data?.message || "Failed to remove item");
    }
  });
});

document.querySelectorAll(".move-wishlist").forEach((button) => {
  button.addEventListener("click", async () => {
    const itemId = button.dataset.id;

    try {
      const { data } = await axios.post("/user/cart/move-to-wishlist", {
        itemId,
      });

      userToast(data.message);

      button.closest(".cart-item")?.remove();
    } catch (error) {
      userToast(error.response?.data?.message || "Something went wrong");
    }
  });
});

const checkoutBtn = document.getElementById("checkoutBtn");

if (checkoutBtn) {
  checkoutBtn.addEventListener("click", async () => {
    try {
      await axios.get("/user/checkout");

      window.location.href = "/user/checkout";
    } catch (error) {
      userToast(
        error.response?.data?.message || "Unable to proceed to checkout",
      );

      setTimeout(() => {
        location.reload();
      }, 1200);
    }
  });
}
