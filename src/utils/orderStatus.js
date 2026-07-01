export const calculateOrderStatus = (items) => {

  const hasCancelled = items.some(item => item.status === "Cancelled");

  const activeStatuses = items
    .filter(item => item.status !== "Cancelled")
    .map(item => item.status);

  if (activeStatuses.length === 0) {
    return "Cancelled";
  }

  // All active items are at the same stage
  if (activeStatuses.every(s => s === "Placed")) {
    return "Placed";
  }

  if (activeStatuses.every(s => s === "Processing")) {
    return "Processing";
  }

  if (activeStatuses.every(s => s === "Shipped")) {
    return hasCancelled ? "Partially Cancelled" : "Shipped";
  }

  if (activeStatuses.every(s => s === "Delivered")) {
    return hasCancelled ? "Partially Cancelled" : "Delivered";
  }

  // Mixed active statuses
  if (hasCancelled) {
    return "Partially Cancelled";
  }

  if (activeStatuses.includes("Delivered")) {
    return "Partially Delivered";
  }

  if (activeStatuses.includes("Shipped")) {
    return "Partially Shipped";
  }

  return "Processing";
};