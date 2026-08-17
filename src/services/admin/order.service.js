import {
  findOrders,
  countOrders,
  getOrderStats,
  findOrderDetailById,
  updateOrderPaymentStatus,
  updateItemStatus,
} from "../../repositories/admin/order.repository.js";

import { calculateOrderStatus } from "../../utils/orderStatus.js";
import { calculateItemGstAmount } from "../../utils/calculateGst.js";
import { canMarkCodPaid } from "../../utils/orderStatus.js";
import { rewardReferralService } from "../user/referral.service.js";

export const getOrdersPageService = async ({
  page,
  limit,
  skip,
  search,
  status,
  payment,
  sort,
}) => {
  await expirePendingRazorpayOrdersService();

  const filter = {
    orderStatus: {
      $nin: [
        "Payment Pending",
        "Payment Expired",
      ],
    },
  };

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

  let sortOrder = {
    createdAt: -1,
  };

  if (sort === "oldest") {
    sortOrder = {
      createdAt: 1,
    };
  }

  const [orders, stats] =
    await Promise.all([
      findOrders(
        limit,
        skip,
        filter,
        sortOrder,
      ),

      getOrderStats(),
    ]);

  const preparedOrders =
    orders.map((order) => {
      const statusCounts = {};

      order.items.forEach(
        (item) => {
          statusCounts[item.status] =
            (
              statusCounts[
                item.status
              ] || 0
            ) +
            item.quantity;
        },
      );

      const entries =
        Object.entries(
          statusCounts,
        );

      const itemsStatusMixed =
        entries.length > 1;

      const itemsSingleStatus =
        entries.length === 1
          ? entries[0][0]
          : null;

      const itemsStatusSummaryLines =
        entries.map(
          ([status, qty]) =>
            `${qty} ${status}`,
        );

      return {
        ...order,

        itemsStatusMixed,

        itemsSingleStatus,

        itemsStatusSummaryLines,
      };
    });

  const orderCount =
    await countOrders(
      filter,
    );

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        orderCount /
          limit,
      ),
    );

  return {
    orders:
      preparedOrders,

    orderCount,

    totalPages,

    totalOrders:
      stats.totalOrders,

    processingOrders:
      stats.processingOrders,

    shippedOrders:
      stats.shippedOrders,

    deliveredOrders:
      stats.deliveredOrders,
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

  const computedOrderStatus =
  order.orderStatus === "Payment Pending" ||
  order.orderStatus === "Payment Expired"
    ? order.orderStatus
    : calculateOrderStatus(order.items);

  const activeItems = order.items.filter((item) => item.status !== "Cancelled");

  const cancelledItems = order.items.filter(
    (item) => item.status === "Cancelled",
  );

  const calculateItemAmounts = (item) => {
    const quantity = Number(item.quantity) || 0;

    const originalUnitPrice =
      Number(item.originalUnitPrice) || Number(item.unitPrice) || 0;

    const unitPrice = Number(item.unitPrice) || 0;

    const originalAmount = originalUnitPrice * quantity;

    const offerAmount = unitPrice * quantity;

    const offerDiscount = Math.max(originalAmount - offerAmount, 0);

    const couponDiscount = Number(item.couponDiscountAmount) || 0;

    const finalAmount = Math.max(offerAmount - couponDiscount, 0);

    const gstRate = Number(item.gstRate) || 0;

    let gstAmount = 0;

    if (finalAmount > 0 && gstRate > 0) {
      const taxableValue = finalAmount / (1 + gstRate / 100);

      gstAmount = finalAmount - taxableValue;
    }

    return {
      originalAmount,
      offerAmount,
      offerDiscount,
      couponDiscount,
      finalAmount,
      gstAmount,
    };
  };

  const calculateTotals = (items) => {
    return items.reduce(
      (totals, item) => {
        const amounts = calculateItemAmounts(item);

        totals.originalSubtotal += amounts.originalAmount;

        totals.offerDiscountTotal += amounts.offerDiscount;

        totals.subtotal += amounts.offerAmount;

        totals.couponDiscountTotal += amounts.couponDiscount;

        totals.finalSubtotal += amounts.finalAmount;

        totals.gstAmount += amounts.gstAmount;

        return totals;
      },
      {
        originalSubtotal: 0,
        offerDiscountTotal: 0,
        subtotal: 0,
        couponDiscountTotal: 0,
        finalSubtotal: 0,
        gstAmount: 0,
      },
    );
  };

  const orderTotals = calculateTotals(order.items);

  const activeTotals = calculateTotals(activeItems);

  const cancelledTotals = calculateTotals(cancelledItems);

  const fullyCancelled =
    order.items.length > 0 &&
    order.items.every((item) => item.status === "Cancelled");

  const partiallyCancelled = cancelledItems.length > 0 && !fullyCancelled;

  const shippingFee =
    activeItems.length > 0 ? Number(order.shippingFee || 0) : 0;

  const total = activeTotals.finalSubtotal + shippingFee;

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

    originalSubtotal: Number(orderTotals.originalSubtotal.toFixed(2)),

    offerDiscountTotal: Number(orderTotals.offerDiscountTotal.toFixed(2)),

    subtotal: Number(orderTotals.subtotal.toFixed(2)),

    couponDiscountTotal: Number(orderTotals.couponDiscountTotal.toFixed(2)),

    discountedSubtotal: Number(orderTotals.finalSubtotal.toFixed(2)),

    activeOriginalSubtotal: Number(activeTotals.originalSubtotal.toFixed(2)),

    activeOfferDiscountTotal: Number(
      activeTotals.offerDiscountTotal.toFixed(2),
    ),

    activeSubtotal: Number(activeTotals.subtotal.toFixed(2)),

    activeCouponDiscountTotal: Number(
      activeTotals.couponDiscountTotal.toFixed(2),
    ),

    activeDiscountedSubtotal: Number(activeTotals.finalSubtotal.toFixed(2)),

    cancelledOriginalAmount: Number(
      cancelledTotals.originalSubtotal.toFixed(2),
    ),

    cancelledAmount: Number(cancelledTotals.finalSubtotal.toFixed(2)),

    gstAmount: Number(activeTotals.gstAmount.toFixed(2)),

    shippingFee: Number(shippingFee.toFixed(2)),

    total: Number(total.toFixed(2)),

    fullyCancelled,
    partiallyCancelled,
    showCodButton,
  };
};

export const markCodAsPaidService = async (orderId) => {
  await updateOrderPaymentStatus(orderId, "Paid");

  const orderArr = await findOrderDetailById(orderId);

  if (!orderArr || orderArr.length === 0) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  const order = orderArr[0];

  const orderStatus = calculateOrderStatus(order.items);

  await rewardReferralService({
    userId: order.userId,
    orderId: order.orderNumber,
    orderStatus,
    paymentStatus: "Paid",
  });

  return order;
};

export const updateItemStatusService = async ({ orderId, itemId, status }) => {
  const orderArr = await findOrderDetailById(orderId);

  if (!orderArr || orderArr.length === 0) {
    const error = new Error("Order not found");

    error.status = 404;

    throw error;
  }

  const order = orderArr[0];

  const item = order.items.find((item) => String(item._id) === String(itemId));

  if (!item) {
    const error = new Error("Order item not found");

    error.status = 404;

    throw error;
  }

  const lockedStatuses = [
    "Delivered",
    "Cancelled",
    "Return Requested",
    "Return Accepted",
    "Returned",
    "Refunded",
  ];

  if (lockedStatuses.includes(item.status)) {
    const error = new Error("This item status cannot be changed");

    error.status = 400;

    throw error;
  }

  const STATUS_RANK = {
    Placed: 1,
    Processing: 2,
    Shipped: 3,
    Delivered: 4,
  };

  const currentRank = STATUS_RANK[item.status];

  const nextRank = STATUS_RANK[status];

  if (!currentRank || !nextRank) {
    const error = new Error("Invalid status update");

    error.status = 400;

    throw error;
  }

  if (nextRank <= currentRank) {
    const error = new Error(
      `Cannot change status from ${item.status} to ${status}`,
    );

    error.status = 400;

    throw error;
  }

  await updateItemStatus({
    orderId,
    itemId,
    status,
  });

  const updatedOrderArr = await findOrderDetailById(orderId);
  const updatedOrder = updatedOrderArr[0];
  const updatedItem = updatedOrder.items.find(
    (item) => String(item._id) === String(itemId),
  );

  const orderStatus = calculateOrderStatus(updatedOrder.items);
  await rewardReferralService({
    userId: updatedOrder.userId,
    orderId: updatedOrder._id,
    orderStatus,
    paymentStatus: updatedOrder.paymentStatus,
  });

  const showCodButton =
    updatedOrder.paymentMethod === "CashOnDelivery" &&
    updatedOrder.paymentStatus === "Pending" &&
    canMarkCodPaid(updatedOrder.items);

  return {
    itemStatus: updatedItem?.status || status,

    orderStatus,

    paymentStatus: updatedOrder.paymentStatus,

    showCodButton,
  };
};
