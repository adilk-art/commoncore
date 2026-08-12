import { findActiveVariant } from "../../repositories/checkout.repository.js";
import { findWalletByUserId } from "../../repositories/wallet.repository.js";
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

const calculateShipping = (subtotal) => {
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
    const itemSubtotal = Number(item.finalPrice) * Number(item.quantity);
    return total + calculateIncludedGst(itemSubtotal, item.product?.gstRate);
  }, 0);

  const shipping = calculateShipping(cart.subtotal);
  const total = Number(cart.subtotal) + shipping;
  const qualifiedCoupons = invalidCart
    ? []
    : await getQualifiedCouponsService({
        userId,
        subtotal: cart.subtotal,
      });
  const walletBalance = Number(wallet?.balance || 0);
  const canUseWallet = walletBalance >= total;
  return {
    canUseWallet,
    wallet,
    cart,
    addresses,
    originalSubtotal: cart.originalSubtotal,

    subtotal: cart.subtotal,
    qualifiedCoupons,
    canApplyCoupon: qualifiedCoupons.some((coupon) => coupon.eligible),
    totalDiscount: cart.totalDiscount,
    gstAmount: Number(gstAmount.toFixed(2)),
    shipping,
    total: Number(total.toFixed(2)),
    invalidCart,
    message,
    isBuyNow: false,
    buyNow: null,
  };
};

export const validateBuyNowService = async (variantId, quantity) => {
  const qty = Number.parseInt(quantity, 10);

  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
    throw createServiceError(`Quantity must be between 1 and ${MAX_QTY}`);
  }
  if (!variantId) {
    throw createServiceError("Variant ID is required");
  }
  const variant = await findActiveVariant(variantId);
  if (!variant) {
    throw createServiceError("Variant not found", 404);
  }
  const product = variant.productId;
  const category = product?.categoryId;
  if (!product) {
    throw createServiceError("Product not found", 404);
  }
  if (!product.isActive) {
    throw createServiceError("Product is unavailable");
  }
  if (!category?.isActive) {
    throw createServiceError("Product category is unavailable");
  }
  if (!variant.isActive) {
    throw createServiceError("Variant is unavailable");
  }
  const stock = Number(variant.stock);
  if (stock <= 0) {
    throw createServiceError("Product is out of stock");
  }
  if (qty > stock) {
    throw createServiceError(`Only ${stock} available`);
  }
  return {
    variant,
    qty,
  };
};

export const getBuyNowCheckoutService = async (userId, variantId, quantity) => {
  const [wallet, addresses, validatedBuyNow, offerLookup] = await Promise.all([
    findWalletByUserId(userId),
    getAddressesService(userId),
    validateBuyNowService(variantId, quantity),
    buildActiveOfferLookup(),
  ]);

  const { variant, qty } = validatedBuyNow;
  const product = variant.productId;
  const pricing = getBestOfferPricing(product, variant, offerLookup);
  const originalPrice = Number(pricing.originalPrice);
  const finalPrice = Number(pricing.finalPrice);
  const discountAmount = Number(pricing.discountAmount);
  const originalSubtotal = originalPrice * qty;
  const subtotal = finalPrice * qty;
  const qualifiedCoupons = await getQualifiedCouponsService(subtotal);
  const totalDiscount = originalSubtotal - subtotal;
  const item = {
    product,
    variant,
    quantity: qty,
    status: "active",
    originalPrice,
    finalPrice,
    discountAmount,

    hasOffer: pricing.hasOffer,

    offerId: pricing.offerId,

    offerTitle: pricing.offerTitle,
    offerType: pricing.offerType,
    discountType: pricing.discountType,

    discountValue: pricing.discountValue,
    lineOriginalTotal: Number(originalSubtotal.toFixed(2)),

    lineTotal: Number(subtotal.toFixed(2)),
    lineDiscount: Number(totalDiscount.toFixed(2)),
  };

  const shipping = calculateShipping(subtotal);

  const total = subtotal + shipping;
  const walletBalance = Number(wallet?.balance || 0);

  const canUseWallet = walletBalance >= total;

  const gstAmount = calculateIncludedGst(subtotal, product.gstRate);

  return {
    canUseWallet,
    wallet,
    cart: {
      items: [item],
      invalid: false,

      originalSubtotal: Number(originalSubtotal.toFixed(2)),

      subtotal: Number(subtotal.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
    },

    addresses,
    originalSubtotal: Number(originalSubtotal.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    qualifiedCoupons,
    canApplyCoupon: qualifiedCoupons.length > 0,
    totalDiscount: Number(totalDiscount.toFixed(2)),

    shipping,
    total: Number(total.toFixed(2)),
    gstAmount: Number(gstAmount.toFixed(2)),
    invalidCart: false,
    message: null,
    isBuyNow: true,
    buyNow: {
      variantId: String(variant._id),
      quantity: qty,
    },
  };
};
