import { z } from "zod";

export const emailSchema = z
  .string()
  .email("Please enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be atleast 8 characters")
  .regex(/[0-9]/, "Password must contain atleast one number")
  .regex(/^\S*$/, "Password cannot contain spaces")
  .regex(/[@$!%*?&]/, "Must contain at least one special character");

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(3, "Name must be atleast 3 characters")
      .regex(/^[A-Za-z\s]+$/, "Name can only contain letters"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,

  password: z.string().min(8, "Password must be atleast 8 characters"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema, // ← reuse
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
