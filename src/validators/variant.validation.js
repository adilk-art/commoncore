import { z } from "zod";

export const variantSchema = z.object({
  size: z
    .string()
    .trim()
    .min(1, "Select size"),

  stock: z.coerce
    .number()
    .int()
    .min(0, "Enter valid stock"),

  price: z.coerce
    .number()
    .positive("Enter valid price"),

  colorName: z
    .string()
    .trim()
    .min(1, "Enter color name"),

  colorCode: z
    .string()
    .trim()
    .regex(/^#([0-9A-Fa-f]{6})$/, "Choose valid color"),

  isActive: z.enum(["true", "false"], {
    message: "Select valid status"
  }),

  isDefault: z.enum(["true", "false"], {
    message: "Select valid default option"
  })
});