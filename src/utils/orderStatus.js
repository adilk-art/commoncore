export const calculateOrderStatus = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "Placed";
  }

  const statuses = items.map((item) => item.status);

  if (statuses.every((status) => status === "Cancelled")) {
    return "Cancelled";
  }

  const activeStatuses = statuses.filter((status) => status !== "Cancelled");

  if (activeStatuses.length === 0) {
    return "Cancelled";
  }

  if (activeStatuses.some((status) => status === "Refunded")) {
    return "Refunded";
  }

  if (activeStatuses.some((status) => status === "Returned")) {
    return "Returned";
  }

  if (activeStatuses.some((status) => status === "Return Accepted")) {
    return "Return Accepted";
  }

  if (activeStatuses.some((status) => status === "Return Requested")) {
    return "Return Requested";
  }

  if (activeStatuses.some((status) => status === "Delivered")) {
    return "Delivered";
  }

  if (activeStatuses.some((status) => status === "Shipped")) {
    return "Shipped";
  }

  if (activeStatuses.some((status) => status === "Processing")) {
    return "Processing";
  }

  return "Placed";
};

export const canMarkCodPaid = (
  items = [],
) => {
  const deliveredOrLater =
    new Set([
      "Delivered",
      "Return Requested",
      "Return Accepted",
      "Returned",
      "Refunded",
    ]);

  const activeItems =
    items.filter(
      (item) =>
        item.status !== "Cancelled",
    );

  return (
    activeItems.length > 0 &&
    activeItems.every(
      (item) =>
        deliveredOrLater.has(
          item.status,
        ),
    )
  );
};
