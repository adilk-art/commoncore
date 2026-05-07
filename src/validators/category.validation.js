import { z } from "zod";
export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Category name must be at least 3 characters")
    .max(50, "Category name must be under 50 characters")
    .regex(
      /^[A-Za-z\s]+$/,
      "Category name can only contain letters and spaces"
    )
    .refine(
      (value) => value.trim().length > 0,
      {
        message:
          "Category name cannot contain only spaces",
      }
    ),

  sizeType: z.enum(["Numeric", "Alpha"], {
    errorMap: () => ({
      message: "Size type must be Numeric or Alpha",
    }),
  }),
});
