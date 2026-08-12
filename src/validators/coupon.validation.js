import { z } from "zod";

const preprocessNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
};

const preprocessOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return Number(value);
};

export const couponSchema = z
  .object({
    name: z
      .string({
        required_error: "Coupon name is required",
      })
      .trim()
      .min(3, "Coupon name must contain at least 3 characters")
      .max(80, "Coupon name cannot exceed 80 characters"),

    description: z
      .string()
      .trim()
      .max(250, "Description cannot exceed 250 characters")
      .optional()
      .default(""),

    code: z
      .string({
        required_error: "Coupon code is required",
      })
      .trim()
      .min(3, "Coupon code must contain at least 3 characters")
      .max(30, "Coupon code cannot exceed 30 characters")
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Coupon code can contain only letters, numbers, hyphens and underscores",
      )
      .transform((value) => value.toUpperCase()),

    discountType: z.enum(["PERCENTAGE", "FLAT"], {
      required_error: "Discount type is required",
      invalid_type_error: "Invalid discount type",
    }),

    discountValue: z.preprocess(
      preprocessNumber,
      z
        .number({
          required_error: "Discount value is required",
          invalid_type_error: "Discount value must be a number",
        })
        .positive("Discount value must be greater than 0"),
    ),

    minimumPurchaseAmount: z.preprocess(
      preprocessNumber,
      z
        .number({
          invalid_type_error: "Minimum purchase amount must be a number",
        })
        .min(0, "Minimum purchase amount cannot be negative")
        .default(0),
    ),

    maximumDiscountAmount: z.preprocess(
      preprocessOptionalNumber,
      z
        .number({
          invalid_type_error: "Maximum discount amount must be a number",
        })
        .positive("Maximum discount amount must be greater than 0")
        .nullable(),
    ),

    validFrom: z.coerce.date({
      required_error: "Start date is required",
      invalid_type_error: "Invalid start date",
    }),

    validUntil: z.coerce.date({
      required_error: "Expiry date is required",
      invalid_type_error: "Invalid expiry date",
    }),

    usageLimit: z.preprocess(
      preprocessOptionalNumber,
      z
        .number({
          invalid_type_error: "Usage limit must be a number",
        })
        .int("Usage limit must be a whole number")
        .positive("Usage limit must be greater than 0")
        .nullable(),
    ),

    isActive: z.preprocess((value) => {
      if (typeof value === "boolean") return value;

      return value === "true" || value === "on";
    }, z.boolean()),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: "Percentage discount cannot exceed 100%",
      });
    }

    if (
      data.discountType === "PERCENTAGE" &&
      data.maximumDiscountAmount === null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maximumDiscountAmount"],
        message: "Maximum discount amount is required for percentage coupons",
      });
    }

    if (data.discountType === "FLAT" && data.maximumDiscountAmount !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maximumDiscountAmount"],
        message: "Maximum discount amount is not allowed for flat coupons",
      });
    }

    if (data.validUntil <= data.validFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["validUntil"],
        message: "Expiry date must be later than the start date",
      });
    }

    if (
      data.discountType === "FLAT" &&
      data.minimumPurchaseAmount > 0 &&
      data.discountValue > data.minimumPurchaseAmount
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: "Flat discount cannot exceed the minimum purchase amount",
      });
    }
  });

  export const validateCoupon = (payload) => {
  const result = couponSchema.safeParse(payload);

  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: {},
    };
  }

  const errors = {};

  result.error.issues.forEach((issue) => {
    const field = issue.path[0];

    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  });

  return {
    success: false,
    data: null,
    errors,
  };
};