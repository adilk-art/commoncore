import Variant from "../../models/variant.model.js";
import Product from "../../models/product.model.js";

import {
  findCartByUserId,
  createCart,
  saveCart,
  deleteCartItem,
  findPurchasableVariants
  
} from "../../repositories/cart.repository.js";
import { addToWishlistService } from "./wishlist.service.js";

const MAX_QTY = 5;

export const addToCartService = async ({
  userId,
  variantId,
  quantity,
}) => {

  const variant = await Variant.findById(variantId)
    .populate("productId");

  if (!variant) {
    throw new Error("Variant not found");
  }

  const product = variant.productId;

  if (!product) {
    throw new Error("Product not found");
  }

  if (product.isBlocked) {
    throw new Error("Product unavailable");
  }

  if (!variant.isActive) {
    throw new Error("Variant unavailable");
  }

  if (variant.stock <= 0) {
    throw new Error("Out of stock");
  }

  quantity = Number(quantity);

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Invalid quantity");
  }

  let cart = await findCartByUserId(userId);

  if (!cart) {
    if (quantity > MAX_QTY) {
      throw new Error(`Maximum ${MAX_QTY} allowed per product`);
    }

    if (quantity > variant.stock) {
      throw new Error(`Only ${variant.stock} available in stock`);
    }

    cart = await createCart(userId, {
      variantId,
      quantity,
    });

    return {
      success: true,
      message: "Added to cart",
    };
  }

  const existingItem = cart.items.find(
    item =>
      item.variantId.toString() === variantId.toString()
  );

  if (existingItem) {

    const newQty = existingItem.quantity + quantity;

    if (newQty > MAX_QTY) {
      throw new Error(
        `You already have ${existingItem.quantity} of this item in your cart. Maximum ${MAX_QTY} allowed per product`
      );
    }

    if (newQty > variant.stock) {
      throw new Error(
        `You already have ${existingItem.quantity} of this item in your cart, only ${variant.stock} available in stock`
      );
    }

    existingItem.quantity = newQty;

  } else {

    if (quantity > MAX_QTY) {
      throw new Error(`Maximum ${MAX_QTY} allowed per product`);
    }

    if (quantity > variant.stock) {
      throw new Error(`Only ${variant.stock} available in stock`);
    }

    cart.items.push({
      variantId,
      quantity,
    });
  }

 await saveCart(cart);

  return {
    success: true,
    message: "Added to cart",
  };
};


export const getCartService = async (userId) => {

  const cart = await findCartByUserId(userId);
  if (!cart) {
    return {
      items: [],
      invalid: false,
      subtotal: 0,
    };
  }

  await cart.populate({
    path: "items.variantId",
    populate: {
      path: "productId",
      populate: {
        path: "categoryId",
      },
    },
  });
  let subtotal = 0;
  let invalid = false;

  const items = cart.items.map(item => {

    const variant = item.variantId;
    const product = variant?.productId;

    let status = "active";
    let message = "";

    if (!variant || !product) {
      status = "removed";
      message = "Unavailable";
    }
    else if (!product.categoryId?.isActive) {
    status = "blocked";
    message = "Category unavailable";
  }

    else if (!product.isActive) {
      status = "blocked";
      message = "Product unavailable";
    }

    else if (!variant.isActive) {
      status = "blocked";
      message = "Variant unavailable";
    }

    else if (variant.stock <= 0) {
      status = "out";
      message = "Out of stock";
    }

    else if (item.quantity > variant.stock) {
      status = "limit";
      message = `Only ${variant.stock} available`;
    }

    if (status === "active") {
      subtotal += variant.price * item.quantity;
    } else {
      invalid = true;
    }

    return {
      _id: item._id,
      quantity: item.quantity,
      variant,
      product,
      status,
      message,
    };
  });

  return {
    items,
    invalid,
    subtotal,
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

  await cart.populate({
    path: "items.variantId",
    populate: {
      path: "productId",
    },
  });

  const item = cart.items.id(itemId);

  if (!item) {
    throw new Error("Item not found");
  }

  const variant = item.variantId;
  const product = variant?.productId;

  if (!variant || !product) {
    throw new Error("Unavailable");
  }

  if (product.isBlocked) {
    throw new Error("Product unavailable");
  }

  if (!variant.isActive) {
    throw new Error("Variant unavailable");
  }

  if (!["increase", "decrease"].includes(action)) {
    throw new Error("Invalid action");
  }

  let qty = Number(item.quantity);
  const stock = Number(variant.stock);

  if (action === "increase") {

    if (stock <= 0) {
      throw new Error("Out of stock");
    }

    if (qty >= MAX_QTY) {
      throw new Error(`Maximum ${MAX_QTY} items allowed`);
    }

    if (qty >= stock) {
      throw new Error(`Only ${stock} available`);
    }

    qty++;

  } else if (action === "decrease") {

    if (qty <= 1) {
      throw new Error("Minimum 1");
    }

    qty--;
  }

  item.quantity = qty;

  await saveCart(cart);

  return {
    success: true,
  };
};

export const removeCartItemService = async ({
  userId,
  itemId,
}) => {

  const cart = await findCartByUserId(userId);

  cart.items.pull(itemId);

  await saveCart(cart);
};

export const moveCartItemToWishlistService =
  async ({
    userId,
    itemId,
  }) => {

    const cart =
      await findCartByUserId(userId);

    if (!cart) {
      throw new Error("Cart not found");
    }

    const item =
      cart.items.id(itemId);

    if (!item) {
      throw new Error("Item not found");
    }

    const variant =
      await Variant.findById(
        item.variantId,
      );

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

export const getCartVariantsService = async (
  productId,
) => {

  const variants =
    await findPurchasableVariants(productId);

  return variants;

};