import {
  findOrders,
  countOrders,
  getOrderStats,
  findOrderDetailById,
  updateOrderPaymentStatus,
  updateItemStatus
} from "../../repositories/admin/order.repository.js";

import { calculateOrderStatus } from "../../utils/orderStatus.js";
import { calculateItemGstAmount } from "../../utils/calculateGst.js";
import { canMarkCodPaid } from "../../utils/orderStatus.js";


export const getOrdersPageService = async ({
  page,
 limit,
  skip,
  search,
  status,
  payment,
  sort,
}) => {
  const filter = {};

  if (status) {
    filter.orderStatus = status;
  }

  if (payment) {
    filter.paymentMethod = payment;
  }

  if (search) {
    filter.orderNumber = {
      $regex: search,
      $options: "i",
    };
  }

  let sortOrder = { createdAt: -1 };

  if (sort === "oldest") {
    sortOrder = { createdAt: 1 };
  }

  const [orders, stats] = await Promise.all([
    findOrders(limit, skip, filter, sortOrder),
    getOrderStats(),
  ]);

  const preparedOrders = orders.map((order) => {
    const statusCounts = {};

    order.items.forEach((item) => {
      statusCounts[item.status] =
        (statusCounts[item.status] || 0) + item.quantity;
    });

    const entries = Object.entries(statusCounts);

    const itemsStatusMixed = entries.length > 1;
    const itemsSingleStatus = entries.length === 1 ? entries[0][0] : null;

    const itemsStatusSummaryLines = entries.map(
      ([status, qty]) => `${qty} ${status}`,
    );

    return {
      ...order,
      itemsStatusMixed,
      itemsSingleStatus,
      itemsStatusSummaryLines,
    };
  });

  const orderCount = await countOrders(filter);
  const totalPages = Math.max(1, Math.ceil(orderCount / limit));

  return {
    orders: preparedOrders,
    orderCount,
    totalPages,
    totalOrders: stats.totalOrders,
    processingOrders: stats.processingOrders,
    shippedOrders: stats.shippedOrders,
    deliveredOrders: stats.deliveredOrders,
  };
};

export const getOrderDetailService = async (orderId) => {
  const orderArr = await findOrderDetailById(orderId);

  if (!orderArr || orderArr.length === 0) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  const order = orderArr[0];

  const computedOrderStatus = calculateOrderStatus(order.items);

  const activeItems = order.items.filter(
    (item) => item.status !== "Cancelled"
  );

  const cancelledItems = order.items.filter(
    (item) => item.status === "Cancelled"
  );

  const activeSubtotal = activeItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const cancelledAmount = cancelledItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const gstAmount = activeItems.reduce((total, item) => {           
    return total + calculateItemGstAmount(item);
  }, 0);

  const shippingFee =
    activeSubtotal >= 999
      ? 0
      : activeSubtotal > 0
      ? order.shippingFee
      : 0;

  const total = activeSubtotal + shippingFee;

  const fullyCancelled =
    order.items.length > 0 &&
    order.items.every((i) => i.status === "Cancelled");

  const partiallyCancelled =
    cancelledAmount > 0 && !fullyCancelled;

  const showCodButton =
  order.paymentMethod === "CashOnDelivery" &&
  order.paymentStatus === "Pending" &&
  canMarkCodPaid(order.items);

  return {
  order: {
    ...order,
    user: order.customer,
    orderStatus: computedOrderStatus,
  },

  activeItems,
  cancelledItems,

  activeSubtotal,
  cancelledAmount,

  gstAmount: Number(gstAmount.toFixed(2)),

  shippingFee,
  total,

  fullyCancelled,
  partiallyCancelled,
  showCodButton
};
};

export const markCodAsPaidService = async (orderId) => {
  return await updateOrderPaymentStatus(orderId, "Paid");
};

export const updateItemStatusService = async ({ orderId, itemId, status }) => {
  return await updateItemStatus({ orderId, itemId, status });
};