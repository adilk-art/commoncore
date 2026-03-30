import { z } from "zod";
export const signupSchema = z
  .object({
    name: z
      .string()
      .min(3, "Name must be atleast 3 characters")
      .regex(/^[A-Za-z\s]+$/, "Name can only contain letters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(6, "Password must be atleast 6 characters")
      .regex(/[0-9]/, "Password must contain atleast one number")
      .regex(/^\S*$/, "Password cannot contain spaces"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });


  
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),

  password: z.string().min(6, "Password must be atleast 6 characters"),
});
