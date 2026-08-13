import mongoose from "mongoose";
import Order from "../../models/order.model.js";
import { calculateOrderStatus,canMarkCodPaid } from "../../utils/orderStatus.js";


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
        itemCount: { $size: "$items" },
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
        items: 1,
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
  const [
    totalOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
  ] = await Promise.all([
    Order.countDocuments({
      orderStatus: {
        $nin: [
          "Payment Pending",
          "Payment Expired",
        ],
      },
    }),

    Order.countDocuments({
      orderStatus:
        "Processing",
    }),

    Order.countDocuments({
      orderStatus:
        "Shipped",
    }),

    Order.countDocuments({
      orderStatus:
        "Delivered",
    }),
  ]);

  return {
    totalOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
  };
};

export const findOrderDetailById = async (orderId) => {
  return await Order.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(orderId),
      },
    },

    // user
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
        itemCount: { $size: "$items" },
      },
    },

    {
      $project: {
        orderNumber: 1,
        userId: 1,
        items: 1,
        paymentMethod: 1,
        paymentStatus: 1,
        orderStatus: 1,
        shippingAddress: 1,
        shippingFee: 1,
        subtotal: 1,
        total: 1,
        createdAt: 1,
        deliveredAt: 1,
        customer: {
          name: "$user.name",
          email: "$user.email",
          phone: "$user.phone",
        },
      },
    },
  ]);
};

export const updateOrderPaymentStatus = async (orderId, status) => {
  return await Order.findByIdAndUpdate(orderId, {
    paymentStatus: status
  });
};

export const updateItemStatus = async ({
  orderId,
  itemId,
  status,
}) => {

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  const item = order.items.id(itemId);

  if (!item) {
    throw new Error("Item not found");
  }

  const STATUS_FLOW = [
    "Processing",
    "Shipped",
    "Delivered",
  ];

  const LOCKED_STATUSES = [
  "Delivered",
  "Cancelled",
  "Return Requested",
  "Return Accepted",
  "Return Rejected",
  "Returned",
];

if (LOCKED_STATUSES.includes(item.status)) {
  const error = new Error(
    ["Return Requested", "Return Accepted", "Return Rejected", "Returned"].includes(item.status)
      ? "Return-related items must be managed from Return Management"
      : `${item.status} items cannot be modified`
  );
  throw error;
}

  if (
    status === "Cancelled" &&
    item.status !== "Processing"
  ) {
    throw new Error(
      "Only processing items can be cancelled"
    );
  }

  const currentIndex =
    STATUS_FLOW.indexOf(item.status);

  const nextIndex =
    STATUS_FLOW.indexOf(status);

  if (
    currentIndex !== -1 &&
    nextIndex !== -1 &&
    nextIndex <= currentIndex
  ) {
    throw new Error(
      "Status cannot be reversed"
    );
  }

  item.status = status;
  item.statusUpdatedAt = new Date();

  order.orderStatus =status

  await order.save();

  const showCodButton =
      order.paymentMethod === "CashOnDelivery" &&
      order.paymentStatus === "Pending" &&
      canMarkCodPaid(order.items);

  return {
    orderStatus: order.orderStatus,
    item,
    order,
    showCodButton
  };
};