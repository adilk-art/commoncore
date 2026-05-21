import Cart from "../models/cart.model.js";
import Variant from "../models/variant.model.js";

export const findCartByUserId = async (userId) => {
  return await Cart.findOne({ userId });
};

export const createCart = async (userId, item) => {
  return await Cart.create({
    userId,
    items: [item],
  });
};

export const saveCart = async (cart) => {
  return await cart.save();
};
export const deleteCartItem = async (cart, itemId) => {
  cart.items.pull(itemId);
  return await cart.save();
};

export const findPurchasableVariants = async (
  productId,
) => {

  return await Variant.find({
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