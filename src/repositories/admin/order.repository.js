import Order from "../../models/order.model.js";

export const findOrders = async (limit, skip, filter, sortOrder) => {
  return await Order.aggregate([
    {
      $match: filter,
    },

    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },

    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $addFields: {
        itemCount: {
          $size: "$items",
        },
      },
    },

    {
      $project: {
        orderNumber: 1,
        total: 1,
        paymentMethod: 1,
        paymentStatus: 1,
        orderStatus: 1,
        createdAt: 1,
        itemCount: 1,
        customerName: "$user.name",
      },
    },

    {
      $sort: sortOrder,
    },

    {
      $skip: skip,
    },

    {
      $limit: limit,
    },
  ]);
};

export const countOrders = async (filter) => {
  return await Order.countDocuments(filter);
};

export const getOrderStats = async () => {
  const [totalOrders, processingOrders, shippedOrders, deliveredOrders] =
    await Promise.all([
      Order.countDocuments(),

      Order.countDocuments({
        orderStatus: "Processing",
      }),

      Order.countDocuments({
        orderStatus: "Shipped",
      }),

      Order.countDocuments({
        orderStatus: "Delivered",
      }),
    ]);

  return {
    totalOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
  };
};
