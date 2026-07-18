export const calculateOrderStatus = (items) => {
  const statuses = items.map(item => item.status);

  const allPlaced = statuses.every(status => status === "Placed");
  if (allPlaced) {
    return "Placed";
  }

  const allProcessing = statuses.every(status => status === "Processing");
  if (allProcessing) {
    return "Processing";
  }

  const allShipped = statuses.every(status => status === "Shipped");
  if (allShipped) {
    return "Shipped";
  }

  const allDelivered = statuses.every(status => status === "Delivered");
  if (allDelivered) {
    return "Delivered";
  }

  const allCancelled = statuses.every(status => status === "Cancelled");
  if (allCancelled) {
    return "Cancelled";
  }

  // if (statuses.includes("Delivered")) {
  //   return "Partially Delivered";
  // }

  // if (statuses.includes("Shipped")) {
  //   return "Partially Shipped";
  // }

  // if (statuses.includes("Cancelled")) {
  //   return "Partially Cancelled";
  // }

  return "Processing";
};

export const canMarkCodPaid = (items = []) => {
  const DELIVERED_OR_LATER = new Set([
    "Delivered",
    "Return Requested",
    "Return Accepted",
    "Returned",
    "Refunded",
  ]);

  const activeItems = items.filter((item) => item.status !== "Cancelled");

  return (
    activeItems.length > 0 &&
    activeItems.every((item) => DELIVERED_OR_LATER.has(item.status))
  );
};