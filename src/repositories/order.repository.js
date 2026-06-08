import Order from "../models/order.model.js";

export const createOrderRepo = async (payload) => {
  const order = await Order.create(payload);
  return order;
};

export const findOrderByIdRepo = async (orderId) => {
  return await Order.findById(orderId);
};

export const findUserOrderById = async (orderId, userId) => {
  return Order.findOne({
    _id: orderId,
    userId,
  }).populate({
    path: "items.variantId",
  });
};

export const saveOrder = (order) => {
  return order.save();
};

export const findOrderById = (orderId) => {
  return Order.findById(orderId).populate("items.variantId");
};
