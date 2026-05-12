import { z } from "zod";
export const productSchema = z.object({
  name: z
  .string()
  .trim()
  .min(3, "Product name must be at least 3 characters")
  .max(100)
  .refine(val => /[a-zA-Z]/.test(val), {
    message: "Product name must contain at least one letter",
  }),
  description: z
    .string()
    .trim()
    .min(5, "Description must be atleast 5 characters"),
  category: z.string().trim().min(1, "Category is required"),
  fit: z.string().trim().min(1, "Fit is required"),
  material: z
  .string()
  .trim()
  .min(3, "Material is required")
  .max(300, "Material is too long")
  .regex(/^(?=.*[a-zA-Z])[a-zA-Z0-9\s%,/-]+$/, "Material must contain at least one letter"),
  washCare: z.string().trim().min(3, "Washcare is required"),
  isActive: z.union([z.boolean(), z.enum(["true", "false"])]),
  basePrice: z.coerce.number()
  .min(1, "Base price must be greater than 0"),
});


