import Cart from "../models/cart.model.js";

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