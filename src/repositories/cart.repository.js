import Cart from "../models/cart.model.js";
import Variant from "../models/variant.model.js";

export const findCartByUserId = async (userId) => {
  return Cart.findOne({ userId });
};

export const findCartWithDetailsByUserId = async (userId) => {
  return Cart.findOne({ userId }).populate({
    path: "items.variantId",
    populate: {
      path: "productId",
      populate: {
        path: "categoryId",
      },
    },
  });
};

export const createCart = async (userId, item) => {
  return Cart.create({
    userId,
    items: [item],
  });
};

export const saveCart = async (cart) => {
  return cart.save();
};

export const deleteCartItem = async (cart, itemId) => {
  cart.items.pull(itemId);
  return cart.save();
};

export const findPurchasableVariants = async (productId) => {
  return Variant.find({
    productId,
    isActive: true,
    stock: { $gt: 0 },
  })
    .populate({
      path: "productId",
      populate: {
        path: "categoryId",
      },
    })
    .sort({
      isDefault: -1,
      createdAt: 1,
    });
};

export const clearCart = async (userId) => {
  return Cart.findOneAndUpdate(
    { userId },
    {
      $set: {
        items: [],
      },
    },
    {
      returnDocument: "after",
    },
  );
};
export const findPurchasableVariantById = async (
  variantId,
) => {
  return Variant.findById(variantId).populate({
    path: "productId",
    populate: {
      path: "categoryId",
    },
  });
};