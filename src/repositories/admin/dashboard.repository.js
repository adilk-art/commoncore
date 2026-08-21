import Order from "../../models/order.model.js";
import User from "../../models/user.model.js";
import Product from "../../models/product.model.js";

const validSalesStages = [
  {
    $match: {
      orderStatus: {
        $nin: ["Payment Pending", "Payment Expired"],
      },
    },
  },
  {
    $unwind: "$items",
  },
  {
    $match: {
      "items.status": {
        $nin: ["Cancelled", "Refunded"],
      },
    },
  },
  {
    $addFields: {
      itemSalesAmount: {
        $max: [
          {
            $subtract: [
              {
                $multiply: ["$items.unitPrice", "$items.quantity"],
              },
              {
                $ifNull: ["$items.couponDiscountAmount", 0],
              },
            ],
          },
          0,
        ],
      },
    },
  },
];

export const getDashboardSalesStats = async () => {
  return Order.aggregate([
    ...validSalesStages,
    {
      $group: {
        _id: null,

        totalSales: {
          $sum: "$itemSalesAmount",
        },

        orderIds: {
          $addToSet: "$_id",
        },
      },
    },
    {
      $project: {
        _id: 0,

        totalSales: 1,

        totalOrders: {
          $size: "$orderIds",
        },
      },
    },
  ]);
};

export const getTotalCustomers = async () => {
  return User.countDocuments();
};

export const getTotalProducts = async () => {
  return Product.countDocuments();
};

export const getMonthlySales = async (year) => {
  const startDate = new Date(year, 0, 1, 0, 0, 0, 0);

  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

  return Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },

        orderStatus: {
          $nin: ["Payment Pending", "Payment Expired"],
        },
      },
    },
    {
      $unwind: "$items",
    },
    {
      $match: {
        "items.status": {
          $nin: ["Cancelled", "Refunded"],
        },
      },
    },
    {
      $addFields: {
        itemSalesAmount: {
          $max: [
            {
              $subtract: [
                {
                  $multiply: ["$items.unitPrice", "$items.quantity"],
                },
                {
                  $ifNull: ["$items.couponDiscountAmount", 0],
                },
              ],
            },
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id: {
          $month: "$createdAt",
        },

        sales: {
          $sum: "$itemSalesAmount",
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);
};

export const getYearlySales = async () => {
  return Order.aggregate([
    ...validSalesStages,
    {
      $group: {
        _id: {
          $year: "$createdAt",
        },

        sales: {
          $sum: "$itemSalesAmount",
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);
};

export const getWeeklySales = async () => {
  const endDate = new Date();

  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date();

  startDate.setDate(startDate.getDate() - 6);

  startDate.setHours(0, 0, 0, 0);

  return Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },

        orderStatus: {
          $nin: ["Payment Pending", "Payment Expired"],
        },
      },
    },

    {
      $unwind: "$items",
    },

    {
      $match: {
        "items.status": {
          $nin: ["Cancelled", "Refunded"],
        },
      },
    },

    {
      $addFields: {
        itemSalesAmount: {
          $max: [
            {
              $subtract: [
                {
                  $multiply: ["$items.unitPrice", "$items.quantity"],
                },

                {
                  $ifNull: ["$items.couponDiscountAmount", 0],
                },
              ],
            },
            0,
          ],
        },
      },
    },

    {
      $group: {
        _id: {
          year: {
            $year: "$createdAt",
          },

          month: {
            $month: "$createdAt",
          },

          day: {
            $dayOfMonth: "$createdAt",
          },
        },

        sales: {
          $sum: "$itemSalesAmount",
        },
      },
    },

    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
        "_id.day": 1,
      },
    },
  ]);
};

export const getTopSellingProducts = async () => {
  return Order.aggregate([
    {
      $match: {
        orderStatus: {
          $nin: ["Payment Pending", "Payment Expired"],
        },
      },
    },
    {
      $unwind: "$items",
    },
    {
      $match: {
        "items.status": {
          $nin: ["Cancelled", "Refunded"],
        },
      },
    },
    {
      $group: {
        _id: "$items.productId",
        productName: {
          $first: "$items.productName",
        },
        quantitySold: {
          $sum: "$items.quantity",
        },
      },
    },
    {
      $sort: {
        quantitySold: -1,
      },
    },
    {
      $limit: 10,
    },
    {
      $project: {
        _id: 0,
        productId: "$_id",
        productName: 1,
        quantitySold: 1,
      },
    },
  ]);
};

export const getTopSellingCategories = async () => {
  return Order.aggregate([
    {
      $match: {
        orderStatus: {
          $nin: ["Payment Pending", "Payment Expired"],
        },
      },
    },
    {
      $unwind: "$items",
    },
    {
      $match: {
        "items.status": {
          $nin: ["Cancelled", "Refunded"],
        },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: "$product",
    },
    {
      $lookup: {
        from: "categories",
        localField: "product.categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: "$category",
    },
    {
      $group: {
        _id: "$category._id",
        categoryName: {
          $first: "$category.name",
        },
        quantitySold: {
          $sum: "$items.quantity",
        },
      },
    },
    {
      $sort: {
        quantitySold: -1,
      },
    },
    {
      $limit: 10,
    },
    {
      $project: {
        _id: 0,
        categoryId: "$_id",
        categoryName: 1,
        quantitySold: 1,
      },
    },
  ]);
};

export const getTopSellingVariants = async () => {
  return Order.aggregate([
    {
      $match: {
        orderStatus: {
          $nin: ["Payment Pending", "Payment Expired"],
        },
      },
    },
    {
      $unwind: "$items",
    },
    {
      $match: {
        "items.status": {
          $nin: ["Cancelled", "Refunded"],
        },
      },
    },
    {
      $group: {
        _id: "$items.variantId",
        productName: {
          $first: "$items.productName",
        },
        size: {
          $first: "$items.size",
        },
        color: {
          $first: "$items.color",
        },
        quantitySold: {
          $sum: "$items.quantity",
        },
      },
    },
    {
      $sort: {
        quantitySold: -1,
      },
    },
    {
      $limit: 10,
    },
    {
      $project: {
        _id: 0,
        variantId: "$_id",
        productName: 1,
        size: 1,
        color: 1,
        quantitySold: 1,
      },
    },
  ]);
};
