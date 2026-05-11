import { z } from "zod";
export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be atleast 2 characters")
    .max(100, "Product name is too long")
    .regex(/^[a-zA-Z0-9\s\-]+$/, "Invalid product name"),
  description: z
    .string()
    .trim()
    .min(5, "Description must be atleast 5 characters"),
  category: z.string().trim().min(1, "Category is required"),
  fit: z.string().trim().min(1, "Fit is required"),
  material: z.string().trim().min(3, "Material is required"),
  washCare: z.string().trim().min(3, "Washcare is required"),
  isActive: z.union([z.boolean(), z.enum(["true", "false"])]),
  basePrice: z.coerce.number()
  .min(1, "Base price must be greater than 0"),
});


