import { z } from "zod";

export const offerSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Offer title must be at least 3 characters")
      .max(100, "Offer title cannot exceed 100 characters"),

    offerScope: z.enum(["PRODUCT", "CATEGORY"], {
      errorMap: () => ({
        message: "Please select an offer scope",
      }),
    }),

    appliesTo: z.string().trim().min(1, "Please select a product or category"),

    appliesToModel: z.enum(["Product", "Category"]),

    discountType: z.enum(["PERCENTAGE", "FLAT"], {
      errorMap: () => ({
        message: "Please select a discount type",
      }),
    }),

    discountValue: z.coerce
      .number()
      .positive("Discount value must be greater than 0"),

    maxDiscountAmount: z
      .union([z.coerce.number().positive(), z.literal(""), z.null()])
      .transform((value) => (value === "" ? null : value))
      .optional(),

    startDate: z.coerce.date(),

    endDate: z.coerce.date(),

    isActive: z.union([
      z.boolean(),
      z.enum(["true", "false"]).transform((value) => value === "true"),
    ]),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: "Percentage cannot exceed 100",
      });
    }

    if (data.maxDiscountAmount != null && data.maxDiscountAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxDiscountAmount"],
        message: "Maximum discount must be greater than 0",
      });
    }

    if (data.endDate <= data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be after start date",
      });
    }
  });
