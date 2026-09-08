import { z } from "zod";

const nameRegex =
  /^[A-Za-z]+(?:[.'-]?[A-Za-z]+)*(?:\s+[A-Za-z]+(?:[.'-]?[A-Za-z]+)*)*$/;

const locationRegex =
  /^[A-Za-z]+(?:[.'-]?[A-Za-z]+)*(?:\s+[A-Za-z]+(?:[.'-]?[A-Za-z]+)*)*$/;

const addressRegex = /[A-Za-z0-9]/;

export const addressSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name cannot exceed 50 characters")
    .regex(nameRegex, "Enter a valid name using letters and spaces only"),

  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),

  line1: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(150, "Address cannot exceed 150 characters")
    .refine((value) => addressRegex.test(value), "Enter a valid address"),

  line2: z
    .string()
    .trim()
    .max(100, "Landmark cannot exceed 100 characters")
    .refine(
      (value) => value === "" || addressRegex.test(value),
      "Enter a valid landmark",
    )
    .optional(),

  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(50, "City cannot exceed 50 characters")
    .regex(locationRegex, "Enter a valid city name"),

  state: z
    .string()
    .trim()
    .min(2, "State must be at least 2 characters")
    .max(50, "State cannot exceed 50 characters")
    .regex(locationRegex, "Enter a valid state name"),

  pincode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),

  isDefault: z.union([z.boolean(), z.string()]).optional(),
});
