import Variant from "../../models/variant.model.js";
import Product from "../../models/product.model.js";

import {
  findCartByUserId,
  findCartWithDetailsByUserId,
  createCart,
  saveCart,
  deleteCartItem,
  findPurchasableVariants,
} from "../../repositories/cart.repository.js";
import { addToWishlistService } from "./wishlist.service.js";
import {
  buildActiveOfferLookup,
  getBestOfferPricing,
} from "../shared/pricing.service.js";
import { findPurchasableVariantById } from "../../repositories/cart.repository.js";
const MAX_QTY = 5;

const getIdString = (value) => {
  if (!value) return "";

  return String(value._id ?? value);
};

export const addToCartService = async ({ userId, variantId, quantity = 1 }) => {
  const qty = Number(quantity);

  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
    const error = new Error(`Quantity must be between 1 and ${MAX_QTY}`);

    error.status = 400;
    throw error;
  }

  const variant = await findPurchasableVariantById(variantId);

  if (!variant) {
    const error = new Error("Variant not found");
    error.status = 404;
    throw error;
  }

  const product = variant.productId;
  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  if (!product.isActive) {
    const error = new Error("Product is unavailable");
    error.status = 400;
    throw error;
  }

  if (!product.categoryId?.isActive) {
    const error = new Error("Category is unavailable");
    error.status = 400;
    throw error;
  }

  if (!variant.isActive) {
    const error = new Error("Variant is unavailable");
    error.status = 400;
    throw error;
  }

  const stock = Number(variant.stock);
  if (stock <= 0) {
    const error = new Error("Product is out of stock");
    error.status = 400;
    throw error;
  }

  if (qty > stock) {
    const error = new Error(`Only ${stock} available`);
    error.status = 400;
    throw error;
  }

  let cart = await findCartByUserId(userId);

  if (!cart) {
    return createCart(userId, {
      variantId: variant._id,
      quantity: qty,
    });
  }

  const existingItem = cart.items.find(
    (item) => String(item.variantId) === String(variant._id),
  );

  if (existingItem) {
    const newQuantity = Number(existingItem.quantity) + qty;
    if (newQuantity > MAX_QTY) {
      const error = new Error(`Maximum ${MAX_QTY} items allowed`);
      error.status = 400;
      throw error;
    }

    if (newQuantity > stock) {
      const error = new Error(`Only ${stock} available`);
      error.status = 400;
      throw error;
    }

    existingItem.quantity = newQuantity;
  } else {
    cart.items.push({
      variantId: variant._id,
      quantity: qty,
    });
  }

  return saveCart(cart);
};

export const getCartService = async (userId) => {
  const cart = await findCartWithDetailsByUserId(userId);

  if (!cart) {
    return {
      items: [],
      invalid: false,
      subtotal: 0,
      originalSubtotal: 0,
      totalDiscount: 0,
    };
  }

  const offerLookup = await buildActiveOfferLookup();
  let subtotal = 0;
  let originalSubtotal = 0;
  let totalDiscount = 0;
  let invalid = false;

  const items = cart.items.map((item) => {
    const variant = item.variantId;
    const product = variant?.productId;
    let status = "active";
    let message = "";
    if (!variant || !product) {
      status = "removed";
      message = "Unavailable";
    } else if (!product.categoryId?.isActive) {
      status = "blocked";
      message = "Category unavailable";
    } else if (!product.isActive) {
      status = "blocked";
      message = "Product unavailable";
    } else if (!variant.isActive) {
      status = "blocked";
      message = "Variant unavailable";
    } else if (variant.stock <= 0) {
      status = "out";
      message = "Out of stock";
    } else if (item.quantity > variant.stock) {
      status = "limit";
      message = `Only ${variant.stock} available`;
    }

    let pricing = {
      originalPrice: Number(variant?.price || 0),
      finalPrice: Number(variant?.price || 0),
      discountAmount: 0,
      hasOffer: false,
      offerId: null,
      offerTitle: null,
      offerType: null,
      discountType: null,
      discountValue: null,
      maxDiscountAmount: null,
    };

    if (variant && product) {
      pricing = getBestOfferPricing(product, variant, offerLookup);
    }

    const quantity = Number(item.quantity);
    const lineOriginalTotal = pricing.originalPrice * quantity;
    const lineTotal = pricing.finalPrice * quantity;
    const lineDiscount = lineOriginalTotal - lineTotal;
    if (status === "active") {
      originalSubtotal += lineOriginalTotal;
      subtotal += lineTotal;
      totalDiscount += lineDiscount;
    } else {
      invalid = true;
    }
    return {
      _id: item._id,
      quantity,
      variant,
      product,
      status,
      message,
      originalPrice: pricing.originalPrice,
      finalPrice: pricing.finalPrice,
      discountAmount: pricing.discountAmount,
      hasOffer: pricing.hasOffer,
      offerId: pricing.offerId,
      offerTitle: pricing.offerTitle,
      offerType: pricing.offerType,
      discountType: pricing.discountType,
      discountValue: pricing.discountValue,
      maxDiscountAmount: pricing.maxDiscountAmount,
      lineOriginalTotal,
      lineTotal,
      lineDiscount,
    };
  });

  return {
    items,
    invalid,
    subtotal: Number(subtotal.toFixed(2)),
    originalSubtotal: Number(originalSubtotal.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
  };
};

export const updateCartQuantityService = async ({
  userId,
  itemId,
  action,
}) => {
  const cart = await findCartByUserId(userId);

  if (!cart) {
    throw new Error("Cart not found");
  }

  const item = cart.items.id(itemId);

  if (!item) {
    throw new Error("Item not found");
  }

  const variant = await Variant.findById(item.variantId).populate({
    path: "productId",
    populate: {
      path: "categoryId",
    },
  });

  const product = variant?.productId;

  if (!variant || !product) {
    throw new Error("Item unavailable");
  }

  if (!product.categoryId?.isActive) {
    throw new Error("Category unavailable");
  }

  if (!product.isActive) {
    throw new Error("Product unavailable");
  }

  if (!variant.isActive) {
    throw new Error("Variant unavailable");
  }

  if (!["increase", "decrease"].includes(action)) {
    throw new Error("Invalid action");
  }

  let quantity = Number(item.quantity);
  const stock = Number(variant.stock);

  if (action === "increase") {
    if (stock <= 0) {
      throw new Error("Out of stock");
    }

    if (quantity >= MAX_QTY) {
      throw new Error(`Maximum ${MAX_QTY} items allowed`);
    }

    if (quantity >= stock) {
      throw new Error(`Only ${stock} available`);
    }

    quantity += 1;
  }

  if (action === "decrease") {
    if (quantity <= 1) {
      throw new Error("Minimum quantity is 1");
    }

    quantity -= 1;
  }

  item.quantity = quantity;

  await saveCart(cart);

  const updatedCart = await getCartService(userId);

  const updatedItem = updatedCart.items.find(
    (cartItem) => String(cartItem._id) === String(itemId),
  );

  if (!updatedItem) {
    throw new Error("Updated item not found");
  }

  const shipping =
    updatedCart.subtotal >= 999
      ? 0
      : updatedCart.subtotal > 0
        ? 99
        : 0;

  const total = updatedCart.subtotal + shipping;

  return {
    success: true,
    message: "Cart updated",
    item: {
      itemId: updatedItem._id,
      quantity: updatedItem.quantity,
      stock: Number(updatedItem.variant.stock),
      lineTotal: updatedItem.lineTotal,
      canIncrease:
        updatedItem.quantity < MAX_QTY &&
        updatedItem.quantity < Number(updatedItem.variant.stock),
      canDecrease: updatedItem.quantity > 1,
    },
    summary: {
      subtotal: updatedCart.subtotal,
      totalDiscount: updatedCart.totalDiscount,
      shipping,
      total,
    },
  };
};
export const removeCartItemService = async ({ userId, itemId }) => {
  const cart = await findCartByUserId(userId);
  cart.items.pull(itemId);
  await saveCart(cart);
};

export const moveCartItemToWishlistService = async ({ userId, itemId }) => {
  const cart = await findCartByUserId(userId);
  if (!cart) {
    throw new Error("Cart not found");
  }
  const item = cart.items.id(itemId);

  if (!item) {
    throw new Error("Item not found");
  }
  const variant = await Variant.findById(item.variantId);

  if (!variant) {
    throw new Error("Variant not found");
  }

  await addToWishlistService({
    userId,
    productId: variant.productId,
  });
  cart.items.pull(itemId);
  await saveCart(cart);

  return {
    success: true,
    message: "Moved to wishlist",
  };
};

export const getCartVariantsService = async (productId) => {
  const variants = await findPurchasableVariants(productId);
  return variants;
};
