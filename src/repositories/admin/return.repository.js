import mongoose from "mongoose";
import Return from "../../models/return.model.js";
import User from "../../models/user.model.js";

export const findReturns = async (limit, skip, filter, sortOrder, search) => {
  const pipeline = [
    {
      $match: filter,
    },

    {
      $lookup: {
        from: "orders",
        localField: "orderId",
        foreignField: "_id",
        as: "order",
      },
    },

    {
      $unwind: {
        path: "$order",
        preserveNullAndEmptyArrays: true,
      },
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
        returnedItem: {
          $first: {
            $filter: {
              input: "$order.items",
              as: "item",
              cond: {
                $eq: [{ $toString: "$$item._id" }, { $toString: "$itemId" }],
              },
            },
          },
        },
      },
    },
  ];

  if (search) {
    const orConditions = [
      {
        returnNumber: {
          $regex: search,
          $options: "i",
        },
      },
      {
        "order.orderNumber": {
          $regex: search,
          $options: "i",
        },
      },
      {
        "user.name": {
          $regex: search,
          $options: "i",
        },
      },
    ];

    if (mongoose.Types.ObjectId.isValid(search)) {
      orConditions.push({
        _id: new mongoose.Types.ObjectId(search),
      });
    }

    pipeline.push({
      $match: {
        $or: orConditions,
      },
    });
  }

  pipeline.push(
    {
      $project: {
        returnNumber: 1,
        orderNumber: "$order.orderNumber",
        customerName: "$user.name",
        productName: "$returnedItem.productName",
        color: "$returnedItem.color",
        size: "$returnedItem.size",
        refundAmount: 1,
        status: 1,
        requestedAt: 1,
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
  );

  return Return.aggregate(pipeline);
};

export const countReturns = async (filter, search) => {
  const pipeline = [
    {
      $match: filter,
    },

    {
      $lookup: {
        from: "orders",
        localField: "orderId",
        foreignField: "_id",
        as: "order",
      },
    },

    {
      $unwind: {
        path: "$order",
        preserveNullAndEmptyArrays: true,
      },
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
  ];

  if (search) {
    const orConditions = [
      {
        returnNumber: {
          $regex: search,
          $options: "i",
        },
      },
      {
        "order.orderNumber": {
          $regex: search,
          $options: "i",
        },
      },
      {
        "user.name": {
          $regex: search,
          $options: "i",
        },
      },
    ];

    if (mongoose.Types.ObjectId.isValid(search)) {
      orConditions.push({
        _id: new mongoose.Types.ObjectId(search),
      });
    }

    pipeline.push({
      $match: {
        $or: orConditions,
      },
    });
  }

  pipeline.push({
    $count: "total",
  });

  const result = await Return.aggregate(pipeline);

  return result[0]?.total || 0;
};

export const getReturnStats = async () => {
  const [totalReturns, requestedReturns, approvedReturns, refundedReturns] =
    await Promise.all([
      Return.countDocuments(),
      Return.countDocuments({ status: "Requested" }),
      Return.countDocuments({ status: "Approved" }),
      Return.countDocuments({ status: "Refunded" }),
    ]);

  return {
    totalReturns,
    requestedReturns,
    approvedReturns,
    refundedReturns,
  };
};

export const findReturnDetailById = async (returnId) => {
  const result = await Return.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(returnId) },
    },
    {
      $lookup: {
        from: "orders",
        localField: "orderId",
        foreignField: "_id",
        as: "order",
      },
    },
    { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

    {
      $addFields: {
        returnedItem: {
          $first: {
            $filter: {
              input: "$order.items",
              as: "item",
              cond: {
                $eq: [
                  { $toString: "$$item._id" },
                  { $toString: "$itemId" },
                ],
              },
            },
          },
        },
      },
    },
  ]);

  return result[0] || null;
};

export const findReturnById = async (returnId) => {
  return Return.findById(returnId);
};