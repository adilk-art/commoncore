import { findActiveVariant } from "../../repositories/checkout.repository.js";
import { getAddressesService } from "./address.service.js";
import { getCartService } from "./cart.service.js";

export const getCheckoutPageService = async (userId) => {
  const cart = await getCartService(userId);

  if (!cart || cart.items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const invalidCart = cart.invalid;

  const message = invalidCart
    ? "Some items in your cart are unavailable. Please review your cart."
    : null;

  const addresses = await getAddressesService(userId);

  const gstAmount = cart.items.reduce((total, item) => {
    const itemSubtotal = item.variant.price * item.quantity;    
    const gstRate = item.product.gstRate; 
    const taxableValue = itemSubtotal / (1 + gstRate / 100);
    const itemGst = itemSubtotal - taxableValue;
    return total + itemGst;
  }, 0);


  const shipping = cart.subtotal >= 999 ? 0 : 99;
  const total = cart.subtotal + shipping;

  return {
    cart,
    addresses,
    gstAmount: Number(gstAmount.toFixed(2)),
    shipping,
    total,
    invalidCart,
    message,
    isBuyNow: false,
    buyNow: null,
  };
};

export const validateBuyNowService = async (variantId, quantity) => {
  const qty = parseInt(quantity);
  if (!qty || qty < 1 || qty > 5) {
    throw new Error("Invalid quantity");
  }
  const variant = await findActiveVariant(variantId);
  if (!variant) throw new Error("Product not found");

  if (variant.stock < qty) throw new Error("Insufficient stock");

  return { variant, qty };
};

export const getBuyNowCheckoutService = async (userId, variantId, quantity) => {
  const { variant, qty } = await validateBuyNowService(variantId, quantity);

  const product = variant.productId;
  if (!product) throw new Error("Product not found");

  const item = {
    product,
    variant,
    quantity: qty,
    price: variant.price,
    subtotal: variant.price * qty,
  };

  const subtotal = item.subtotal;
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  const addresses = await getAddressesService(userId);

  const gstAmount = [item].reduce((total, item) => {
  const gstRate = item.product.gstRate || 0;
  const taxableValue =
    item.subtotal / (1 + gstRate / 100);
  return total + (item.subtotal - taxableValue);
}, 0);


  return {
    cart: {
      items: [item],
      subtotal,
    },
    addresses,
    shipping,
    total,
    gstAmount: Number(gstAmount.toFixed(2)),

    invalidCart: false,
    message: null,

    isBuyNow: true,
    buyNow: {
      variantId,
      quantity: qty,
    },
  };
};
