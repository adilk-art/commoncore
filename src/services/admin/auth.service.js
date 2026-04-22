import { adminLoginSchema } from "../../validators/admin.validation.js";
import { findAdminByEmail } from "../../repositories/admin.repository.js";
import bcrypt from "bcrypt";
import { parse } from "dotenv";

export const adminLoginService = async (email, password) => {
  const parsed = adminLoginSchema.safeParse({email, password});
  if (!parsed.success) {
    const errors = {};
    parsed.error.errors.forEach((err) => {
      const field = err.path[0];
      errors[field] = err.message;
    });
    return {
      success: false,
      errors,
    };
  }
  const admin = await findAdminByEmail(email);
  if (!admin)
    return { success: false, errors: { general: "invalid credentials" } };
  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch)
    return { success: false, errors: { general: "invalid credentials" } };
  return { success: true, admin };
};
