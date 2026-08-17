import Coupon from "../models/coupon.model.js";

export const findCouponByCode = async (code) => {
  return Coupon.findOne({
    code: code.toUpperCase(),
  });
};

export const findAvailableCouponsForCheckout = async () => {
  const now = new Date();

  return Coupon.find({
    isActive: true,

    validFrom: {
      $lte: now,
    },

    validUntil: {
      $gte: now,
    },

    $or: [
      {
        usageLimit: null,
      },
      {
        usageLimit: {
          $exists: false,
        },
      },
      {
        $expr: {
          $lt: [
            {
              $ifNull: ["$usedCount", 0],
            },
            "$usageLimit",
          ],
        },
      },
    ],
  })
    .sort({
      minimumPurchaseAmount: 1,
    })
    .lean();
};

export const findActiveCouponById = async (couponId) => {
  return Coupon.findOne({
    _id: couponId,
    isActive: true,
  });
};

export const incrementCouponUsage = async (couponId) => {
  return Coupon.findOneAndUpdate(
    {
      _id: couponId,
      isActive: true,

      $or: [
        {
          usageLimit: null,
        },
        {
          usageLimit: {
            $exists: false,
          },
        },
        {
          $expr: {
            $lt: [
              {
                $ifNull: ["$usedCount", 0],
              },
              "$usageLimit",
            ],
          },
        },
      ],
    },
    {
      $inc: {
        usedCount: 1,
      },
    },
    {
      new: true,
    },
  );
};

export const decrementCouponUsage = async (couponId) => {
  return await Coupon.findOneAndUpdate(
    {
      _id: couponId,
      usedCount: { $gt: 0 },
    },
    {
      $inc: {
        usedCount: -1,
      },
    },
    {
      new: true,
    },
  );
};