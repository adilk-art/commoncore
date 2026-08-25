import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.coerce
    .number()
    .int()
    .min(1, "Rating is required")
    .max(5, "Rating cannot be more than 5"),

  comment: z
    .string()
    .trim()
    .min(10, "Review must be at least 10 characters")
    .max(500, "Review cannot exceed 500 characters"),
});