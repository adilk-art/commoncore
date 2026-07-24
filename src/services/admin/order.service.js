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
    (item) => item.status !== "Cancelled",
  );

  const cancelledItems = order.items.filter(
    (item) => item.status === "Cancelled",
  );

  const originalSubtotal = Number(
    order.originalSubtotal ??
      order.subtotal ??
      0,
  );

  const discountTotal = Number(
    order.discountTotal || 0,
  );

  const activeOriginalSubtotal = activeItems.reduce(
    (sum, item) =>
      sum +
      Number(
        item.originalUnitPrice ??
          item.unitPrice,
      ) *
        Number(item.quantity),
    0,
  );

  const activeSubtotal = activeItems.reduce(
    (sum, item) =>
      sum +
      Number(item.unitPrice) *
        Number(item.quantity),
    0,
  );

  const activeDiscountTotal =
    activeOriginalSubtotal -
    activeSubtotal;

  const cancelledAmount = cancelledItems.reduce(
    (sum, item) =>
      sum +
      Number(item.unitPrice) *
        Number(item.quantity),
    0,
  );

  const gstAmount = activeItems.reduce(
    (total, item) =>
      total + calculateItemGstAmount(item),
    0,
  );

  const shippingFee =
    activeItems.length > 0
      ? Number(order.shippingFee || 0)
      : 0;

  const total =
    activeSubtotal + shippingFee;

  const fullyCancelled =
    order.items.length > 0 &&
    order.items.every(
      (item) => item.status === "Cancelled",
    );

  const partiallyCancelled =
    cancelledAmount > 0 &&
    !fullyCancelled;

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

    originalSubtotal,
    discountTotal,

    activeOriginalSubtotal,
    activeDiscountTotal,
    activeSubtotal,
    cancelledAmount,

    gstAmount: Number(gstAmount.toFixed(2)),
    shippingFee,
    total,

    fullyCancelled,
    partiallyCancelled,
    showCodButton,
  };
};

export const markCodAsPaidService = async (orderId) => {
  return await updateOrderPaymentStatus(orderId, "Paid");
};

export const updateItemStatusService = async ({ orderId, itemId, status }) => {
  return await updateItemStatus({ orderId, itemId, status });
};