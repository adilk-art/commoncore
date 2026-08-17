export const calculateOrderStatus = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "Placed";
  }

  const statuses = items.map((item) => item.status);

  if (statuses.every((status) => status === "Cancelled")) {
    return "Cancelled";
  }

  const activeStatuses = statuses.filter(
    (status) => status !== "Cancelled",
  );

  if (activeStatuses.length === 0) {
    return "Cancelled";
  }

  if (activeStatuses.every((status) => status === "Refunded")) {
    return "Refunded";
  }

  if (
    activeStatuses.every((status) =>
      ["Returned", "Refunded"].includes(status),
    )
  ) {
    return "Returned";
  }

  if (
    activeStatuses.every((status) =>
      ["Return Accepted", "Returned", "Refunded"].includes(status),
    )
  ) {
    return "Return Accepted";
  }

  if (
    activeStatuses.every((status) =>
      [
        "Return Requested",
        "Return Accepted",
        "Returned",
        "Refunded",
      ].includes(status),
    )
  ) {
    return "Return Requested";
  }

  if (
    activeStatuses.some((status) =>
      [
        "Delivered",
        "Return Requested",
        "Return Accepted",
        "Returned",
        "Refunded",
      ].includes(status),
    )
  ) {
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

export const canMarkCodPaid = (items = []) => {
  const deliveredOrLater = new Set([
    "Delivered",
    "Return Requested",
    "Return Accepted",
    "Returned",
    "Refunded",
  ]);

  const activeItems = items.filter(
    (item) => item.status !== "Cancelled",
  );

  return (
    activeItems.length > 0 &&
    activeItems.every((item) => deliveredOrLater.has(item.status))
  );
};

