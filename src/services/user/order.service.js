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
  updateRazorpayOrderIdRepo,
  markRazorpayOrderPaidRepo,
  deleteIncompletePendingOrderRepo,
} from "../../repositories/order.repository.js";
import {
  reduceVariantStock,
  increaseVariantStock,
  findActiveVariant,
} from "../../repositories/admin/variant.repository.js";
import { clearCart } from "../../repositories/cart.repository.js";
import { generateInvoicePdf } from "../../utils/invoicePdf.js";
import { validateBuyNowService } from "./checkout.service.js";
import { calculateOrderStatus } from "../../utils/orderStatus.js";
import { REFUNDED_STATUSES } from "../../utils/orderItemStatus.js";
import razorpay from "../../config/razorpay.js";
import { verifyRazorpaySignature } from "../../utils/razorpayVerification.js";
import { debitWalletService, creditWalletService } from "./wallet.service.js";
import { findWalletByUserId } from "../../repositories/wallet.repository.js";
import {
  buildActiveOfferLookup,
  getBestOfferPricing,
  getCheckoutAgainItemPricing,
} from "../shared/pricing.service.js";
import { validateCouponService } from "./coupon.service.js";
import {
  incrementCouponUsage,
  decrementCouponUsage,
} from "../../repositories/coupon.repository.js";
import { findReviewsByUserAndProducts } from "../../repositories/review.repository.js";

export const getUserOrdersService = async ({ userId, search, page }) => {
  const limit = 5;

  const { orders, totalOrders } = await findOrdersByUser({
    userId,
    search,
    page,
    limit,
  });

  const preparedOrders = orders.map((order) => {
    const orderObject =
      typeof order.toObject === "function" ? order.toObject() : order;

    const statusCounts = {};

    orderObject.items.forEach((item) => {
      const quantity = Number(item.quantity) || 0;

      statusCounts[item.status] = (statusCounts[item.status] || 0) + quantity;
    });

    const entries = Object.entries(statusCounts);

    const itemsStatusMixed = entries.length > 1;

    const itemsSingleStatus = entries.length === 1 ? entries[0][0] : null;

    const itemsStatusSummaryLines = entries.map(
      ([status, quantity]) => `${quantity} ${status}`,
    );

    const displayStatus =
      orderObject.paymentStatus === "Failed"
        ? "Payment Failed"
        : orderObject.orderStatus || itemsSingleStatus || "Placed";
    return {
      ...orderObject,
      displayStatus,
      itemsStatusMixed,
      itemsSingleStatus,
      itemsStatusSummaryLines,
      isPaymentPending: orderObject.paymentStatus === "Pending",
      paymentFailed: orderObject.paymentStatus === "Failed",
    };
  });

  return {
    orders: preparedOrders,
    totalPages: Math.ceil(totalOrders / limit),
    currentPage: page,
    search,
  };
};

const generateOrderNumber = () => {
  return "ORD-" + Date.now();
};

const roundMoney = (value) => {
  return Number(Number(value || 0).toFixed(2));
};

const allocateCouponDiscount = (items, subtotal, couponDiscount) => {
  let allocatedDiscount = 0;

  return items.map((item, index) => {
    const itemSubtotal = roundMoney(
      Number(item.unitPrice) * Number(item.quantity),
    );

    const isLastItem = index === items.length - 1;

    let couponDiscountAmount = 0;

    if (couponDiscount > 0 && subtotal > 0) {
      if (isLastItem) {
        couponDiscountAmount = roundMoney(couponDiscount - allocatedDiscount);
      } else {
        couponDiscountAmount = roundMoney(
          couponDiscount * (itemSubtotal / subtotal),
        );

        allocatedDiscount = roundMoney(
          allocatedDiscount + couponDiscountAmount,
        );
      }
    }

    couponDiscountAmount = Math.min(couponDiscountAmount, itemSubtotal);

    return {
      ...item,
      couponDiscountAmount,
    };
  });
};

const buildOrderPricing = async ({
  userId,
  isBuyNow,
  variantId,
  quantity,
  couponCode,
  checkoutAgain,
}) => {
  let items = [];

  if (checkoutAgain) {
    if (
      !Array.isArray(checkoutAgain.items) ||
      checkoutAgain.items.length === 0
    ) {
      const error = new Error("No items available for checkout");

      error.status = 400;
      error.code = "INVALID_CHECKOUT_AGAIN";

      throw error;
    }

    const offerLookup = await buildActiveOfferLookup();

    for (const checkoutItem of checkoutAgain.items) {
      const variant = await findActiveVariant(checkoutItem.variantId);

      if (!variant) {
        const error = new Error("One or more products are no longer available");

        error.status = 400;
        error.code = "INVALID_CHECKOUT_AGAIN";

        throw error;
      }

      const product = variant.productId;

      if (!product) {
        const error = new Error("One or more products are no longer available");

        error.status = 400;
        error.code = "INVALID_CHECKOUT_AGAIN";

        throw error;
      }

      const pricing = getCheckoutAgainItemPricing(
        product,
        variant,
        checkoutItem.quantity,
        offerLookup,
      );

      items.push({
        productId: product._id,
        variantId: variant._id,
        productName: product.name,
        productImage: variant.images?.[0]?.url || "",
        size: variant.size,
        color: variant.color?.name || "",
        quantity: Number(pricing.quantity) || 0,
        unitPrice: Number(pricing.finalPrice) || 0,
        originalUnitPrice: Number(pricing.originalPrice) || 0,
        couponDiscountAmount: 0,
        offerId: pricing.offerId || undefined,
        offerTitle: pricing.offerTitle || undefined,
        offerType: pricing.offerType || undefined,
        discountType: pricing.discountType || undefined,
        discountValue: pricing.discountValue ?? undefined,
        gstRate: Number(product.gstRate) || 0,
        status: "Pending",
      });
    }
  } else if (isBuyNow) {
    const { variant, qty } = await validateBuyNowService(variantId, quantity);

    const product = variant.productId;

    if (!product) {
      const error = new Error("Product not found");

      error.status = 404;

      throw error;
    }

    const offerLookup = await buildActiveOfferLookup();

    const pricing = getBestOfferPricing(product, variant, offerLookup);

    items = [
      {
        productId: product._id,
        variantId: variant._id,
        productName: product.name,
        productImage: variant.images?.[0]?.url || "",
        size: variant.size,
        color: variant.color?.name || "",
        quantity: Number(qty) || 0,
        unitPrice: Number(pricing.finalPrice) || 0,
        originalUnitPrice: Number(pricing.originalPrice) || 0,
        couponDiscountAmount: 0,
        offerId: pricing.offerId || undefined,
        offerTitle: pricing.offerTitle || undefined,
        offerType: pricing.offerType || undefined,
        discountType: pricing.discountType || undefined,
        discountValue: pricing.discountValue ?? undefined,
        gstRate: Number(product.gstRate) || 0,
        status: "Placed",
      },
    ];
  } else {
    const cart = await getCartService(userId);

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      const error = new Error("Cart is empty");

      error.status = 400;
      error.code = "EMPTY_CART";

      throw error;
    }

    if (cart.invalid) {
      const error = new Error("Some items in your cart are unavailable");

      error.status = 400;
      error.code = "INVALID_CART";

      throw error;
    }

    items = cart.items.map((item) => ({
      productId: item.product._id,
      variantId: item.variant._id,
      productName: item.product.name,
      productImage: item.variant.images?.[0]?.url || "",
      size: item.variant.size,
      color: item.variant.color?.name || "",
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.finalPrice) || 0,
      originalUnitPrice: Number(item.originalPrice) || 0,
      couponDiscountAmount: 0,
      offerId: item.offerId || undefined,
      offerTitle: item.offerTitle || undefined,
      offerType: item.offerType || undefined,
      discountType: item.discountType || undefined,
      discountValue: item.discountValue ?? undefined,
      gstRate: Number(item.product?.gstRate) || 0,
      status: "Placed",
    }));
  }

  if (items.length === 0) {
    const error = new Error("No items available for checkout");

    error.status = 400;
    error.code = "EMPTY_CART";

    throw error;
  }

  const originalSubtotal = roundMoney(
    items.reduce(
      (sum, item) =>
        sum + Number(item.originalUnitPrice || 0) * Number(item.quantity || 0),
      0,
    ),
  );

  const subtotal = roundMoney(
    items.reduce(
      (sum, item) =>
        sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
      0,
    ),
  );

  let coupon;
  let couponDiscount = 0;

  if (couponCode) {
    try {
      const validatedCoupon = await validateCouponService({
        userId,
        code: couponCode,
        subtotal,
      });

      couponDiscount = Math.min(
        roundMoney(Number(validatedCoupon.discountAmount || 0)),
        subtotal,
      );

      coupon = {
        couponId: validatedCoupon.couponId,
        code: validatedCoupon.code,
        name: validatedCoupon.name,
        discountType: validatedCoupon.discountType,
        discountValue: validatedCoupon.discountValue,
        discountAmount: couponDiscount,
      };
    } catch (error) {
      error.code = "INVALID_COUPON";
      throw error;
    }
  }

  items = allocateCouponDiscount(items, subtotal, couponDiscount);

  const discountedSubtotal = roundMoney(
    items.reduce((sum, item) => {
      const itemAmount =
        Number(item.unitPrice || 0) * Number(item.quantity || 0);

      const itemCouponDiscount = Number(item.couponDiscountAmount || 0);

      return sum + Math.max(itemAmount - itemCouponDiscount, 0);
    }, 0),
  );

  const shippingFee = subtotal >= 999 ? 0 : subtotal > 0 ? 99 : 0;

  const total = roundMoney(discountedSubtotal + shippingFee);

  return {
    items,
    coupon,
    originalSubtotal,
    subtotal,
    couponDiscount,
    discountedSubtotal,
    shippingFee,
    total,
  };
};

export const placeOrderService = async (userId, payload) => {
  const {
    shippingAddress,
    paymentMethod,
    isBuyNow = false,
    variantId,
    quantity,
    couponCode,
    checkoutAgainOrderId,
    checkoutAgain,
  } = payload;

  if (!shippingAddress) {
    const error = new Error("Please select address");

    error.status = 400;

    throw error;
  }

  if (!paymentMethod) {
    const error = new Error("Please select payment method");

    error.status = 400;

    throw error;
  }

  if (paymentMethod === "Razorpay") {
    return createRazorpayOrderService(userId, payload);
  }

  const address = await getUserAddressById(shippingAddress, userId);

  if (!address) {
    const error = new Error("Address not found");

    error.status = 404;

    throw error;
  }

  if (checkoutAgainOrderId) {
    if (
      !checkoutAgain ||
      String(checkoutAgain.orderId) !== String(checkoutAgainOrderId)
    ) {
      const error = new Error("Checkout session is no longer valid");

      error.status = 400;
      error.code = "INVALID_CHECKOUT_AGAIN";

      throw error;
    }

    const order = await findUserOrderById(checkoutAgainOrderId, userId);

    if (!order) {
      const error = new Error("Order not found");

      error.status = 404;

      throw error;
    }

    if (
      order.orderStatus !== "Payment Failed" ||
      order.paymentStatus !== "Failed"
    ) {
      const error = new Error("This order can no longer be checked out again");

      error.status = 400;
      error.code = "INVALID_CHECKOUT_AGAIN";

      throw error;
    }

    const { items, coupon, total, shippingFee } = await buildOrderPricing({
      userId,
      couponCode,
      checkoutAgain,
    });

    if (paymentMethod === "Wallet") {
      const wallet = await findWalletByUserId(userId);

      if (!wallet) {
        const error = new Error("Wallet not found");

        error.status = 400;

        throw error;
      }

      if (Number(wallet.balance) < Number(total)) {
        const error = new Error("Insufficient wallet balance");

        error.status = 400;
        error.code = "INSUFFICIENT_WALLET_BALANCE";

        throw error;
      }
    }

    const estimatedDeliveryDate = new Date();

    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

    order.items = items;
    order.paymentMethod = paymentMethod;
    order.paymentStatus = paymentMethod === "Wallet" ? "Paid" : "Pending";
    order.orderStatus = "Placed";
    order.isCheckoutAgain = true;
    order.estimatedDeliveryDate = estimatedDeliveryDate;

    order.shippingAddress = {
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    };

    order.coupon = coupon || undefined;
    order.shippingFee = shippingFee;
    order.total = total;
    order.razorpayOrderId = undefined;
    order.razorpayPaymentId = undefined;
    order.razorpaySignature = undefined;

    if (paymentMethod === "Wallet") {
      await debitWalletService(userId, {
        amount: total,
        category: "OrderPayment",
        description: `Payment for Order ${order.orderNumber}`,
        reference: order.orderNumber,
      });
    }

    for (const item of items) {
      await reduceVariantStock(item.variantId, item.quantity);
    }

    if (coupon?.couponId) {
      const updatedCoupon = await incrementCouponUsage(coupon.couponId);

      if (!updatedCoupon) {
        const error = new Error("This coupon is no longer available");

        error.status = 400;
        error.code = "INVALID_COUPON";

        throw error;
      }
    }

    await saveOrder(order);

    return order;
  }

  const { items, coupon, total, shippingFee } = await buildOrderPricing({
    userId,
    isBuyNow,
    variantId,
    quantity,
    couponCode,
  });

  if (paymentMethod === "Wallet") {
    const wallet = await findWalletByUserId(userId);

    if (!wallet) {
      const error = new Error("Wallet not found");

      error.status = 400;

      throw error;
    }

    if (Number(wallet.balance) < Number(total)) {
      const error = new Error("Insufficient wallet balance");

      error.status = 400;
      error.code = "INSUFFICIENT_WALLET_BALANCE";

      throw error;
    }
  }

  const estimatedDeliveryDate = new Date();

  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

  const order = await createOrderRepo({
    orderNumber: generateOrderNumber(),
    userId,
    items,
    isBuyNow,
    paymentMethod,
    estimatedDeliveryDate,
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    },
    coupon: coupon || undefined,
    shippingFee,
    total,
    paymentStatus: paymentMethod === "Wallet" ? "Paid" : "Pending",
    orderStatus: "Placed",
  });

  if (paymentMethod === "Wallet") {
    await debitWalletService(userId, {
      amount: total,
      category: "OrderPayment",
      description: `Payment for Order ${order.orderNumber}`,
      reference: order.orderNumber,
    });
  }

  for (const item of items) {
    await reduceVariantStock(item.variantId, item.quantity);
  }

  if (coupon?.couponId) {
    const updatedCoupon = await incrementCouponUsage(coupon.couponId);

    if (!updatedCoupon) {
      const error = new Error("This coupon is no longer available");

      error.status = 400;
      error.code = "INVALID_COUPON";

      throw error;
    }
  }

  if (!isBuyNow) {
    await clearCart(userId);
  }

  return order;
};

export const getOrderSuccessService = async (orderId, userId) => {
  const order = await findUserOrderById(orderId, userId);

  if (!order) {
    const error = new Error("Order not found");

    error.status = 404;

    throw error;
  }

  const pricing = order.items.reduce(
    (totals, item) => {
      const quantity = Number(item.quantity) || 0;

      const originalItemAmount = Number(item.originalUnitPrice) * quantity;

      const offerItemAmount = Number(item.unitPrice) * quantity;

      const couponDiscount = Number(item.couponDiscountAmount) || 0;

      const finalItemAmount = Math.max(offerItemAmount - couponDiscount, 0);

      const gstRate = Number(item.gstRate) || 0;

      const taxableValue = finalItemAmount / (1 + gstRate / 100);

      const gstAmount = finalItemAmount - taxableValue;

      totals.originalSubtotal += originalItemAmount;

      totals.subtotal += offerItemAmount;

      totals.couponDiscountTotal += couponDiscount;

      totals.gstAmount += gstAmount;

      return totals;
    },
    {
      originalSubtotal: 0,
      subtotal: 0,
      couponDiscountTotal: 0,
      gstAmount: 0,
    },
  );

  const offerDiscountTotal = pricing.originalSubtotal - pricing.subtotal;

  const discountedSubtotal = pricing.subtotal - pricing.couponDiscountTotal;

  return {
    order,
    originalSubtotal: Number(pricing.originalSubtotal.toFixed(2)),
    offerDiscountTotal: Number(offerDiscountTotal.toFixed(2)),
    subtotal: Number(pricing.subtotal.toFixed(2)),
    couponDiscountTotal: Number(pricing.couponDiscountTotal.toFixed(2)),
    discountedSubtotal: Number(discountedSubtotal.toFixed(2)),
    gstAmount: Number(pricing.gstAmount.toFixed(2)),
  };
};

export const getOrderDetailService = async (orderId, userId) => {
  const order = await findUserOrderById(orderId, userId);

  if (!order) {
    const error = new Error("Order not found");

    error.status = 404;

    throw error;
  }

  const productIds = order.items.map((item) => item.productId);

  const [returnRequests, userReviews] = await Promise.all([
    Return.find({
      orderId: order._id,
      userId,
    }).lean(),

    findReviewsByUserAndProducts(userId, productIds),
  ]);

  const returnMap = new Map(
    returnRequests.map((request) => [String(request.itemId), request]),
  );

  const reviewMap = new Map(
    userReviews.map((review) => [String(review.productId), review]),
  );

  const displayStatus =
    order.paymentStatus === "Failed"
      ? "Payment Failed"
      : order.orderStatus || "Placed";

  const paymentDisplayStatus = order.paymentStatus;

  const isPaymentFailed =
    order.paymentStatus === "Failed" && order.orderStatus === "Payment Failed";

  const RETURN_WINDOW_DAYS = 14;

  const formatReturnDate = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  order.items.forEach((item) => {
    item.canCancel =
      order.paymentStatus !== "Failed" &&
      ["Placed", "Processing"].includes(item.status);

    item.canReturn = false;
    item.returnDaysLeft = 0;
    item.showReturnStatusBtn = false;
    item.statusMetaText = "";

    const itemReturn = returnMap.get(String(item._id));

    const deliveredAt =
      item.status === "Delivered" && item.statusUpdatedAt
        ? new Date(item.statusUpdatedAt)
        : null;

    let diffDays = null;

    if (deliveredAt && !Number.isNaN(deliveredAt.getTime())) {
      diffDays = Math.floor(
        (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      item.returnDaysLeft = Math.max(RETURN_WINDOW_DAYS - diffDays, 0);
    }

    if (
      item.status === "Delivered" &&
      !itemReturn &&
      diffDays !== null &&
      diffDays <= RETURN_WINDOW_DAYS
    ) {
      item.canReturn = true;
    }

    if (itemReturn) {
      item.returnRequest = itemReturn;

      item.showReturnStatusBtn = [
        "REQUESTED",
        "PROCESSING",
        "APPROVED",
        "REJECTED",
      ].includes(itemReturn.status);
    } else {
      item.returnRequest = null;
    }

    const userReview = reviewMap.get(String(item.productId));

    item.userReview = userReview || null;

    item.hasReview = Boolean(userReview);

    item.canReview = item.status === "Delivered" && !userReview;

    if (item.status === "Delivered") {
      item.statusMetaText = item.statusUpdatedAt
        ? `Delivered on ${formatReturnDate(item.statusUpdatedAt)}`
        : "";
    } else if (item.status === "Cancelled") {
      item.statusMetaText = item.statusUpdatedAt
        ? `Cancelled on ${formatReturnDate(item.statusUpdatedAt)}`
        : "";
    } else if (item.status === "Return Requested") {
      item.statusMetaText = item.statusUpdatedAt
        ? `Return requested on ${formatReturnDate(item.statusUpdatedAt)}`
        : "";
    } else if (item.status === "Return Accepted") {
      item.statusMetaText = item.statusUpdatedAt
        ? `Return accepted on ${formatReturnDate(item.statusUpdatedAt)}`
        : "";
    } else if (item.status === "Returned") {
      item.statusMetaText = item.statusUpdatedAt
        ? `Returned on ${formatReturnDate(item.statusUpdatedAt)}`
        : "";
    } else if (item.status === "Refunded") {
      item.statusMetaText = item.statusUpdatedAt
        ? `Refunded on ${formatReturnDate(item.statusUpdatedAt)}`
        : "";
    } else if (item.status === "Payment Failed") {
      item.statusMetaText = item.statusUpdatedAt
        ? `Payment failed on ${formatReturnDate(item.statusUpdatedAt)}`
        : "";
    }
  });

  const activeItems = order.items.filter(
    (item) => !["Cancelled", "Returned", "Refunded"].includes(item.status),
  );

  const cancelledItems = order.items.filter(
    (item) => item.status === "Cancelled",
  );

  const returnedItems = order.items.filter((item) =>
    ["Returned", "Refunded"].includes(item.status),
  );

  const calculateItemAmounts = (item) => {
    const quantity = Number(item.quantity) || 0;

    const originalUnitPrice = Number(item.originalUnitPrice);

    const unitPrice = Number(item.unitPrice);

    const safeOriginalUnitPrice = Number.isFinite(originalUnitPrice)
      ? originalUnitPrice
      : Number.isFinite(unitPrice)
        ? unitPrice
        : 0;

    const safeUnitPrice = Number.isFinite(unitPrice) ? unitPrice : 0;

    const originalAmount = roundMoney(safeOriginalUnitPrice * quantity);

    const offerAmount = roundMoney(safeUnitPrice * quantity);

    const offerDiscount = roundMoney(Math.max(originalAmount - offerAmount, 0));

    const couponDiscount = roundMoney(
      Math.min(Number(item.couponDiscountAmount || 0), offerAmount),
    );

    const finalAmount = roundMoney(Math.max(offerAmount - couponDiscount, 0));

    const gstRate = Number(item.gstRate) || 0;

    let gstAmount = 0;
    let taxableValue = finalAmount;

    if (finalAmount > 0 && gstRate > 0) {
      taxableValue = finalAmount / (1 + gstRate / 100);

      gstAmount = finalAmount - taxableValue;
    }

    return {
      originalAmount,
      offerAmount,
      offerDiscount,
      couponDiscount,
      finalAmount,
      taxableValue: roundMoney(taxableValue),
      gstRate,
      gstAmount: roundMoney(gstAmount),
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

  const returnedTotals = calculateTotals(returnedItems);

  const fullyCancelled =
    order.items.length > 0 &&
    order.items.every((item) => item.status === "Cancelled");

  const partiallyCancelled = cancelledItems.length > 0 && !fullyCancelled;

  const fullyReturned =
    order.items.length > 0 &&
    order.items.every((item) => ["Returned", "Refunded"].includes(item.status));

  const partiallyReturned = returnedItems.length > 0 && !fullyReturned;

  const originalShippingFee = roundMoney(Number(order.shippingFee) || 0);

  const shippingFee = fullyCancelled ? 0 : originalShippingFee;

  const total = roundMoney(activeTotals.finalSubtotal + shippingFee);

  const currentValue = total;

  const originalOrderTotal = roundMoney(Number(order.total) || 0);

  const paymentCollected =
    order.paymentStatus === "Paid" ? originalOrderTotal : 0;

  const cancellationRefundAmount =
    fullyCancelled && order.paymentStatus === "Paid" ? originalOrderTotal : 0;

  const refundRequired = fullyCancelled && order.paymentStatus === "Paid";

  const hasDeliverableItems =
    !isPaymentFailed &&
    order.items.some((item) =>
      ["Placed", "Processing", "Shipped"].includes(item.status),
    );

  const canCancelOrder =
    order.paymentStatus !== "Failed" &&
    order.items.length > 0 &&
    order.items.every((item) => ["Placed", "Processing"].includes(item.status));

  const canCancelAnyItem =
    order.paymentStatus !== "Failed" &&
    order.items.some((item) => ["Placed", "Processing"].includes(item.status));

  const canDownloadInvoice =
    order.paymentStatus === "Paid" || order.paymentMethod === "CashOnDelivery";

  const showEstimatedDelivery =
    !isPaymentFailed &&
    !fullyCancelled &&
    activeItems.some((item) =>
      ["Placed", "Processing", "Shipped"].includes(item.status),
    );

  const canReturnToCheckout =
    order.paymentMethod === "Razorpay" &&
    order.paymentStatus === "Failed" &&
    order.orderStatus === "Payment Failed";

  const roundedOrderTotals = {
    originalSubtotal: roundMoney(orderTotals.originalSubtotal),
    offerDiscountTotal: roundMoney(orderTotals.offerDiscountTotal),
    subtotal: roundMoney(orderTotals.subtotal),
    couponDiscountTotal: roundMoney(orderTotals.couponDiscountTotal),
    discountedSubtotal: roundMoney(orderTotals.finalSubtotal),
    gstAmount: roundMoney(orderTotals.gstAmount),
  };

  const roundedActiveTotals = {
    originalSubtotal: roundMoney(activeTotals.originalSubtotal),
    offerDiscountTotal: roundMoney(activeTotals.offerDiscountTotal),
    subtotal: roundMoney(activeTotals.subtotal),
    couponDiscountTotal: roundMoney(activeTotals.couponDiscountTotal),
    discountedSubtotal: roundMoney(activeTotals.finalSubtotal),
    gstAmount: roundMoney(activeTotals.gstAmount),
  };

  return {
    order,
    displayStatus,
    paymentDisplayStatus,
    canCancelOrder,
    canCancelAnyItem,
    canDownloadInvoice,
    hasDeliverableItems,
    showEstimatedDelivery,

    activeItems,
    cancelledItems,
    returnedItems,

    originalSubtotal: roundedOrderTotals.originalSubtotal,

    offerDiscountTotal: roundedOrderTotals.offerDiscountTotal,

    subtotal: roundedOrderTotals.subtotal,

    couponDiscountTotal: roundedOrderTotals.couponDiscountTotal,

    discountedSubtotal: roundedOrderTotals.discountedSubtotal,

    gstAmount: roundedOrderTotals.gstAmount,

    activeOriginalSubtotal: roundedActiveTotals.originalSubtotal,

    activeOfferDiscountTotal: roundedActiveTotals.offerDiscountTotal,

    activeSubtotal: roundedActiveTotals.subtotal,

    activeCouponDiscountTotal: roundedActiveTotals.couponDiscountTotal,

    activeDiscountedSubtotal: roundedActiveTotals.discountedSubtotal,

    activeGstAmount: roundedActiveTotals.gstAmount,

    cancelledOriginalAmount: roundMoney(cancelledTotals.originalSubtotal),

    cancelledAmount: roundMoney(cancelledTotals.finalSubtotal),

    returnedOriginalAmount: roundMoney(returnedTotals.originalSubtotal),

    returnedAmount: roundMoney(returnedTotals.finalSubtotal),

    originalShippingFee,

    shippingFee,

    total,

    currentValue,

    originalOrderTotal,

    paymentCollected,

    cancellationRefundAmount,

    refundRequired,

    fullyCancelled,
    partiallyCancelled,
    fullyReturned,
    partiallyReturned,

    isPaymentFailed,

    canReturnToCheckout,
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
  if (
    order.paymentStatus === "Failed" ||
    order.orderStatus === "Payment Failed"
  ) {
    const error = new Error("Payment failed orders cannot be cancelled");
    error.status = 400;
    throw error;
  }
  if (order.orderStatus !== "Placed" && order.orderStatus !== "Processing") {
    const error = new Error("Order cannot be cancelled");

    error.status = 400;

    throw error;
  }

  for (const item of order.items) {
    if (item.status === "Placed" || item.status === "Processing") {
      item.status = "Cancelled";

      await increaseVariantStock(item.variantId, item.quantity);
    }
  }

  if (
    order.paymentStatus === "Paid" &&
    (order.paymentMethod === "Razorpay" || order.paymentMethod === "Wallet")
  ) {
    const refundAmount = Number(order.total) || 0;

    await creditWalletService(userId, {
      amount: refundAmount,
      category: "OrderRefund",
      description: `Refund for cancelled order ${order.orderNumber}`,
      reference: order.orderNumber,
    });
  }

  order.orderStatus = "Cancelled";

  await saveOrder(order);

  if (order.coupon?.couponId) {
    await decrementCouponUsage(order.coupon.couponId);
  }

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
  if (
    order.paymentStatus === "Failed" ||
    order.orderStatus === "Payment Failed"
  ) {
    const error = new Error("Payment failed orders cannot be cancelled");
    error.status = 400;
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
    const itemAmount = Number(item.unitPrice) * Number(item.quantity);

    const couponDiscount = Number(item.couponDiscountAmount || 0);

    const refundAmount = Math.max(itemAmount - couponDiscount, 0);

    await creditWalletService(userId, {
      amount: refundAmount,
      category: "OrderRefund",
      description: `Refund for cancelled item from ${order.orderNumber}`,
      reference: order.orderNumber,
    });
  }

  order.orderStatus = calculateOrderStatus(order.items);

  await saveOrder(order);

  if (order.orderStatus === "Refunded" && order.coupon?.couponId) {
    await decrementCouponUsage(order.coupon.couponId);
  }

  return {
    orderStatus: order.orderStatus,
  };
};

export const downloadInvoiceService = async ({ userId, orderId, res }) => {
  const order = await findUserOrderById(orderId, userId);

  if (!order) {
    const error = new Error("Order not found");

    error.status = 404;

    throw error;
  }

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

        totals.couponDiscountTotal += amounts.couponDiscount;

        totals.finalSubtotal += amounts.finalAmount;

        totals.gstAmount += amounts.gstAmount;

        return totals;
      },
      {
        originalSubtotal: 0,
        offerDiscountTotal: 0,
        couponDiscountTotal: 0,
        finalSubtotal: 0,
        gstAmount: 0,
      },
    );
  };

  const cancelledItems = order.items.filter(
    (item) => item.status === "Cancelled",
  );

  const returnedItems = order.items.filter((item) =>
    ["Returned", "Refunded"].includes(item.status),
  );

  const adjustedItems = order.items.filter(
    (item) => !REFUNDED_STATUSES.has(item.status),
  );

  const orderTotals = calculateTotals(order.items);

  const activeTotals = calculateTotals(adjustedItems);

  const cancelledTotals = calculateTotals(cancelledItems);

  const returnedTotals = calculateTotals(returnedItems);

  const fullyCancelled =
    order.items.length > 0 &&
    order.items.every((item) => item.status === "Cancelled");

  const hasAdjustments = cancelledItems.length > 0 || returnedItems.length > 0;

  const originalShippingFee = Number(order.shippingFee) || 0;

  const currentShippingFee = adjustedItems.length > 0 ? originalShippingFee : 0;

  const originalOrderTotal = Number(order.total) || 0;

  const currentTotal = activeTotals.finalSubtotal + currentShippingFee;

  generateInvoicePdf({
    order,
    items: order.items,
    originalSubtotal: Number(orderTotals.originalSubtotal.toFixed(2)),
    offerDiscountTotal: Number(orderTotals.offerDiscountTotal.toFixed(2)),
    couponDiscountTotal: Number(orderTotals.couponDiscountTotal.toFixed(2)),
    originalGstAmount: Number(orderTotals.gstAmount.toFixed(2)),
    originalShippingFee: Number(originalShippingFee.toFixed(2)),
    originalOrderTotal: Number(originalOrderTotal.toFixed(2)),
    cancelledAmount: Number(cancelledTotals.finalSubtotal.toFixed(2)),
    returnedAmount: Number(returnedTotals.finalSubtotal.toFixed(2)),
    currentSubtotal: Number(activeTotals.finalSubtotal.toFixed(2)),
    currentGstAmount: Number(activeTotals.gstAmount.toFixed(2)),
    currentShippingFee: Number(currentShippingFee.toFixed(2)),
    currentTotal: Number(currentTotal.toFixed(2)),
    fullyCancelled,
    hasAdjustments,
    res,
  });
};

export const createRazorpayOrderService = async (userId, payload) => {
  const {
    shippingAddress,
    couponCode,
    isBuyNow = false,
    variantId,
    quantity,
    checkoutAgainOrderId,
    checkoutAgain,
  } = payload;

  if (!shippingAddress) {
    const error = new Error("Please select address");
    error.status = 400;
    throw error;
  }

  const address = await getUserAddressById(
    shippingAddress,
    userId,
  );

  if (!address) {
    const error = new Error("Shipping address not found");
    error.status = 404;
    throw error;
  }

  const estimatedDeliveryDate = new Date();
  estimatedDeliveryDate.setDate(
    estimatedDeliveryDate.getDate() + 5,
  );

  if (checkoutAgainOrderId) {
    if (
      !checkoutAgain ||
      String(checkoutAgain.orderId) !==
        String(checkoutAgainOrderId)
    ) {
      const error = new Error(
        "Checkout session is no longer valid",
      );
      error.status = 400;
      error.code = "INVALID_CHECKOUT_AGAIN";
      throw error;
    }

    const order = await findUserOrderById(
      checkoutAgainOrderId,
      userId,
    );

    if (!order) {
      const error = new Error("Order not found");
      error.status = 404;
      throw error;
    }

    if (
      order.orderStatus !== "Payment Failed" ||
      order.paymentStatus !== "Failed"
    ) {
      const error = new Error(
        "This order can no longer be checked out again",
      );
      error.status = 400;
      error.code = "INVALID_CHECKOUT_AGAIN";
      throw error;
    }

    const pricing = await buildOrderPricing({
      userId,
      couponCode,
      checkoutAgain,
    });

    order.items = pricing.items.map((item) => ({
      ...item,
      status: "Pending",
    }));

    order.paymentMethod = "Razorpay";
    order.isCheckoutAgain = true;
    order.isBuyNow = false;
    order.estimatedDeliveryDate = estimatedDeliveryDate;

    order.shippingAddress = {
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    };

    order.coupon = pricing.coupon || undefined;
    order.shippingFee = pricing.shippingFee;
    order.total = pricing.total;

    order.razorpayOrderId = undefined;
    order.razorpayPaymentId = undefined;
    order.razorpaySignature = undefined;

    await saveOrder(order);

    try {
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(Number(order.total) * 100),
        currency: "INR",
        receipt: `${order.orderNumber}-${Date.now()}`,
        notes: {
          databaseOrderId: String(order._id),
          userId: String(userId),
          checkoutAgain: "true",
        },
      });

      order.razorpayOrderId = razorpayOrder.id;

      await saveOrder(order);

      return {
        success: true,
        key: process.env.RAZORPAY_KEY,
        databaseOrderId: order._id,
        orderNumber: order.orderNumber,
        order: razorpayOrder,
      };
    } catch (error) {
      order.razorpayOrderId = undefined;

      await saveOrder(order);

      const serviceError = new Error(
        "Unable to initialize Razorpay payment",
      );

      serviceError.status = 500;
      throw serviceError;
    }
  }

  const pricing = await buildOrderPricing({
    userId,
    couponCode,
    isBuyNow,
    variantId,
    quantity,
  });

  const razorpayItems = pricing.items.map((item) => ({
    ...item,
    status: "Pending",
  }));

  const order = await createOrderRepo({
    orderNumber: generateOrderNumber(),
    userId,
    items: razorpayItems,
    isBuyNow,
    isCheckoutAgain: false,
    paymentMethod: "Razorpay",
    paymentStatus: "Pending",
    orderStatus: "Payment Pending",
    estimatedDeliveryDate,
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    },
    coupon: pricing.coupon || undefined,
    shippingFee: pricing.shippingFee,
    total: pricing.total,
  });

  try {
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(order.total) * 100),
      currency: "INR",
      receipt: order.orderNumber,
      notes: {
        databaseOrderId: String(order._id),
        userId: String(userId),
      },
    });

    order.razorpayOrderId = razorpayOrder.id;

    await saveOrder(order);

    return {
      success: true,
      key: process.env.RAZORPAY_KEY,
      databaseOrderId: order._id,
      orderNumber: order.orderNumber,
      order: razorpayOrder,
    };
  } catch (error) {
    await deleteIncompletePendingOrderRepo(
      order._id,
      userId,
    );

    const serviceError = new Error(
      "Unable to initialize Razorpay payment",
    );

    serviceError.status = 500;
    throw serviceError;
  }
};

export const verifyPaymentService = async (
  userId,
  paymentData,
) => {
  const {
    databaseOrderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = paymentData;

  if (!databaseOrderId) {
    const error = new Error(
      "Database order ID is required",
    );
    error.status = 400;
    throw error;
  }

  if (!razorpay_order_id) {
    const error = new Error(
      "Razorpay order ID is required",
    );
    error.status = 400;
    throw error;
  }

  if (!razorpay_payment_id) {
    const error = new Error(
      "Razorpay payment ID is required",
    );
    error.status = 400;
    throw error;
  }

  if (!razorpay_signature) {
    const error = new Error(
      "Razorpay signature is required",
    );
    error.status = 400;
    throw error;
  }

  const order = await findUserOrderById(
    databaseOrderId,
    userId,
  );

  if (!order) {
    const error = new Error(
      "Payment order not found",
    );
    error.status = 404;
    throw error;
  }

  if (order.paymentMethod !== "Razorpay") {
    const error = new Error(
      "Invalid payment method",
    );
    error.status = 400;
    throw error;
  }

  if (order.paymentStatus === "Paid") {
    return {
      success: true,
      orderId: order._id,
    };
  }

  if (
    !["Pending", "Failed"].includes(
      order.paymentStatus,
    )
  ) {
    const error = new Error(
      "Payment is no longer available",
    );
    error.status = 400;
    throw error;
  }

  if (
    !["Payment Pending", "Payment Failed"].includes(
      order.orderStatus,
    )
  ) {
    const error = new Error(
      "Order is no longer available for payment",
    );
    error.status = 400;
    throw error;
  }

  if (!order.razorpayOrderId) {
    const error = new Error(
      "Razorpay payment session not found",
    );
    error.status = 400;
    throw error;
  }

  if (
    String(order.razorpayOrderId) !==
    String(razorpay_order_id)
  ) {
    const error = new Error(
      "Razorpay order does not match",
    );
    error.status = 400;
    throw error;
  }

  verifyRazorpaySignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  const paidOrder =
    await markRazorpayOrderPaidRepo({
      orderId: order._id,
      userId,
      razorpayPaymentId:
        razorpay_payment_id,
      razorpaySignature:
        razorpay_signature,
    });

  if (!paidOrder) {
    const error = new Error(
      "Unable to update payment status",
    );
    error.status = 400;
    throw error;
  }

  for (const item of paidOrder.items) {
    await reduceVariantStock(
      item.variantId,
      item.quantity,
    );

    item.status = "Placed";
  }

  paidOrder.paymentStatus = "Paid";
  paidOrder.orderStatus = "Placed";

  paidOrder.items.forEach((item) => {
    item.status = "Placed";
  });

  await saveOrder(paidOrder);

  if (paidOrder.coupon?.couponId) {
    const updatedCoupon =
      await incrementCouponUsage(
        paidOrder.coupon.couponId,
      );

    if (!updatedCoupon) {
      const error = new Error(
        "Coupon usage could not be updated",
      );

      error.status = 400;
      error.code = "INVALID_COUPON";

      throw error;
    }
  }

  if (
    !paidOrder.isBuyNow &&
    !paidOrder.isCheckoutAgain
  ) {
    await clearCart(userId);
  }

  return {
    success: true,
    orderId: paidOrder._id,
  };
};

export const recordRazorpayFailureService = async (userId, payload) => {
  const { databaseOrderId } = payload;

  if (!databaseOrderId) {
    const error = new Error("Database order ID is required");

    error.status = 400;

    throw error;
  }

  const order = await findUserOrderById(databaseOrderId, userId);

  if (!order) {
    const error = new Error("Payment order not found");

    error.status = 404;

    throw error;
  }

  if (order.paymentMethod !== "Razorpay") {
    const error = new Error("Invalid payment method");

    error.status = 400;

    throw error;
  }

  if (order.paymentStatus === "Paid") {
    return {
      success: true,
      orderId: order._id,
    };
  }

  order.paymentStatus = "Failed";

  order.orderStatus = "Payment Failed";

  const failedAt = new Date();

  order.items.forEach((item) => {
    item.status = "Payment Failed";

    item.statusUpdatedAt = failedAt;
  });

  await saveOrder(order);

  return {
    success: true,
    orderId: order._id,
  };
};

export const prepareCheckoutAgainService = async (orderId, userId) => {
  const order = await findUserOrderById(orderId, userId);

  if (!order) {
    const error = new Error("Order not found");

    error.status = 404;
    throw error;
  }

  if (order.paymentMethod !== "Razorpay") {
    const error = new Error(
      "Checkout again is only available for Razorpay orders",
    );

    error.status = 400;
    throw error;
  }

  if (
    order.paymentStatus !== "Failed" ||
    order.orderStatus !== "Payment Failed"
  ) {
    const error = new Error("This order is not eligible for checkout again");

    error.status = 400;
    error.code = "INVALID_CHECKOUT_AGAIN";

    throw error;
  }

  const checkoutItems = order.items
    .filter((item) => ["Pending", "Payment Failed"].includes(item.status))
    .map((item) => ({
      variantId: item.variantId?._id || item.variantId,

      quantity: Number(item.quantity),
    }))
    .filter(
      (item) =>
        item.variantId && Number.isInteger(item.quantity) && item.quantity > 0,
    );

  if (checkoutItems.length === 0) {
    const error = new Error("No items are available for checkout");

    error.status = 400;
    error.code = "INVALID_CHECKOUT_AGAIN";

    throw error;
  }

  return {
    orderId: order._id,

    items: checkoutItems,

    shippingAddress: order.shippingAddress
      ? {
          fullName: order.shippingAddress.fullName,

          phone: order.shippingAddress.phone,

          line1: order.shippingAddress.line1,

          line2: order.shippingAddress.line2 || "",

          city: order.shippingAddress.city,

          state: order.shippingAddress.state,

          pincode: order.shippingAddress.pincode,
        }
      : null,
  };
};
