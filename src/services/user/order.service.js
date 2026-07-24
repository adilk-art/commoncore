import Order from "../../models/order.model.js";
import Return from "../../models/return.model.js";
import { getCartService } from "./cart.service.js";
import { getUserAddressById } from "../../repositories/address.repository.js";
import {
  createOrderRepo,
  findUserOrderById,
  findOrderById,
  saveOrder,
  findOrdersByUser,
} from "../../repositories/order.repository.js";
import {
  reduceVariantStock,
  increaseVariantStock,
} from "../../repositories/admin/variant.repository.js";
import { clearCart } from "../../repositories/cart.repository.js";
import { generateInvoicePdf } from "../../utils/invoicePdf.js";
import { validateBuyNowService } from "./checkout.service.js";
import { calculateOrderStatus } from "../../utils/orderStatus.js";
import {
  getOrderItemsStatusSummary,
  REFUNDED_STATUSES,
} from "../../utils/orderItemStatus.js";
import razorpay from "../../config/razorpay.js";
import crypto from "crypto";
import { log } from "console";
import { verifyRazorpaySignature } from "../../utils/razorpayVerification.js";
import { debitWalletService, creditWalletService } from "./wallet.service.js";
import { findWalletByUserId } from "../../repositories/wallet.repository.js";
import {  buildActiveOfferLookup, getBestOfferPricing } from "../shared/pricing.service.js";

export const getUserOrdersService = async ({ userId, search, page }) => {
  const limit = 5;

  const { orders, totalOrders } = await findOrdersByUser({
    userId,
    search,
    page,
    limit,
  });

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
      ...order.toObject(),
      itemsStatusMixed,
      itemsSingleStatus,
      itemsStatusSummaryLines,
    };
  });

  const totalPages = Math.ceil(totalOrders / limit);

  return {
    orders: preparedOrders,
    totalPages,
    currentPage: page,
    search,
  };
};

const generateOrderNumber = () => {
  return "ORD-" + Date.now();
};

const buildOrderPricing = async ({
  userId,
  isBuyNow,
  variantId,
  quantity,
}) => {
  let items = [];

  if (isBuyNow) {
    const { variant, qty } =
      await validateBuyNowService(
        variantId,
        quantity,
      );

    const product = variant.productId;

    if (!product) {
      const error = new Error("Product not found");
      error.status = 404;
      throw error;
    }

    const offerLookup =
      await buildActiveOfferLookup();

    const pricing = getBestOfferPricing(
      product,
      variant,
      offerLookup,
    );

    items = [
      {
        productId: product._id,
        variantId: variant._id,
        productName: product.name,
        productImage:
          variant.images?.[0]?.url || "",
        size: variant.size,
        color: variant.color.name,
        quantity: Number(qty),

        unitPrice: Number(pricing.finalPrice),
        originalUnitPrice: Number(
          pricing.originalPrice,
        ),
        discountAmount: Number(
          pricing.discountAmount || 0,
        ),

        hasOffer: Boolean(pricing.hasOffer),
        offerId: pricing.offerId || undefined,
        offerTitle:
          pricing.offerTitle || undefined,
        offerType:
          pricing.offerType || undefined,
        discountType:
          pricing.discountType || undefined,
        discountValue:
          pricing.discountValue ?? undefined,

        gstRate:
          Number(product.gstRate) || 0,

        status: "Placed",
      },
    ];
  } else {
    const cart = await getCartService(userId);

    if (!cart || cart.items.length === 0) {
      const error = new Error("Cart is empty");
      error.status = 400;
      error.code = "EMPTY_CART";
      throw error;
    }

    if (cart.invalid) {
      const error = new Error(
        "Some items in your cart are unavailable",
      );

      error.status = 400;
      error.code = "INVALID_CART";
      throw error;
    }

    items = cart.items.map((item) => ({
      productId: item.product._id,
      variantId: item.variant._id,
      productName: item.product.name,
      productImage:
        item.variant.images?.[0]?.url || "",
      size: item.variant.size,
      color: item.variant.color.name,
      quantity: Number(item.quantity),

      unitPrice: Number(item.finalPrice),
      originalUnitPrice: Number(
        item.originalPrice,
      ),
      discountAmount: Number(
        item.discountAmount || 0,
      ),

      hasOffer: Boolean(item.hasOffer),
      offerId: item.offerId || undefined,
      offerTitle:
        item.offerTitle || undefined,
      offerType:
        item.offerType || undefined,
      discountType:
        item.discountType || undefined,
      discountValue:
        item.discountValue ?? undefined,

      gstRate:
        Number(item.product.gstRate) || 0,

      status: "Placed",
    }));
  }

  const originalSubtotal = items.reduce(
    (sum, item) =>
      sum +
      Number(item.originalUnitPrice) *
        Number(item.quantity),
    0,
  );

  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      Number(item.unitPrice) *
        Number(item.quantity),
    0,
  );

  const discountTotal = items.reduce(
    (sum, item) =>
      sum +
      Number(item.discountAmount) *
        Number(item.quantity),
    0,
  );

  const shippingFee =
    subtotal >= 999
      ? 0
      : subtotal > 0
        ? 99
        : 0;

  const total = subtotal + shippingFee;

  return {
    items,
    originalSubtotal,
    discountTotal,
    subtotal,
    shippingFee,
    total,
  };
};

export const placeOrderService = async (
  userId,
  payload,
) => {
  const {
    shippingAddress,
    paymentMethod,
    isBuyNow,
    variantId,
    quantity,
  } = payload;

  if (!shippingAddress) {
    const error = new Error(
      "Please select address",
    );

    error.status = 400;
    throw error;
  }

  if (!paymentMethod) {
    const error = new Error(
      "Please select payment method",
    );

    error.status = 400;
    throw error;
  }

  const address = await getUserAddressById(
    shippingAddress,
    userId,
  );

  if (!address) {
    const error = new Error(
      "Address not found",
    );

    error.status = 404;
    throw error;
  }

  const {
    items,
    originalSubtotal,
    discountTotal,
    subtotal,
    shippingFee,
    total,
  } = await buildOrderPricing({
    userId,
    isBuyNow,
    variantId,
    quantity,
  });

  if (paymentMethod === "Wallet") {
    const wallet =
      await findWalletByUserId(userId);

    if (!wallet) {
      const error = new Error(
        "Wallet not found",
      );

      error.status = 400;
      throw error;
    }

    if (
      Number(wallet.balance) <
      Number(total)
    ) {
      const error = new Error(
        "Insufficient wallet balance",
      );

      error.status = 400;
      error.code =
        "INSUFFICIENT_WALLET_BALANCE";

      throw error;
    }
  }

  const estimatedDeliveryDate =
    new Date();

  estimatedDeliveryDate.setDate(
    estimatedDeliveryDate.getDate() + 5,
  );

  const order = await createOrderRepo({
    orderNumber: generateOrderNumber(),
    userId,
    items,
    paymentMethod,
    estimatedDeliveryDate,

    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    },

    originalSubtotal,
    discountTotal,
    subtotal,
    shippingFee,
    total,

    paymentStatus:
      paymentMethod === "Wallet"
        ? "Paid"
        : "Pending",

    orderStatus: "Placed",
  });

  for (const item of items) {
    await reduceVariantStock(
      item.variantId,
      item.quantity,
    );
  }

  if (paymentMethod === "Wallet") {
    await debitWalletService(userId, {
      amount: total,
      category: "OrderPayment",
      description:
        `Payment for Order ${order.orderNumber}`,
      reference: order.orderNumber,
    });
  }

  if (!isBuyNow) {
    await clearCart(userId);
  }

  return order;
};

export const getOrderSuccessService = async (
  orderId,
  userId,
) => {
  const order = await findUserOrderById(
    orderId,
    userId,
  );

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  const gstAmount = order.items.reduce(
    (total, item) => {
      const itemSubtotal =
        Number(item.unitPrice) *
        Number(item.quantity);

      const gstRate =
        Number(item.gstRate) || 0;

      const taxableValue =
        itemSubtotal /
        (1 + gstRate / 100);

      return total + (
        itemSubtotal - taxableValue
      );
    },
    0,
  );

  const originalSubtotal =
    Number(
      order.originalSubtotal ??
      order.subtotal,
    );

  const discountTotal =
    Number(order.discountTotal || 0);

  return {
    order,
    originalSubtotal,
    discountTotal,
    gstAmount: Number(gstAmount.toFixed(2)),
  };
};

export const getOrderDetailService = async (
  orderId,
  userId,
) => {
  const order = await findUserOrderById(
    orderId,
    userId,
  );

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  const returnRequests = await Return.find({
    orderId: order._id,
    userId,
  }).lean();

  const returnMap = new Map(
    returnRequests.map((ret) => [
      String(ret.itemId),
      ret,
    ]),
  );

  order.orderStatus = calculateOrderStatus(
    order.items,
  );

  const RETURN_WINDOW_DAYS = 14;

  order.items.forEach((item) => {
    item.canCancel =
      item.status === "Placed" ||
      item.status === "Processing";

    item.canReturn = false;
    item.returnDaysLeft = 0;
    item.showReturnStatusBtn = false;
    item.statusMetaText = "";

    const itemReturn = returnMap.get(
      String(item._id),
    );

    const deliveredAt = item.statusUpdatedAt
      ? new Date(item.statusUpdatedAt)
      : null;

    let diffDays = null;

    if (
      item.status === "Delivered" &&
      deliveredAt
    ) {
      diffDays = Math.floor(
        (Date.now() - deliveredAt.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      item.returnDaysLeft = Math.max(
        0,
        RETURN_WINDOW_DAYS - diffDays,
      );
    }

    if (itemReturn) {
      if (itemReturn.status === "Cancelled") {
        if (
          item.status === "Delivered" &&
          diffDays !== null &&
          diffDays < RETURN_WINDOW_DAYS
        ) {
          item.canReturn = true;
        }

        return;
      }

      item.showReturnStatusBtn = true;

      const statusDateOptions = {
        day: "numeric",
        month: "long",
        year: "numeric",
      };

      if (itemReturn.status === "Requested") {
        item.statusMetaText =
          `Return requested on ${new Date(
            itemReturn.requestedAt,
          ).toLocaleDateString(
            "en-IN",
            statusDateOptions,
          )}`;
      } else if (
        itemReturn.status === "Approved"
      ) {
        item.statusMetaText =
          `Return approved on ${new Date(
            itemReturn.approvedAt ||
              itemReturn.updatedAt,
          ).toLocaleDateString(
            "en-IN",
            statusDateOptions,
          )}`;
      } else if (
        itemReturn.status === "Picked Up"
      ) {
        item.statusMetaText =
          `Item picked up on ${new Date(
            itemReturn.pickedUpAt ||
              itemReturn.updatedAt,
          ).toLocaleDateString(
            "en-IN",
            statusDateOptions,
          )}`;
      } else if (
        itemReturn.status === "Received"
      ) {
        item.statusMetaText =
          `Returned item received on ${new Date(
            itemReturn.receivedAt ||
              itemReturn.updatedAt,
          ).toLocaleDateString(
            "en-IN",
            statusDateOptions,
          )}`;
      } else if (
        itemReturn.status === "Refunded"
      ) {
        item.statusMetaText =
          `Refund processed on ${new Date(
            itemReturn.refundedAt ||
              itemReturn.updatedAt,
          ).toLocaleDateString(
            "en-IN",
            statusDateOptions,
          )}`;
      } else if (
        itemReturn.status === "Rejected"
      ) {
        item.statusMetaText =
          `Return rejected on ${new Date(
            itemReturn.updatedAt,
          ).toLocaleDateString(
            "en-IN",
            statusDateOptions,
          )}`;
      }

      return;
    }

    if (
      item.status === "Delivered" &&
      diffDays !== null &&
      diffDays < RETURN_WINDOW_DAYS
    ) {
      item.canReturn = true;
    }
  });

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

  const cancelledAmount =
    cancelledItems.reduce(
      (sum, item) =>
        sum +
        Number(item.unitPrice) *
          Number(item.quantity),
      0,
    );

  const activeOriginalSubtotal =
    activeItems.reduce(
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

  const gstAmount = activeItems.reduce(
    (total, item) => {
      const itemSubtotal =
        Number(item.unitPrice) *
        Number(item.quantity);

      const gstRate =
        Number(item.gstRate) || 0;

      const taxableValue =
        itemSubtotal /
        (1 + gstRate / 100);

      return (
        total +
        (itemSubtotal - taxableValue)
      );
    },
    0,
  );

  const shippingFee =
    activeSubtotal >= 999
      ? 0
      : activeSubtotal > 0
        ? Number(order.shippingFee)
        : 0;

  const currentValue =
    activeSubtotal + shippingFee;

  const fullyCancelled =
    order.items.length > 0 &&
    order.items.every(
      (item) =>
        item.status === "Cancelled",
    );

  const partiallyCancelled =
    cancelledAmount > 0 &&
    !fullyCancelled;

  const canCancelAnyItem =
    order.items.some(
      (item) =>
        item.status === "Placed" ||
        item.status === "Processing",
    );

  return {
    order,
    originalSubtotal,
    discountTotal,
    cancelledAmount,
    activeSubtotal,
    activeOriginalSubtotal,
    activeDiscountTotal,
    currentValue,
    gstAmount: Number(
      gstAmount.toFixed(2),
    ),
    fullyCancelled,
    partiallyCancelled,
    canCancelAnyItem,
  };
};

export const cancelOrderService = async ({ userId, orderId }) => {
  const order = await findOrderById(orderId);

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  if (order.userId.toString() !== userId.toString()) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  if (order.orderStatus !== "Placed" && order.orderStatus !== "Processing") {
    const error = new Error("Order cannot be cancelled");
    error.status = 400;
    throw error;
  }

  let refundAmount = 0;

  for (const item of order.items) {
    if (item.status === "Placed" || item.status === "Processing") {
      item.status = "Cancelled";

      await increaseVariantStock(item.variantId, item.quantity);

      refundAmount += item.unitPrice * item.quantity;
    }
  }

  if (
    order.paymentStatus === "Paid" &&
    (order.paymentMethod === "Razorpay" || order.paymentMethod === "Wallet")
  ) {
    await creditWalletService(userId, {
      amount: refundAmount,

      category: "OrderRefund",

      description: `Refund for cancelled order ${order.orderNumber}`,

      reference: order.orderNumber,
    });
  }

  order.orderStatus = "Cancelled";

  await saveOrder(order);

  return {
    orderStatus: order.orderStatus,
  };
};

export const cancelOrderItemService = async ({ userId, orderId, itemId }) => {
  const order = await findOrderById(orderId);

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  if (order.userId.toString() !== userId.toString()) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  const item = order.items.id(itemId);

  if (!item) {
    const error = new Error("Item not found");
    error.status = 404;
    throw error;
  }

  if (item.status !== "Placed" && item.status !== "Processing") {
    const error = new Error("Item cannot be cancelled");
    error.status = 400;
    throw error;
  }

  item.status = "Cancelled";

  await increaseVariantStock(item.variantId, item.quantity);

  if (
    order.paymentStatus === "Paid" &&
    (order.paymentMethod === "Razorpay" || order.paymentMethod === "Wallet")
  ) {
    const refundAmount = item.unitPrice * item.quantity;

    await creditWalletService(userId, {
      amount: refundAmount,

      category: "OrderRefund",

      description: `Refund for cancelled item from ${order.orderNumber}`,

      reference: order.orderNumber,
    });
  }

  order.orderStatus = calculateOrderStatus(order.items);

  await saveOrder(order);

  return {
    orderStatus: order.orderStatus,
  };
};

export const downloadInvoiceService = async ({
  userId,
  orderId,
  res,
}) => {
  const order = await findUserOrderById(
    orderId,
    userId,
  );

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  const cancelledItems = order.items.filter(
    (item) => item.status === "Cancelled",
  );

  const returnedItems = order.items.filter(
    (item) =>
      ["Returned", "Refunded"].includes(
        item.status,
      ),
  );

  const activeItems = order.items.filter(
    (item) =>
      !REFUNDED_STATUSES.has(item.status),
  );

  const cancelledAmount =
    cancelledItems.reduce(
      (sum, item) =>
        sum +
        Number(item.unitPrice) *
          Number(item.quantity),
      0,
    );

  const returnedAmount =
    returnedItems.reduce(
      (sum, item) =>
        sum +
        Number(item.unitPrice) *
          Number(item.quantity),
      0,
    );

  const activeOriginalSubtotal =
    activeItems.reduce(
      (sum, item) =>
        sum +
        Number(
          item.originalUnitPrice ??
            item.unitPrice,
        ) *
          Number(item.quantity),
      0,
    );

  const activeSubtotal =
    activeItems.reduce(
      (sum, item) =>
        sum +
        Number(item.unitPrice) *
          Number(item.quantity),
      0,
    );

  const activeDiscountTotal =
    activeOriginalSubtotal -
    activeSubtotal;

  const shippingFee =
    activeItems.length > 0
      ? Number(order.shippingFee || 0)
      : 0;

  const currentTotal =
    activeSubtotal + shippingFee;

  const gstAmount = activeItems.reduce(
    (total, item) => {
      const itemSubtotal =
        Number(item.unitPrice) *
        Number(item.quantity);

      const gstRate =
        Number(item.gstRate) || 0;

      const taxableValue =
        itemSubtotal /
        (1 + gstRate / 100);

      return (
        total +
        (itemSubtotal - taxableValue)
      );
    },
    0,
  );

  generateInvoicePdf({
    order,
    items: order.items,

    originalSubtotal: Number(
      order.originalSubtotal ??
        order.subtotal ??
        0,
    ),

    discountTotal: Number(
      order.discountTotal || 0,
    ),

    cancelledAmount,
    returnedAmount,

    activeOriginalSubtotal,
    activeDiscountTotal,
    activeSubtotal,

    shippingFee,
    currentTotal,

    gstAmount: Number(
      gstAmount.toFixed(2),
    ),

    res,
  });
};

export const createRazorpayOrderService = async (
  userId,
  payload,
) => {
  const {
    isBuyNow,
    variantId,
    quantity,
  } = payload;

  const { total } =
    await buildOrderPricing({
      userId,
      isBuyNow,
      variantId,
      quantity,
    });

  const razorpayOrder =
    await razorpay.orders.create({
      amount: Math.round(
        Number(total) * 100,
      ),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

  return {
    success: true,
    key: process.env.RAZORPAY_KEY,
    order: razorpayOrder,
  };
};

export const verifyPaymentService = async (
  userId,
  paymentData,
  pendingPayment,
) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    verifyRazorpaySignature(paymentData);
  const order = await placeOrderService(userId, pendingPayment);

  order.paymentStatus = "Paid";
  order.razorpayOrderId = razorpay_order_id;
  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpaySignature = razorpay_signature;

  await saveOrder(order);

  return {
    success: true,
    orderId: order._id,
  };
};

export const retryPaymentService = async (userId, pendingPayment) => {
  if (!pendingPayment) {
    const error = new Error("No pending payment found");
    error.status = 400;
    throw error;
  }

  const age = Date.now() - pendingPayment.createdAt;

  if (age > 15 * 60 * 1000) {
    const error = new Error("Payment session expired");
    error.status = 400;
    throw error;
  }

  return await createRazorpayOrderService(userId, pendingPayment);
};
