import { findActiveVariant } from "../../repositories/checkout.repository.js";
import { findWalletByUserId } from "../../repositories/wallet.repository.js";
import { findUserOrderById } from "../../repositories/order.repository.js";

import { getAddressesService } from "./address.service.js";
import { getCartService } from "./cart.service.js";
import {
  buildActiveOfferLookup,
  getBestOfferPricing,
} from "../shared/pricing.service.js";
import { getQualifiedCouponsService } from "./coupon.service.js";

const MAX_QTY = 5;

const createServiceError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const calculateIncludedGst = (amount, gstRate) => {
  const inclusiveAmount = Number(amount);
  const rate = Number(gstRate) || 0;

  if (inclusiveAmount <= 0 || rate <= 0) {
    return 0;
  }

  const taxableValue = inclusiveAmount / (1 + rate / 100);

  return inclusiveAmount - taxableValue;
};

export const calculateShipping = (subtotal) => {
  const amount = Number(subtotal);

  if (amount <= 0) {
    return 0;
  }

  return amount >= 999 ? 0 : 99;
};

export const getCheckoutPageService = async (userId) => {
  const [cart, wallet, addresses] = await Promise.all([
    getCartService(userId),
    findWalletByUserId(userId),
    getAddressesService(userId),
  ]);

  if (!cart || cart.items.length === 0) {
    throw createServiceError("Your cart is empty.");
  }

  const invalidCart = cart.invalid;

  const message = invalidCart
    ? "Some items in your cart are unavailable. Please review your cart."
    : null;

  const gstAmount = cart.items.reduce((total, item) => {
    if (item.status !== "active") {
      return total;
    }

    const itemSubtotal =
      Number(item.finalPrice) *
      Number(item.quantity);

    return (
      total +
      calculateIncludedGst(
        itemSubtotal,
        item.product?.gstRate,
      )
    );
  }, 0);

  const shipping = calculateShipping(cart.subtotal);

  const total =
    Number(cart.subtotal) +
    shipping;

  const qualifiedCoupons = invalidCart
    ? []
    : await getQualifiedCouponsService({
        userId,
        subtotal: cart.subtotal,
      });

  const walletBalance =
    Number(wallet?.balance || 0);

  const canUseWallet =
    walletBalance >= total;

  return {
    canUseWallet,
    wallet,
    cart,
    addresses,

    originalSubtotal:
      cart.originalSubtotal,

    subtotal:
      cart.subtotal,

    qualifiedCoupons,

    canApplyCoupon:
      qualifiedCoupons.some(
        (coupon) => coupon.eligible,
      ),

    totalDiscount:
      cart.totalDiscount,

    gstAmount:
      Number(gstAmount.toFixed(2)),

    shipping,

    total:
      Number(total.toFixed(2)),

    invalidCart,
    message,

    isBuyNow: false,
    buyNow: null,

    isCheckoutAgain: false,
    checkoutAgainOrderId: null,
  };
};

export const validateBuyNowService = async (
  variantId,
  quantity,
) => {
  const qty =
    Number.parseInt(quantity, 10);

  if (
    !Number.isInteger(qty) ||
    qty < 1 ||
    qty > MAX_QTY
  ) {
    throw createServiceError(
      `Quantity must be between 1 and ${MAX_QTY}`,
    );
  }

  if (!variantId) {
    throw createServiceError(
      "Variant ID is required",
    );
  }

  const variant =
    await findActiveVariant(variantId);

  if (!variant) {
    throw createServiceError(
      "Variant not found",
      404,
    );
  }

  const product = variant.productId;
  const category = product?.categoryId;

  if (!product) {
    throw createServiceError(
      "Product not found",
      404,
    );
  }

  if (!product.isActive) {
    throw createServiceError(
      "Product is unavailable",
    );
  }

  if (!category?.isActive) {
    throw createServiceError(
      "Product category is unavailable",
    );
  }

  if (!variant.isActive) {
    throw createServiceError(
      "Variant is unavailable",
    );
  }

  const stock = Number(variant.stock);

  if (stock <= 0) {
    throw createServiceError(
      "Product is out of stock",
    );
  }

  if (qty > stock) {
    throw createServiceError(
      `Only ${stock} available`,
    );
  }

  return {
    variant,
    qty,
  };
};

export const getBuyNowCheckoutService = async (
  userId,
  variantId,
  quantity,
) => {
  const [
    wallet,
    addresses,
    validatedBuyNow,
    offerLookup,
  ] = await Promise.all([
    findWalletByUserId(userId),
    getAddressesService(userId),
    validateBuyNowService(
      variantId,
      quantity,
    ),
    buildActiveOfferLookup(),
  ]);

  const { variant, qty } =
    validatedBuyNow;

  const product = variant.productId;

  const pricing =
    getBestOfferPricing(
      product,
      variant,
      offerLookup,
    );

  const originalPrice =
    Number(pricing.originalPrice);

  const finalPrice =
    Number(pricing.finalPrice);

  const discountAmount =
    Number(pricing.discountAmount);

  const originalSubtotal =
    originalPrice * qty;

  const subtotal =
    finalPrice * qty;

  const qualifiedCoupons =
    await getQualifiedCouponsService({
      userId,
      subtotal,
    });

  const totalDiscount =
    originalSubtotal - subtotal;

  const item = {
    product,
    variant,
    quantity: qty,
    status: "active",

    originalPrice,
    finalPrice,
    discountAmount,

    hasOffer:
      pricing.hasOffer,

    offerId:
      pricing.offerId,

    offerTitle:
      pricing.offerTitle,

    offerType:
      pricing.offerType,

    discountType:
      pricing.discountType,

    discountValue:
      pricing.discountValue,

    lineOriginalTotal:
      Number(
        originalSubtotal.toFixed(2),
      ),

    lineTotal:
      Number(
        subtotal.toFixed(2),
      ),

    lineDiscount:
      Number(
        totalDiscount.toFixed(2),
      ),
  };

  const shipping =
    calculateShipping(subtotal);

  const total =
    subtotal + shipping;

  const walletBalance =
    Number(wallet?.balance || 0);

  const canUseWallet =
    walletBalance >= total;

  const gstAmount =
    calculateIncludedGst(
      subtotal,
      product.gstRate,
    );

  return {
    canUseWallet,
    wallet,

    cart: {
      items: [item],
      invalid: false,

      originalSubtotal:
        Number(
          originalSubtotal.toFixed(2),
        ),

      subtotal:
        Number(
          subtotal.toFixed(2),
        ),

      totalDiscount:
        Number(
          totalDiscount.toFixed(2),
        ),
    },

    addresses,

    originalSubtotal:
      Number(
        originalSubtotal.toFixed(2),
      ),

    subtotal:
      Number(
        subtotal.toFixed(2),
      ),

    qualifiedCoupons,

    canApplyCoupon:
      qualifiedCoupons.some(
        (coupon) => coupon.eligible,
      ),

    totalDiscount:
      Number(
        totalDiscount.toFixed(2),
      ),

    shipping,

    total:
      Number(total.toFixed(2)),

    gstAmount:
      Number(gstAmount.toFixed(2)),

    invalidCart: false,
    message: null,

    isBuyNow: true,

    buyNow: {
      variantId:
        String(variant._id),
      quantity: qty,
    },

    isCheckoutAgain: false,
    checkoutAgainOrderId: null,
  };
};

export const getCheckoutAgainPageService = async (
  userId,
  checkoutAgain,
) => {
  const order =
    await findUserOrderById(
      checkoutAgain.orderId,
      userId,
    );

  if (!order) {
    const error =
      new Error("Order not found");

    error.status = 404;

    throw error;
  }

  if (
    ![
      "Payment Pending",
      "Payment Expired",
    ].includes(order.orderStatus)
  ) {
    const error =
      new Error(
        "This order cannot be checked out again",
      );

    error.status = 400;

    throw error;
  }

  if (order.paymentStatus === "Paid") {
    const error =
      new Error(
        "This order is already paid",
      );

    error.status = 400;

    throw error;
  }

  if (
    !Array.isArray(checkoutAgain.items) ||
    checkoutAgain.items.length === 0
  ) {
    const error =
      new Error(
        "No items available for checkout",
      );

    error.status = 400;
    error.code =
      "EMPTY_CHECKOUT_AGAIN";

    throw error;
  }

  const [
    addresses,
    wallet,
    offerLookup,
  ] = await Promise.all([
    getAddressesService(userId),
    findWalletByUserId(userId),
    buildActiveOfferLookup(),
  ]);

  const items = [];

  for (
    const selectedItem
    of checkoutAgain.items
  ) {
    const oldItem =
      order.items.find(
        (item) =>
          String(
            item.variantId?._id ||
            item.variantId,
          ) ===
          String(
            selectedItem.variantId,
          ),
      );

    if (!oldItem) {
      continue;
    }

    const variant =
      await findActiveVariant(
        selectedItem.variantId,
      );

    if (!variant) {
      items.push({
        product: {
          _id: oldItem.productId,
          name: oldItem.productName,
          gstRate: oldItem.gstRate,
        },

        variant: {
          _id:
            oldItem.variantId?._id ||
            oldItem.variantId,

          images:
            oldItem.productImage
              ? [
                  {
                    url:
                      oldItem.productImage,
                  },
                ]
              : [],

          size: oldItem.size,

          color: {
            name: oldItem.color,
          },
        },

        quantity:
          Number(
            selectedItem.quantity,
          ),

        originalPrice:
          Number(
            oldItem.originalUnitPrice ||
            oldItem.unitPrice ||
            0,
          ),

        finalPrice:
          Number(
            oldItem.unitPrice || 0,
          ),

        lineOriginalTotal:
          Number(
            oldItem.originalUnitPrice ||
            oldItem.unitPrice ||
            0,
          ) *
          Number(
            selectedItem.quantity,
          ),

        lineTotal:
          Number(
            oldItem.unitPrice || 0,
          ) *
          Number(
            selectedItem.quantity,
          ),

        hasOffer: false,

        discountType: null,
        discountValue: null,

        status: "unavailable",

        unavailableReason:
          "This product variant is no longer available",
      });

      continue;
    }

    const product =
      variant.productId;

    const quantity =
      Number(
        selectedItem.quantity,
      );

    let status = "active";
    let unavailableReason = "";

    if (!variant.isActive) {
      status = "unavailable";

      unavailableReason =
        "This variant is currently unavailable";
    } else if (!product?.isActive) {
      status = "unavailable";

      unavailableReason =
        "This product is currently unavailable";
    } else if (
      !product?.categoryId?.isActive
    ) {
      status = "unavailable";

      unavailableReason =
        "This product category is currently unavailable";
    } else if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      status = "unavailable";

      unavailableReason =
        "Invalid product quantity";
    } else if (
      Number(variant.stock) <
      quantity
    ) {
      status = "stock";

      unavailableReason =
        Number(variant.stock) > 0
          ? `Only ${variant.stock} available`
          : "Out of stock";
    }

    const pricing =
      getBestOfferPricing(
        product,
        variant,
        offerLookup,
      );

    const originalPrice =
      Number(
        pricing.originalPrice ??
        variant.price ??
        0,
      );

    const finalPrice =
      Number(
        pricing.finalPrice ??
        variant.price ??
        0,
      );

    items.push({
      product,
      variant,
      quantity,

      originalPrice,
      finalPrice,

      lineOriginalTotal:
        originalPrice * quantity,

      lineTotal:
        finalPrice * quantity,

      discountAmount:
        Number(
          pricing.discountAmount || 0,
        ),

      hasOffer:
        Boolean(
          pricing.hasOffer,
        ),

      offerId:
        pricing.offerId || null,

      offerTitle:
        pricing.offerTitle || null,

      offerType:
        pricing.offerType || null,

      discountType:
        pricing.discountType || null,

      discountValue:
        pricing.discountValue ?? null,

      status,
      unavailableReason,

      availableStock:
        Number(
          variant.stock,
        ) || 0,
    });
  }

  const activeItems =
    items.filter(
      (item) =>
        item.status === "active",
    );

  const originalSubtotal =
    activeItems.reduce(
      (total, item) =>
        total +
        Number(
          item.lineOriginalTotal ||
          0,
        ),
      0,
    );

  const subtotal =
    activeItems.reduce(
      (total, item) =>
        total +
        Number(
          item.lineTotal || 0,
        ),
      0,
    );

  const totalDiscount =
    Math.max(
      originalSubtotal - subtotal,
      0,
    );

  const gstAmount =
    activeItems.reduce(
      (total, item) => {
        const amount =
          Number(
            item.lineTotal || 0,
          );

        const gstRate =
          Number(
            item.product?.gstRate ||
            0,
          );

        if (
          amount <= 0 ||
          gstRate <= 0
        ) {
          return total;
        }

        const taxableValue =
          amount /
          (1 + gstRate / 100);

        return (
          total +
          (amount - taxableValue)
        );
      },
      0,
    );

  const shipping =
    calculateShipping(subtotal);

  const total =
    subtotal + shipping;

  const invalidCart =
    items.some(
      (item) =>
        item.status !== "active",
    );

  const walletBalance =
    Number(wallet?.balance || 0);

  const canUseWallet =
    walletBalance >= total;

  const qualifiedCoupons =
    invalidCart || subtotal <= 0
      ? []
      : await getQualifiedCouponsService({
          userId,
          subtotal,
        });

  return {
    order,

    cart: {
      items,

      originalSubtotal:
        Number(
          originalSubtotal.toFixed(2),
        ),

      subtotal:
        Number(
          subtotal.toFixed(2),
        ),

      totalDiscount:
        Number(
          totalDiscount.toFixed(2),
        ),

      invalid: invalidCart,
    },

    addresses,
    wallet,
    canUseWallet,

    qualifiedCoupons,

    canApplyCoupon:
      qualifiedCoupons.some(
        (coupon) => coupon.eligible,
      ),

    originalSubtotal:
      Number(
        originalSubtotal.toFixed(2),
      ),

    subtotal:
      Number(
        subtotal.toFixed(2),
      ),

    totalDiscount:
      Number(
        totalDiscount.toFixed(2),
      ),

    gstAmount:
      Number(
        gstAmount.toFixed(2),
      ),

    shipping:
      Number(
        shipping.toFixed(2),
      ),

    total:
      Number(
        total.toFixed(2),
      ),

    invalidCart,

    message:
      invalidCart
        ? "Some items from this order need your attention before checkout."
        : null,

    isBuyNow: false,
    buyNow: null,

    isCheckoutAgain: true,

    checkoutAgainOrderId:
      order._id,
  };
};