const btn = document.getElementById("markCodPaidBtn");

btn?.addEventListener("click", async () => {

  const orderId = btn.dataset.orderId;

try {

  btn.disabled = true;
  btn.textContent = "Updating...";

  const res = await axios.post(
    `/admin/orders/${orderId}/mark-paid`
  );

  if (res.data.success) {

    utils.showToast(
      "COD payment marked as Paid",
      "success"
    );

    document
      .querySelectorAll(".payment-status-text")
      .forEach(el => {
        el.textContent = "Paid";
      });

    const badge =
      document.querySelector(".payment-badge");

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
    err?.response?.data?.message ||
    "Something went wrong",
    "error"
  );

}
});

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const forms =
      document.querySelectorAll(".status-form");

    forms.forEach(form => {

      const updateBtn =
        form.querySelector(".update-status-btn");

      const select =
        form.querySelector(".status-select");

      updateBtn?.addEventListener(
        "click",
        async () => {

          const itemCard =
            form.closest(".item-card");

          const orderId =
            window.ORDER_ID;

          const itemId =
            form.dataset.itemId;

          const status =
            select.value;

          try {

            updateBtn.disabled = true;
            updateBtn.textContent =
              "Updating...";

            const res =
              await axios.patch(
                "/admin/orders/item-status",
                {
                  orderId,
                  itemId,
                  status,
                }
              );

            const data = res.data;

            utils.showToast(
              data.message ||
              "Status updated",
              "success"
            );

            const badge =
              itemCard.querySelector(
                ".item-status-badge"
              );

            badge.textContent = status;

            badge.className =
              `status item-status-badge ${status.toLowerCase().replaceAll(" ","-")}`;

            const dateElement =
              itemCard.querySelector(
                ".item-status-date"
              );

            const now =
              new Date().toLocaleString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );

            let prefix = "Updated on";

            if (status === "Shipped") {
              prefix = "Shipped on";
            }

            if (status === "Delivered") {
              prefix = "Delivered on";
            }

            if (status === "Cancelled") {
              prefix = "Cancelled on";
            }

            if (dateElement) {

              dateElement.textContent =
                `${prefix} ${now}`;

            } else {

              const statusBlock =
                itemCard.querySelector(
                  ".item-status-block"
                );

              const small =
                document.createElement("small");

              small.className =
                "status-date item-status-date";

              small.textContent =
                `${prefix} ${now}`;

              statusBlock.appendChild(small);

            }

            if (
              status === "Delivered" ||
              status === "Cancelled"
            ) {

              select.disabled = true;
              updateBtn.disabled = true;

            }

            const overallBadge =
              document.querySelector(
                ".overall-order-status"
              );

            if (
              data.orderStatus &&
              overallBadge
            ) {

              overallBadge.textContent =
                data.orderStatus;

              overallBadge.className =
                `status overall-order-status ${data.orderStatus.toLowerCase().replaceAll(" ","-")}`;

            }
            const codBtn = document.getElementById("markCodPaidBtn");

            if (codBtn) {
              codBtn.disabled = !data.showCodButton;
            }

          } catch (err) {

            utils.showToast(
              err?.response?.data?.message ||
              "Update failed",
              "error"
            );

          } finally {

            if (
              !select.disabled
            ) {
              updateBtn.disabled = false;
            }

            updateBtn.textContent =
              "Update";

          }

        }
      );

    });

  }
);