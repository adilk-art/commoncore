import Order from "../../models/order.model.js";

const salesMatch = (startDate, endDate) => ({
  createdAt: {
    $gte: startDate,
    $lte: endDate,
  },
  orderStatus: {
    $nin: ["Payment Pending", "Payment Expired"],
  },
});

const salesItemMatch = {
  "items.status": {
    $nin: ["Cancelled", "Refunded"],
  },
};

const salesAmountStages = [
  {
    $addFields: {
      itemOriginalAmount: {
        $multiply: ["$items.originalUnitPrice", "$items.quantity"],
      },
      itemOfferAmount: {
        $multiply: ["$items.unitPrice", "$items.quantity"],
      },
      itemCouponDiscount: {
        $ifNull: ["$items.couponDiscountAmount", 0],
      },
    },
  },
  {
    $addFields: {
      itemOfferDiscount: {
        $max: [
          {
            $subtract: ["$itemOriginalAmount", "$itemOfferAmount"],
          },
          0,
        ],
      },
      itemNetAmount: {
        $max: [
          {
            $subtract: ["$itemOfferAmount", "$itemCouponDiscount"],
          },
          0,
        ],
      },
    },
  },
];

const userLookupStages = [
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
];

export const getSalesReportData = async ({ startDate, endDate }) => {
  return await Order.aggregate([
    {
      $match: salesMatch(startDate, endDate),
    },

    {
      $unwind: "$items",
    },

    {
      $match: salesItemMatch,
    },

    ...salesAmountStages,

    {
      $group: {
        _id: null,

        grossSales: {
          $sum: "$itemOriginalAmount",
        },

        offerDiscount: {
          $sum: "$itemOfferDiscount",
        },

        couponDiscount: {
          $sum: "$itemCouponDiscount",
        },

        netSales: {
          $sum: "$itemNetAmount",
        },

        salesQuantity: {
          $sum: "$items.quantity",
        },

        orderIds: {
          $addToSet: "$_id",
        },
      },
    },

    {
      $project: {
        _id: 0,

        grossSales: 1,
        offerDiscount: 1,
        couponDiscount: 1,
        netSales: 1,
        salesQuantity: 1,

        totalDiscount: {
          $add: ["$offerDiscount", "$couponDiscount"],
        },

        orderCount: {
          $size: "$orderIds",
        },
      },
    },
  ]);
};

export const getSalesReportRows = async ({
  startDate,
  endDate,
  skip,
  limit,
}) => {
  return await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
        orderStatus: {
          $nin: [
            "Payment Pending",
            "Payment Expired",
          ],
        },
      },
    },

    // Get the user who placed the order
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },

    // user is an array after $lookup
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $unwind: "$items",
    },

    {
      $match: {
        "items.status": {
          $nin: [
            "Cancelled",
            "Refunded",
          ],
        },
      },
    },

    {
      $addFields: {
        itemOriginalAmount: {
          $multiply: [
            "$items.originalUnitPrice",
            "$items.quantity",
          ],
        },

        itemOfferAmount: {
          $multiply: [
            "$items.unitPrice",
            "$items.quantity",
          ],
        },

        itemCouponDiscount: {
          $ifNull: [
            "$items.couponDiscountAmount",
            0,
          ],
        },
      },
    },

    {
      $addFields: {
        itemOfferDiscount: {
          $max: [
            {
              $subtract: [
                "$itemOriginalAmount",
                "$itemOfferAmount",
              ],
            },
            0,
          ],
        },

        itemNetAmount: {
          $max: [
            {
              $subtract: [
                "$itemOfferAmount",
                "$itemCouponDiscount",
              ],
            },
            0,
          ],
        },
      },
    },

    {
      $group: {
        _id: "$_id",

        orderNumber: {
          $first: "$orderNumber",
        },

        createdAt: {
          $first: "$createdAt",
        },

        // Username from Users collection
        userName: {
          $first: {
            $ifNull: [
              "$user.name",
              "Unknown User",
            ],
          },
        },

        // Payment method directly from Order
        paymentMethod: {
          $first: "$paymentMethod",
        },

        itemsSold: {
          $sum: "$items.quantity",
        },

        grossAmount: {
          $sum: "$itemOriginalAmount",
        },

        offerDiscount: {
          $sum: "$itemOfferDiscount",
        },

        couponDiscount: {
          $sum: "$itemCouponDiscount",
        },

        netAmount: {
          $sum: "$itemNetAmount",
        },
      },
    },

    {
      $addFields: {
        totalDiscount: {
          $add: [
            "$offerDiscount",
            "$couponDiscount",
          ],
        },
      },
    },

    {
      $sort: {
        createdAt: -1,
      },
    },

    {
      $skip: skip,
    },

    {
      $limit: limit,
    },

    {
      $project: {
        _id: 0,
        orderNumber: 1,
        createdAt: 1,
        userName: 1,
        paymentMethod: 1,
        itemsSold: 1,
        grossAmount: 1,
        offerDiscount: 1,
        couponDiscount: 1,
        totalDiscount: 1,
        netAmount: 1,
      },
    },
  ]);
};

export const countSalesReportOrders = async ({ startDate, endDate }) => {
  const result = await Order.aggregate([
    {
      $match: salesMatch(startDate, endDate),
    },

    {
      $unwind: "$items",
    },

    {
      $match: salesItemMatch,
    },

    {
      $group: {
        _id: "$_id",
      },
    },

    {
      $count: "count",
    },
  ]);

  return result[0]?.count || 0;
};

export const getSalesReportExportRows = async ({
  startDate,
  endDate,
}) => {
  return await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
        orderStatus: {
          $nin: [
            "Payment Pending",
            "Payment Expired",
          ],
        },
      },
    },

    // Get user information
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
      $unwind: "$items",
    },

    {
      $match: {
        "items.status": {
          $nin: [
            "Cancelled",
            "Refunded",
          ],
        },
      },
    },

    {
      $addFields: {
        itemOriginalAmount: {
          $multiply: [
            "$items.originalUnitPrice",
            "$items.quantity",
          ],
        },

        itemOfferAmount: {
          $multiply: [
            "$items.unitPrice",
            "$items.quantity",
          ],
        },

        itemCouponDiscount: {
          $ifNull: [
            "$items.couponDiscountAmount",
            0,
          ],
        },
      },
    },

    {
      $addFields: {
        itemOfferDiscount: {
          $max: [
            {
              $subtract: [
                "$itemOriginalAmount",
                "$itemOfferAmount",
              ],
            },
            0,
          ],
        },

        itemNetAmount: {
          $max: [
            {
              $subtract: [
                "$itemOfferAmount",
                "$itemCouponDiscount",
              ],
            },
            0,
          ],
        },
      },
    },

    {
      $group: {
        _id: "$_id",

        orderNumber: {
          $first: "$orderNumber",
        },

        createdAt: {
          $first: "$createdAt",
        },

        userName: {
          $first: {
            $ifNull: [
              "$user.name",
              "Unknown User",
            ],
          },
        },

        paymentMethod: {
          $first: "$paymentMethod",
        },

        itemsSold: {
          $sum: "$items.quantity",
        },

        grossAmount: {
          $sum: "$itemOriginalAmount",
        },

        offerDiscount: {
          $sum: "$itemOfferDiscount",
        },

        couponDiscount: {
          $sum: "$itemCouponDiscount",
        },

        netAmount: {
          $sum: "$itemNetAmount",
        },
      },
    },

    {
      $addFields: {
        totalDiscount: {
          $add: [
            "$offerDiscount",
            "$couponDiscount",
          ],
        },
      },
    },

    {
      $sort: {
        createdAt: -1,
      },
    },

    {
      $project: {
        _id: 0,
        orderNumber: 1,
        createdAt: 1,
        userName: 1,
        paymentMethod: 1,
        itemsSold: 1,
        grossAmount: 1,
        offerDiscount: 1,
        couponDiscount: 1,
        totalDiscount: 1,
        netAmount: 1,
      },
    },
  ]);
};
