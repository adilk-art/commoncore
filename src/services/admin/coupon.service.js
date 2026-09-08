import mongoose from "mongoose";

import {
  createCoupon,
  findCouponByCode,
  findCouponByCodeExceptId,
  findCouponById,
  getCouponCounts,
  getCoupons,
  updateCoupon,
  updateCouponStatus,
} from "../../repositories/admin/coupon.repository.js";
import { couponSchema } from "../../validators/coupon.validation.js";



const COUPONS_PER_PAGE = 6;

const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const calculateCouponStatus = (coupon, now = new Date()) => {
  if (!coupon.isActive) {
    return "Disabled";
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return "Limit Reached";
  }
  if (new Date(coupon.validFrom) > now) {
    return "Scheduled";
  }
  if (new Date(coupon.validUntil) < now) {
    return "Expired";
  }
  return "Active";
};

const buildStatusFilter = (status, now) => {
  switch (status) {
    case "active":
      return {
        isActive: true,
        validFrom: {
          $lte: now,
        },
        validUntil: {
          $gte: now,
        },
        $expr: {
          $or: [
            {
              $eq: ["$usageLimit", null],
            },
            {
              $lt: ["$usedCount", "$usageLimit"],
            },
          ],
        },
      };

    case "scheduled":
      return {
        isActive: true,
        validFrom: {
          $gt: now,
        },
      };

    case "expired":
      return {
        validUntil: {
          $lt: now,
        },
      };

    case "disabled":
      return {
        isActive: false,
      };

    case "limit-reached":
      return {
        isActive: true,
        usageLimit: {
          $ne: null,
        },
        $expr: {
          $gte: ["$usedCount", "$usageLimit"],
        },
      };

    default:
      return {};
  }
};

const buildUsageFilter = (usage) => {
  switch (usage) {
    case "unlimited":
      return {
        usageLimit: null,
      };

    case "limited":
      return {
        usageLimit: {
          $ne: null,
        },
        $expr: {
          $lt: ["$usedCount", "$usageLimit"],
        },
      };
    case "exhausted":
      return {
        usageLimit: {
          $ne: null,
        },
        $expr: {
          $gte: ["$usedCount", "$usageLimit"],
        },
      };

    default:
      return {};
  }
};

const buildCouponSort = (sort) => {
  switch (sort) {
    case "oldest":
      return {
        createdAt: 1,
      };

    case "ending-soon":
      return {
        validUntil: 1,
      };

    case "most-used":
      return {
        usedCount: -1,
        createdAt: -1,
      };

    case "least-used":
      return {
        usedCount: 1,
        createdAt: -1,
      };

    case "latest":
    default:
      return {
        createdAt: -1,
      };
  }
};

export const getAdminCouponsService = async (query = {}) => {
  const {
    search = "",
    status = "all",
    discount = "all",
    usage = "all",
    sort = "latest",
  } = query;
  const requestedPage = Number.parseInt(query.page, 10);
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = COUPONS_PER_PAGE;
  const skip = (page - 1) * limit;
  const now = new Date();
  const filter = {};
  const normalizedSearch = search.trim();
  if (normalizedSearch) {
    const searchRegex = new RegExp(escapeRegex(normalizedSearch), "i");
    filter.$or = [
      {
        name: searchRegex,
      },
      {
        code: searchRegex,
      },
    ];
  }

  if (discount === "percentage" || discount === "flat") {
    filter.discountType = discount.toUpperCase();
  }

  const statusFilter = buildStatusFilter(status, now);
  const usageFilter = buildUsageFilter(usage);
  const extraFilters = [statusFilter, usageFilter].filter(
    (currentFilter) => Object.keys(currentFilter).length > 0,
  );

  if (extraFilters.length > 0) {
    filter.$and = extraFilters;
  }

  const sortOptions = buildCouponSort(sort);
  const [couponResult, statistics] = await Promise.all([
    getCoupons({
      filter,
      sort: sortOptions,
      skip,
      limit,
    }),

    getCouponCounts(),
  ]);

  const couponCount = couponResult.totalCoupons;
  const totalPages = Math.max(1, Math.ceil(couponCount / limit));
  const coupons = couponResult.coupons.map((coupon) => ({
    ...coupon,
    validFrom: new Date(coupon.validFrom).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),

    validUntil: new Date(coupon.validUntil).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    status: calculateCouponStatus(coupon, now),
  }));

  return {
    coupons,
    ...statistics,

    couponCount,
    currentPage: page,
    totalPages,
    limit,
    skip,

    search: normalizedSearch,
    status,
    discount,
    usage,
    sort,
  };
};

export const getCreateCouponPageService = async () => {
  return {
    coupon: null,
    isEdit: false,
  };
};

export const createCouponService = async (payload) => {
  const result = couponSchema.safeParse(payload);
  if (!result.success) {
    const error = new Error(result.error.issues[0].message);
    error.status = 400;
    throw error;
  }

  const validatedData = result.data;
  const existingCoupon = await findCouponByCode(validatedData.code);
  if (existingCoupon) {
    const error = new Error("A coupon with this code already exists");
    error.status = 400;
    throw error;
  }

  const {
    name,
    description,
    code,
    discountType,
    discountValue,
    minimumPurchaseAmount,
    maximumDiscountAmount,
    validFrom,
    validUntil,
    usageLimit,
    isActive,
  } = validatedData;

  const normalizedMaximumDiscount =
    discountType === "PERCENTAGE" ? (maximumDiscountAmount ?? null) : null;
  return await createCoupon({
    name: name.trim(),
    description: description?.trim() || "",
    code: code.trim().toUpperCase(),
    discountType,
    discountValue,
    minimumPurchaseAmount,
    maximumDiscountAmount: normalizedMaximumDiscount,
    validFrom,
    validUntil,
    usageLimit: usageLimit ?? null,
    usedCount: 0,
    isActive,
  });
};

export const getEditCouponPageService = async (couponId) => {
  if (!mongoose.Types.ObjectId.isValid(couponId)) {
    const error = new Error("Invalid coupon ID");

    error.status = 400;
    throw error;
  }
  const coupon = await findCouponById(couponId);
  if (!coupon) {
    const error = new Error("Coupon not found");

    error.status = 404;
    throw error;
  }

  return coupon;
};



export const updateCouponService = async (couponId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(couponId)) {
    const error = new Error("Invalid coupon ID");
    error.status = 400;
    throw error;
  }

  const result = couponSchema.safeParse(payload);

  if (!result.success) {
    const error = new Error(result.error.issues[0].message);
    error.status = 400;
    throw error;
  }

  const validatedData = result.data;
  const existingCoupon = await findCouponById(couponId);
  if (!existingCoupon) {
    const error = new Error("Coupon not found");
    error.status = 404;
    throw error;
  }

  const duplicateCoupon = await findCouponByCodeExceptId(
    validatedData.code,
    couponId,
  );

  if (duplicateCoupon) {
    const error = new Error("A coupon with this code already exists");

    error.status = 400;
    throw error;
  }

  const {
    name,
    description,
    code,
    discountType,
    discountValue,
    minimumPurchaseAmount,
    maximumDiscountAmount,
    validFrom,
    validUntil,
    usageLimit,
    isActive,
  } = validatedData;

  const normalizedMaximumDiscount =
    discountType === "PERCENTAGE" ? (maximumDiscountAmount ?? null) : null;

  const updatedCoupon = await updateCoupon(couponId, {
    name: name.trim(),
    description: description?.trim() || "",
    code: code.trim().toUpperCase(),
    discountType,
    discountValue,
    minimumPurchaseAmount,
    maximumDiscountAmount: normalizedMaximumDiscount,
    validFrom,
    validUntil,
    usageLimit: usageLimit ?? null,
    isActive,
  });

  if (!updatedCoupon) {
    const error = new Error("Coupon could not be updated");

    error.status = 404;
    throw error;
  }

  return updatedCoupon;
};

export const toggleCouponStatusService = async (couponId) => {
  if (!mongoose.Types.ObjectId.isValid(couponId)) {
    const error = new Error("Invalid coupon ID");

    error.status = 400;
    throw error;
  }

  const coupon = await findCouponById(couponId);

  if (!coupon) {
    const error = new Error("Coupon not found");

    error.status = 404;
    throw error;
  }

  const updatedCoupon = await updateCouponStatus(couponId, !coupon.isActive);

  if (!updatedCoupon) {
    const error = new Error("Coupon status could not be updated");

    error.status = 404;
    throw error;
  }

  return updatedCoupon.isActive
    ? "Coupon activated successfully"
    : "Coupon deactivated successfully";
};
