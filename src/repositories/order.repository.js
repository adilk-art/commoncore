import Order from "../models/order.model.js";


export const findOrdersByUser = async ({
  userId,
  search = "",
  page = 1,
  limit = 10,
}) => {

  const query = {
    userId,
  };

  if (search) {
    query.orderNumber = {
      $regex: search,
      $options: "i",
    };
  }

  const skip = (page - 1) * limit;

  const [orders, totalOrders] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Order.countDocuments(query),
  ]);

  return {
    orders,
    totalOrders,
  };
};

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
