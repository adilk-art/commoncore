import { z } from "zod";

export const addressSchema = z.object({
  fullName: z
    .string()
    .min(3, "Name must be at least 3 characters"),

  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid phone number"),

  line1: z
    .string()
    .min(3, "Address line required"),

  line2: z
    .string()
    .optional(),

  city: z
    .string()
    .min(2, "City is required"),

  state: z
    .string()
    .min(2, "State is required"),

  pincode: z
    .string()
    .regex(/^\d{6}$/, "Invalid pincode"),

  isDefault: z
    .union([z.boolean(), z.string()])
    .optional()
});