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

export const createOrderRepo = async (payload, session = null) => {
  if (session) {
    const [order] = await Order.create([payload], { session });

    return order;
  }

  return Order.create(payload);
};

export const findOrderByIdRepo = async (orderId) => {
  return await Order.findById(orderId);
};

export const findUserOrderById = async (
  orderId,
  userId,
  session = null,
) => {
  return Order.findOne({
    _id: orderId,
    userId,
  })
    .populate({
      path: "items.variantId",
    })
    .session(session);
};

export const saveOrder = (order) => {
  return order.save();
};

export const findOrderById = (orderId) => {
  return Order.findById(orderId).populate("items.variantId");
};

export const updateOrderItemStatus = (
  orderId,
  itemId,
  status,
) => {
  return Order.findOneAndUpdate(
    {
      _id: orderId,
      "items._id": itemId,
    },
    {
      $set: {
        "items.$.status": status,
        "items.$.statusUpdatedAt": new Date(),
      },
    },
    {
      returnDocument: "after",
    },
  );
};

export const findPendingRazorpayOrderRepo = async (
  orderId,
  userId,
) => {
  return Order.findOne({
    _id: orderId,
    userId,
    paymentMethod: "Razorpay",
    orderStatus: "Payment Pending",
    paymentStatus: {
      $ne: "Paid",
    },
  });
};

export const updateRazorpayOrderIdRepo = async (
  orderId,
  razorpayOrderId,
) => {
  return Order.findByIdAndUpdate(
    orderId,
    {
      $set: {
        razorpayOrderId,
        lastPaymentAttemptAt: new Date(),
      },
      $inc: {
        paymentAttempts: 1,
      },
    },
    {
      returnDocument: "after",
    },
  );
};

export const markRazorpayOrderPaidRepo = async ({
  orderId,
  userId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  return Order.findOneAndUpdate(
    {
      _id: orderId,
      userId,
      paymentMethod: "Razorpay",
      paymentStatus: {
        $in: ["Pending", "Failed"],
      },
      orderStatus: {
        $in: ["Payment Pending", "Payment Failed"],
      },
    },
    {
      $set: {
        paymentStatus: "Paid",
        orderStatus: "Placed",
        razorpayPaymentId,
        razorpaySignature,
        paymentFailure: undefined,
      },
    },
    {
      returnDocument: "after",
    },
  );
};

export const recordPaymentFailureRepo = async ({
  orderId,
  userId,
  paymentError,
}) => {
  return Order.findOneAndUpdate(
    {
      _id: orderId,
      userId,
      paymentMethod: "Razorpay",
      paymentStatus: "Pending",
      orderStatus: "Payment Pending",
    },
    {
      $set: {
        lastPaymentAttemptAt: new Date(),

        paymentFailure: {
          code:
            paymentError?.code ||
            undefined,

          description:
            paymentError?.description ||
            undefined,

          reason:
            paymentError?.reason ||
            undefined,

          source:
            paymentError?.source ||
            undefined,

          step:
            paymentError?.step ||
            undefined,
        },
      },
    },
    {
      returnDocument: "after",
    },
  );
};

export const deleteIncompletePendingOrderRepo = async (
  orderId,
  userId,
) => {
  return Order.deleteOne({
    _id: orderId,
    userId,
    paymentMethod: "Razorpay",
    paymentStatus: "Pending",
    orderStatus: "Payment Pending",

    $or: [
      {
        razorpayOrderId: {
          $exists: false,
        },
      },
      {
        razorpayOrderId: null,
      },
      {
        razorpayOrderId: "",
      },
    ],
  });
};

export const hasUserUsedCoupon = async ({
  userId,
  couponId,
}) => {
  const order = await Order.exists({
    userId,
    "coupon.couponId": couponId,

    orderStatus: {
      $nin: [
        "Cancelled",
        "Refunded",
      ],
    },

    $or: [
      {
        paymentMethod: "Razorpay",
        paymentStatus: "Paid",
      },

      {
        paymentMethod: "Wallet",
        paymentStatus: "Paid",
      },

      {
        paymentMethod: "CashOnDelivery",
        orderStatus: {
          $ne: "Payment Pending",
        },
      },
    ],
  });

  return Boolean(order);
};

