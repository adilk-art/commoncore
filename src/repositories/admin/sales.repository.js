import Order from "../../models/order.model.js";

export const getSalesReportData = async ({
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
          $add: [
            "$offerDiscount",
            "$couponDiscount",
          ],
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

export const countSalesReportOrders = async ({
  startDate,
  endDate,
}) => {
  const result = await Order.aggregate([
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