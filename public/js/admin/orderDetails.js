const btn = document.getElementById("markCodPaidBtn");

function updateStatusSelect(select, status) {
  [...select.options].forEach((option) => {
    option.disabled = false;
  });

  select.disabled = false;

  switch (status) {
    case "Processing":
      select.querySelector('option[value="Cancelled"]').disabled = false;
      break;

    case "Shipped":
      select.querySelector('option[value="Processing"]').disabled = true;
      select.querySelector('option[value="Cancelled"]').disabled = true;
      break;

    case "Delivered":
      select.disabled = true;
      break;

    case "Cancelled":
      select.disabled = true;
      break;
  }

  select.value = status;
}

btn?.addEventListener("click", async () => {
  const orderId = btn.dataset.orderId;

  try {
    btn.disabled = true;
    btn.textContent = "Updating...";

    const res = await axios.post(`/admin/orders/${orderId}/mark-paid`);

    if (res.data.success) {
      utils.showToast("COD payment marked as Paid", "success");

      document.querySelectorAll(".payment-status-text").forEach((el) => {
        el.textContent = "Paid";
      });

      const badge = document.querySelector(".payment-badge");

      if (badge) {
        badge.textContent = "Paid";
        badge.className = "payment-badge paid";
      }

      btn.disabled = true;
      btn.textContent = "Payment Received";
    }
  } catch (err) {
    btn.disabled = false;
    btn.textContent = "Mark COD Payment Received";

    utils.showToast(
      err?.response?.data?.message || "Something went wrong",
      "error",
    );
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll(".status-form");

  forms.forEach((form) => {
    const updateBtn = form.querySelector(".update-status-btn");

    const select = form.querySelector(".status-select");

    updateBtn?.addEventListener("click", async () => {
      const itemCard = form.closest(".item-card");

      const orderId = window.ORDER_ID;

      const itemId = form.dataset.itemId;

      const status = select.value;

      try {
        updateBtn.disabled = true;
        updateBtn.textContent = "Updating...";

        const res = await axios.patch("/admin/orders/item-status", {
          orderId,
          itemId,
          status,
        });

        const data = res.data;

        utils.showToast(data.message || "Status updated", "success");

        const currentStatus = data.itemStatus || status;

        const badge = itemCard.querySelector(".item-status-badge");

        if (badge) {
          badge.textContent = currentStatus;

          badge.className = `status item-status-badge ${currentStatus.toLowerCase().replace(/\s+/g, "-")}`;
        }

        const dateElement = itemCard.querySelector(".item-status-date");

        const now = new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        let prefix = "Updated on";

        switch (currentStatus) {
          case "Shipped":
            prefix = "Shipped on";
            break;

          case "Delivered":
            prefix = "Delivered on";
            break;

          case "Cancelled":
            prefix = "Cancelled on";
            break;

          case "Return Requested":
            prefix = "Return requested on";
            break;

          case "Return Accepted":
            prefix = "Return accepted on";
            break;

          case "Return Rejected":
            prefix = "Return rejected on";
            break;

          case "Returned":
            prefix = "Returned on";
            break;

          case "Refunded":
            prefix = "Refunded on";
            break;
        }

        if (dateElement) {
          dateElement.textContent = `${prefix} ${now}`;
        } else {
          const statusBlock = itemCard.querySelector(".item-status-block");

          const small = document.createElement("small");

          small.className = "status-date item-status-date";

          small.textContent = `${prefix} ${now}`;

          statusBlock.appendChild(small);
        }

        updateStatusSelect(select, currentStatus);

        if (select.disabled) {
          updateBtn.disabled = true;
        }

        const overallBadge = document.querySelector(".overall-order-status");

        if (overallBadge && data.orderStatus) {
          overallBadge.textContent = data.orderStatus;

          overallBadge.className = `status overall-order-status ${data.orderStatus.toLowerCase().replace(/\s+/g, "-")}`;
        }

        const codBtn = document.getElementById("markCodPaidBtn");

        if (codBtn) {
          if (data.paymentStatus === "Paid") {
            codBtn.disabled = true;
            codBtn.textContent = "Payment Received";
          } else {
            codBtn.disabled = !data.showCodButton;

            codBtn.textContent = "Mark COD Payment Received";
          }
        }
      } catch (err) {
        utils.showToast(
          err?.response?.data?.message || "Update failed",
          "error",
        );
      } finally {
        if (!select.disabled) {
          updateBtn.disabled = false;
        }

        updateBtn.textContent = "Update";
      }
    });
  });
});
