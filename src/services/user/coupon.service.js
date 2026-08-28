import {
  findCouponByCode,
  findAvailableCouponsForCheckout,
} from "../../repositories/coupon.repository.js";

import { hasUserUsedCoupon,findUserOrderById } from "../../repositories/order.repository.js";

import { findActiveVariant } from "../../repositories/checkout.repository.js";
import { getCartService } from "./cart.service.js";

import {
  buildActiveOfferLookup,
  getBestOfferPricing,
} from "../shared/pricing.service.js";

const roundMoney = (value) => {
  return Number(Number(value || 0).toFixed(2));
};

const calculateShippingFee = (subtotal) => {
  const amount = Number(subtotal);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return amount >= 999 ? 0 : 99;
};

const calculateInclusiveGst = (amount, gstRate) => {
  const inclusiveAmount = Number(amount);
  const rate = Number(gstRate);

  if (
    !Number.isFinite(inclusiveAmount) ||
    inclusiveAmount <= 0 ||
    !Number.isFinite(rate) ||
    rate <= 0
  ) {
    return 0;
  }

  const taxableAmount = inclusiveAmount / (1 + rate / 100);

  return roundMoney(inclusiveAmount - taxableAmount);
};

const calculateCouponDiscount = (coupon, subtotal) => {
  const checkoutSubtotal = Number(subtotal);

  let discountAmount = 0;

  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = (checkoutSubtotal * Number(coupon.discountValue)) / 100;

    if (
      coupon.maximumDiscountAmount !== null &&
      coupon.maximumDiscountAmount !== undefined
    ) {
      discountAmount = Math.min(
        discountAmount,
        Number(coupon.maximumDiscountAmount),
      );
    }
  }

  if (coupon.discountType === "FLAT") {
    discountAmount = Number(coupon.discountValue);
  }

  return roundMoney(Math.min(Math.max(discountAmount, 0), checkoutSubtotal));
};

const buildCartCheckoutPricing = async (userId) => {
  const cart = await getCartService(userId);

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    const error = new Error("Your cart is empty");

    error.status = 400;
    error.code = "EMPTY_CART";

    throw error;
  }

  if (cart.invalid) {
    const error = new Error(
      "Some items in your cart are unavailable. Please review your cart",
    );

    error.status = 400;
    error.code = "INVALID_CART";

    throw error;
  }

  const items = cart.items
    .filter((item) => item.status === "active")
    .map((item) => {
      const quantity = Number(item.quantity);

      const unitPrice = Number(
        item.finalPrice ?? item.unitPrice ?? item.variantId?.price ?? 0,
      );

      const gstRate = Number(
        item.gstRate ?? item.product?.gstRate ?? item.productId?.gstRate ?? 0,
      );

      return {
        variantId: item.variantId?._id ?? item.variantId,

        quantity,
        unitPrice,

        amount: roundMoney(unitPrice * quantity),

        gstRate,
      };
    });

  if (items.length === 0) {
    const error = new Error("No valid items found in your cart");

    error.status = 400;
    error.code = "INVALID_CART";

    throw error;
  }

  const subtotal = roundMoney(
    items.reduce((total, item) => total + item.amount, 0),
  );

  return {
    subtotal,
    items,
  };
};

const buildBuyNowCheckoutPricing = async (variantId, quantity) => {
  const qty = Number(quantity);

  if (!variantId || !Number.isInteger(qty) || qty < 1) {
    const error = new Error("Invalid product or quantity");

    error.status = 400;

    throw error;
  }

  if (qty > 5) {
    const error = new Error("Maximum quantity allowed is 5");

    error.status = 400;

    throw error;
  }

  const variant = await findActiveVariant(variantId);

  if (!variant) {
    const error = new Error("Selected product variant is unavailable");

    error.status = 404;

    throw error;
  }

  if (Number(variant.stock) < qty) {
    const error = new Error("Requested quantity is not available");

    error.status = 400;

    throw error;
  }

  const product = variant.productId;

  if (!product || product.isActive === false) {
    const error = new Error("This product is currently unavailable");

    error.status = 400;

    throw error;
  }

  const offerLookup = await buildActiveOfferLookup();

  const pricing = getBestOfferPricing(product, variant, offerLookup);

  const unitPrice = Number(pricing.finalPrice);

  const amount = roundMoney(unitPrice * qty);

  return {
    subtotal: amount,

    items: [
      {
        variantId: variant._id,
        quantity: qty,
        unitPrice,
        amount,
        gstRate: Number(product.gstRate) || 0,
      },
    ],
  };
};

const buildCheckoutAgainPricing = async (userId, orderId) => {
  const order = await findUserOrderById(orderId, userId);

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  const validCheckoutAgainState =
    (
      order.orderStatus === "Payment Failed" &&
      order.paymentStatus === "Failed"
    ) ||
    (
      order.orderStatus === "Payment Pending" &&
      order.paymentStatus === "Pending"
    ) ||
    (
      order.orderStatus === "Payment Expired" &&
      order.paymentStatus === "Failed"
    );

  if (!validCheckoutAgainState) {
    const error = new Error("This order cannot be checked out again");
    error.status = 400;
    error.code = "INVALID_CHECKOUT_AGAIN";
    throw error;
  }

  const offerLookup = await buildActiveOfferLookup();
  const items = [];

  for (const oldItem of order.items) {
    const variant = await findActiveVariant(oldItem.variantId);

    if (!variant) {
      const error = new Error(
        `${oldItem.productName} is no longer available`,
      );

      error.status = 400;
      error.code = "INVALID_CHECKOUT_ITEM";

      throw error;
    }

    const product = variant.productId;
    const quantity = Number(oldItem.quantity) || 0;

    if (
      !variant.isActive ||
      !product?.isActive ||
      !product?.categoryId?.isActive
    ) {
      const error = new Error(
        `${oldItem.productName} is no longer available`,
      );

      error.status = 400;
      error.code = "INVALID_CHECKOUT_ITEM";

      throw error;
    }

    if (quantity < 1 || Number(variant.stock) < quantity) {
      const error = new Error(
        `${oldItem.productName} does not have enough stock`,
      );

      error.status = 400;
      error.code = "INSUFFICIENT_STOCK";

      throw error;
    }

    const pricing = getBestOfferPricing(
      product,
      variant,
      offerLookup,
    );

    const unitPrice = Number(pricing.finalPrice);
    const amount = roundMoney(unitPrice * quantity);

    items.push({
      variantId: variant._id,
      quantity,
      unitPrice,
      amount,
      gstRate: Number(product.gstRate) || 0,
    });
  }

  const subtotal = roundMoney(
    items.reduce(
      (total, item) => total + item.amount,
      0,
    ),
  );

  return {
    subtotal,
    items,
  };
};

const buildCheckoutPricing = async ({
  userId,
  isBuyNow,
  variantId,
  quantity,
  checkoutAgainOrderId,
}) => {
  if (checkoutAgainOrderId) {
    return buildCheckoutAgainPricing(
      userId,
      checkoutAgainOrderId,
    );
  }

  if (isBuyNow) {
    return buildBuyNowCheckoutPricing(
      variantId,
      quantity,
    );
  }

  return buildCartCheckoutPricing(userId);
};

const distributeCouponDiscount = (items, subtotal, couponDiscount) => {
  let distributedDiscount = 0;

  return items.map((item, index) => {
    const isLastItem = index === items.length - 1;

    let itemCouponDiscount = 0;

    if (couponDiscount > 0) {
      if (isLastItem) {
        itemCouponDiscount = roundMoney(couponDiscount - distributedDiscount);
      } else {
        itemCouponDiscount = roundMoney(
          couponDiscount * (item.amount / subtotal),
        );

        distributedDiscount = roundMoney(
          distributedDiscount + itemCouponDiscount,
        );
      }
    }

    itemCouponDiscount = Math.min(itemCouponDiscount, item.amount);

    const finalAmount = roundMoney(item.amount - itemCouponDiscount);

    const gstAmount = calculateInclusiveGst(finalAmount, item.gstRate);

    return {
      ...item,

      couponDiscountAmount: itemCouponDiscount,

      finalAmount,
      gstAmount,
    };
  });
};

const buildPricingResponse = (checkoutPricing, couponDiscount = 0) => {
  const subtotal = roundMoney(checkoutPricing.subtotal);

  const discount = roundMoney(couponDiscount);

  const discountedSubtotal = roundMoney(subtotal - discount);

  const items = distributeCouponDiscount(
    checkoutPricing.items,
    subtotal,
    discount,
  );

  const gstAmount = roundMoney(
    items.reduce((total, item) => total + item.gstAmount, 0),
  );

  const shippingFee = calculateShippingFee(subtotal);

  const total = roundMoney(discountedSubtotal + shippingFee);

  return {
    subtotal,
    couponDiscount: discount,
    discountedSubtotal,
    gstAmount,
    shippingFee,
    total,
    items,
  };
};

export const getQualifiedCouponsService = async ({ userId, subtotal }) => {
  const checkoutSubtotal = Number(subtotal);

  if (!userId || !Number.isFinite(checkoutSubtotal) || checkoutSubtotal <= 0) {
    return [];
  }

  const coupons = await findAvailableCouponsForCheckout();

  const couponResults = await Promise.all(
    coupons.map(async (coupon) => {
      const alreadyUsed = await hasUserUsedCoupon({
        userId,
        couponId: coupon._id,
      });

      if (alreadyUsed) {
        return null;
      }

      const minimumPurchaseAmount = Number(coupon.minimumPurchaseAmount) || 0;

      const remainingAmount = roundMoney(
        Math.max(minimumPurchaseAmount - checkoutSubtotal, 0),
      );

      const eligible = remainingAmount === 0;

      return {
        couponId: coupon._id,
        code: coupon.code,
        name: coupon.name,

        description: coupon.description,

        discountType: coupon.discountType,

        discountValue: Number(coupon.discountValue),

        maximumDiscountAmount:
          coupon.maximumDiscountAmount !== null &&
          coupon.maximumDiscountAmount !== undefined
            ? Number(coupon.maximumDiscountAmount)
            : null,

        minimumPurchaseAmount,
        validUntil: coupon.validUntil,

        eligible,
        remainingAmount,

        unavailableReason: eligible
          ? null
          : `Add ₹${remainingAmount.toLocaleString(
              "en-IN",
            )} more to use this coupon`,
      };
    }),
  );

  return couponResults.filter(Boolean);
};

export const validateCouponService = async ({ userId, code, subtotal }) => {
  const couponCode = String(code || "")
    .trim()
    .toUpperCase();

  const checkoutSubtotal = Number(subtotal);

  if (!userId) {
    const error = new Error("User authentication is required");

    error.status = 401;

    throw error;
  }

  if (!couponCode) {
    const error = new Error("Please enter a coupon code");

    error.status = 400;

    throw error;
  }

  if (!Number.isFinite(checkoutSubtotal) || checkoutSubtotal <= 0) {
    const error = new Error("Invalid checkout amount");

    error.status = 400;

    throw error;
  }

  const coupon = await findCouponByCode(couponCode);

  if (!coupon) {
    const error = new Error("Invalid coupon code");

    error.status = 404;

    throw error;
  }

  if (!coupon.isActive) {
    const error = new Error("This coupon is currently inactive");

    error.status = 400;

    throw error;
  }

  const now = new Date();

  if (coupon.validFrom && now < new Date(coupon.validFrom)) {
    const error = new Error("This coupon is not active yet");

    error.status = 400;

    throw error;
  }

  if (coupon.validUntil && now > new Date(coupon.validUntil)) {
    const error = new Error("This coupon has expired");

    error.status = 400;

    throw error;
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usageLimit !== undefined &&
    Number(coupon.usedCount || 0) >= Number(coupon.usageLimit)
  ) {
    const error = new Error("This coupon usage limit has been reached");

    error.status = 400;

    throw error;
  }

  const alreadyUsed = await hasUserUsedCoupon({
    userId,
    couponId: coupon._id,
  });

  if (alreadyUsed) {
    const error = new Error("You have already used this coupon");

    error.status = 400;
    error.code = "COUPON_ALREADY_USED";

    throw error;
  }

  const minimumPurchaseAmount = Number(coupon.minimumPurchaseAmount) || 0;

  if (checkoutSubtotal < minimumPurchaseAmount) {
    const remainingAmount = roundMoney(
      minimumPurchaseAmount - checkoutSubtotal,
    );

    const error = new Error(
      `Add ₹${remainingAmount.toLocaleString("en-IN")} more to use this coupon`,
    );

    error.status = 400;
    error.code = "MINIMUM_PURCHASE_NOT_MET";

    throw error;
  }

  const discountAmount = calculateCouponDiscount(coupon, checkoutSubtotal);

  const discountedSubtotal = roundMoney(checkoutSubtotal - discountAmount);

  return {
    couponId: coupon._id,
    code: coupon.code,
    name: coupon.name,

    discountType: coupon.discountType,

    discountValue: Number(coupon.discountValue),

    discountAmount,
    discountedSubtotal,
  };
};

export const applyCouponService = async (userId,payload) => {
  const {
    code,
    variantId,
    quantity,
    checkoutAgainOrderId,
  } = payload;

  const isBuyNow =
    payload.isBuyNow === true ||
    payload.isBuyNow === "true";

  const checkoutPricing = await buildCheckoutPricing({
    userId,
    isBuyNow,
    variantId,
    quantity,
    checkoutAgainOrderId,
  });

  const coupon = await validateCouponService({
    userId,
    code,
    subtotal: checkoutPricing.subtotal,
  });

  const pricing = buildPricingResponse(
    checkoutPricing,
    coupon.discountAmount,
  );

  return {
    coupon: {
      id: coupon.couponId,
      code: coupon.code,
      name: coupon.name,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: coupon.discountAmount,
    },
    pricing: {
      subtotal: pricing.subtotal,
      couponDiscount: pricing.couponDiscount,
      discountedSubtotal: pricing.discountedSubtotal,
      gstAmount: pricing.gstAmount,
      shippingFee: pricing.shippingFee,
      total: pricing.total,
    },
  };
};

export const removeCouponService = async (userId,payload) => {
  const {
    variantId,
    quantity,
    checkoutAgainOrderId,
  } = payload;

  const isBuyNow =
    payload.isBuyNow === true ||
    payload.isBuyNow === "true";

  const checkoutPricing = await buildCheckoutPricing({
    userId,
    isBuyNow,
    variantId,
    quantity,
    checkoutAgainOrderId,
  });

  const pricing = buildPricingResponse(
    checkoutPricing,
    0,
  );

  return {
    subtotal: pricing.subtotal,
    couponDiscount: 0,
    discountedSubtotal: pricing.subtotal,
    gstAmount: pricing.gstAmount,
    shippingFee: pricing.shippingFee,
    total: pricing.total,
  };
};
