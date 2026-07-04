export const getOrderItemsStatusSummary = (items = []) => {
  if (!items.length) {
    return {
      isMixed: false,
      singleStatus: "Placed",
      summaryLines: [],
    };
  }

  const counts = {};

  for (const item of items) {
    const status = item.status || "Placed";
    counts[status] = (counts[status] || 0) + 1;
  }

  const statuses = Object.keys(counts);

  if (statuses.length === 1) {
    return {
      isMixed: false,
      singleStatus: statuses[0],
      summaryLines: [],
    };
  }

  const orderedStatuses = [
    "Placed",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
    "Returned",
  ];

  const summaryLines = orderedStatuses
    .filter((status) => counts[status])
    .map((status) => `${counts[status]} ${status}`);

  return {
    isMixed: true,
    singleStatus: null,
    summaryLines,
  };
};