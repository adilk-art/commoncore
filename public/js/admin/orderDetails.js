const codBtn = document.getElementById("markCodPaidBtn");
const codPaymentHint = document.getElementById("codPaymentHint");

function updateCodSection(paymentStatus, showCodButton) {
  if (!codBtn) return;

  if (paymentStatus === "Paid") {
    codBtn.classList.remove("hidden");
    codBtn.disabled = true;
    codBtn.textContent = "Payment Received";

    codPaymentHint?.classList.add("hidden");

    return;
  }

  if (showCodButton) {
    codBtn.classList.remove("hidden");
    codBtn.disabled = false;
    codBtn.textContent = "Mark COD Payment Received";

    codPaymentHint?.classList.add("hidden");

    return;
  }

  codBtn.classList.add("hidden");
  codBtn.disabled = true;
  codBtn.textContent = "Mark COD Payment Received";

  codPaymentHint?.classList.remove("hidden");
}

function updateStatusSelect(select, status) {
  if (!select) return;

  select.innerHTML = "";
  select.disabled = false;

  const addOption = (
    value,
    {
      selected = false,
      disabled = false,
    } = {},
  ) => {
    const option =
      document.createElement("option");

    option.value = value;
    option.textContent = value;
    option.selected = selected;
    option.disabled = disabled;

    select.appendChild(option);
  };

  switch (status) {
    case "Placed":
      addOption("Placed", {
        selected: true,
        disabled: true,
      });

      addOption("Processing");
      addOption("Shipped");
      addOption("Delivered");

      break;

    case "Processing":
      addOption("Processing", {
        selected: true,
        disabled: true,
      });

      addOption("Shipped");
      addOption("Delivered");

      break;

    case "Shipped":
      addOption("Shipped", {
        selected: true,
        disabled: true,
      });

      addOption("Delivered");

      break;

    case "Delivered":
    case "Cancelled":
    case "Return Requested":
    case "Return Accepted":
    case "Returned":
    case "Refunded":
      addOption(status, {
        selected: true,
        disabled: true,
      });

      select.disabled = true;

      break;

    default:
      addOption(status, {
        selected: true,
        disabled: true,
      });

      select.disabled = true;
  }
}

function updatePaymentUI(paymentStatus) {
  if (!paymentStatus) return;

  document
    .querySelectorAll(".payment-text")
    .forEach((element) => {
      element.textContent = paymentStatus;

      element.classList.remove(
        "pending",
        "paid",
        "failed",
        "refunded",
      );

      element.classList.add(
        paymentStatus.toLowerCase(),
      );
    });

  const badge = document.querySelector(".payment-badge");

  if (badge) {
    badge.textContent = paymentStatus;

    badge.className =
      `payment-badge ${paymentStatus.toLowerCase()}`;
  }
}

function updateOverallOrderStatus(status) {
  if (!status) return;

  const badge = document.querySelector(
    ".order-number-row .status",
  );

  if (!badge) return;

  badge.textContent = status;

  badge.className =
    `status ${status
      .toLowerCase()
      .replace(/\s+/g, "-")}`;
}

function updateItemUI(itemRow, status) {
  if (!itemRow) return;

  const badge = itemRow.querySelector(".item-status");

  if (badge) {
    badge.textContent = status;

    badge.className =
      `item-status item-status-${status
        .toLowerCase()
        .replace(/\s+/g, "-")}`;
  }

  const dateElement = itemRow.querySelector(
    ".item-status-date",
  );

  const now = new Date().toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );

  if (dateElement) {
    dateElement.textContent = now;
  }

  if (status === "Cancelled") {
    itemRow.classList.add("order-item--cancelled");
  }
}

codBtn?.addEventListener("click", async () => {
  const orderId = codBtn.dataset.orderId;

  try {
    codBtn.disabled = true;
    codBtn.textContent = "Updating...";

    const response = await axios.post(
      `/admin/orders/${orderId}/mark-paid`,
    );

    const data = response.data;

    if (!data.success) {
      throw new Error(
        data.message || "Payment update failed",
      );
    }

    updatePaymentUI(
      data.paymentStatus || "Paid",
    );

    updateCodSection(
      data.paymentStatus || "Paid",
      false,
    );

    utils.showToast(
      data.message ||
        "COD payment marked as Paid",
      "success",
    );
  } catch (error) {
    codBtn.disabled = false;
    codBtn.textContent =
      "Mark COD Payment Received";

    utils.showToast(
      error?.response?.data?.message ||
        error.message ||
        "Something went wrong",
      "error",
    );
  }
});

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const forms = document.querySelectorAll(
      ".status-form",
    );

    forms.forEach((form) => {
      const updateBtn = form.querySelector(
        ".update-status-btn",
      );

      const select = form.querySelector(
        ".status-select",
      );

      if (!updateBtn || !select) return;

      updateBtn.addEventListener(
        "click",
        async () => {
          const itemRow = form.closest(
            ".order-item",
          );

          const orderId = window.ORDER_ID;
          const itemId = form.dataset.itemId;
          const status = select.value;

          try {
            updateBtn.disabled = true;
            select.disabled = true;

            updateBtn.textContent = "Updating...";

            const response = await axios.patch(
              "/admin/orders/item-status",
              {
                orderId,
                itemId,
                status,
              },
            );

            const data = response.data;

            if (!data.success) {
              throw new Error(
                data.message ||
                  "Status update failed",
              );
            }

            const currentStatus =
              data.itemStatus || status;

            updateItemUI(
              itemRow,
              currentStatus,
            );

            updateStatusSelect(
              select,
              currentStatus,
            );

            updateOverallOrderStatus(
              data.orderStatus,
            );

            if (data.paymentStatus) {
              updatePaymentUI(
                data.paymentStatus,
              );
            }

            updateCodSection(
              data.paymentStatus,
              Boolean(data.showCodButton),
            );

            utils.showToast(
              data.message ||
                "Status updated successfully",
              "success",
            );
          } catch (error) {
            console.error(
              "Status update error:",
              error,
            );

            select.disabled = false;

            utils.showToast(
              error?.response?.data?.message ||
                error.message ||
                "Update failed",
              "error",
            );
          } finally {
            if (!select.disabled) {
              updateBtn.disabled = false;
            }

            updateBtn.textContent = "Update";
          }
        },
      );
    });
  },
);