import Coupon from "../../models/coupon.model.js";

export const createCoupon = (payload) => {
  return Coupon.create(payload);
};

export const findCouponById = (couponId) => {
  return Coupon.findById(couponId);
};

export const findCouponByCode = (code) => {
  return Coupon.findOne({
    code: code.toUpperCase(),
  });
};

export const findCouponByCodeExceptId = (
  code,
  couponId,
) => {
  return Coupon.findOne({
    code: code.toUpperCase(),
    _id: {
      $ne: couponId,
    },
  });
};

export const updateCoupon = (
  couponId,
  payload,
) => {
  return Coupon.findByIdAndUpdate(
    couponId,
    payload,
    {
      new: true,
      runValidators: true,
    },
  );
};

export const updateCouponStatus = (
  couponId,
  isActive,
) => {
  return Coupon.findByIdAndUpdate(
    couponId,
    {
      isActive,
    },
    {
      new: true,
    },
  );
};

export const incrementCouponUsage = (
  couponId,
) => {
  return Coupon.findByIdAndUpdate(
    couponId,
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

export const decrementCouponUsage = (
  couponId,
) => {
  return Coupon.findByIdAndUpdate(
    couponId,
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

export const getCouponCounts = async () => {
  const now = new Date();

  const [
    totalCoupons,
    activeCoupons,
    scheduledCoupons,
    expiredCoupons,
  ] = await Promise.all([
    Coupon.countDocuments(),

    Coupon.countDocuments({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    }),

    Coupon.countDocuments({
      isActive: true,
      validFrom: { $gt: now },
    }),

    Coupon.countDocuments({
      validUntil: { $lt: now },
    }),
  ]);

  return {
    totalCoupons,
    activeCoupons,
    scheduledCoupons,
    expiredCoupons,
  };
};

export const getCoupons = async ({
  filter,
  sort,
  skip,
  limit,
}) => {
  const [coupons, totalCoupons] =
    await Promise.all([
      Coupon.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Coupon.countDocuments(filter),
    ]);

  return {
    coupons,
    totalCoupons,
  };
};

export const deleteCoupon = (
  couponId,
) => {
  return Coupon.findByIdAndDelete(couponId);
};