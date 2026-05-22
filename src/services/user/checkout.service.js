import { findActiveVariant } from "../../repositories/checkout.repository.js";
import { getAddressesService } from "./address.service.js";
import { getCartService } from "./cart.service.js";

export const getCheckoutPageService = async (userId) => {
  const cart = await getCartService(userId);

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart empty");
  }

  const addresses = await getAddressesService(userId);
  const shipping = cart.subtotal >= 999 ? 0 : 99;
  const total = cart.subtotal + shipping;

  return { cart, addresses, shipping, total };
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

  return {
    cart: { items: [item], subtotal },
    addresses,
    shipping,
    total,
    isBuyNow: true,
    buyNow: { variantId, quantity: qty },
  };
};
