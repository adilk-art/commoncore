import {
  updateUserById,
  findUserById,
  findUserByEmail,
  saveUser
} from "../repositories/user.repository.js";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { emailSchema, passwordSchema } from "../validators/user.validation.js";

export const updateProfileService = async (userId, body, file) => {
  const { name, phone } = body;
  if (!name) {
    throw new Error("Name is required");
  }
  if (phone && !/^[0-9]\d{9}$/.test(phone)) {
    throw new Error("Invalid phone number");
  }

  const updateData = {
    name,
    phone,
  };
  if (file) {
    const user = await findUserById(userId);
    if (user.profileImage && user.profileImage !== "/images/default.png") {
      const oldPath = path.join("public", user.profileImage);

      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    updateData.profileImage = "/uploads/" + file.filename;
  }
  return await updateUserById(userId, updateData);
};

export const verifyPasswordService = async (userId, password) => {
  const user = await findUserById(userId);
  if (!user.password) {
    throw new Error("Google account cannot change email");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Incorrect password");
  }
  return true;
};

export const verifyNewEmailService = async (email, userId) => {
  const validate = emailSchema.safeParse(email);
  if (!validate.success) {
    throw new Error(resourceLimits.error.issues[0].message);
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error("Email already in use");
  }
  return true;
};

export const updateEmailService = async (userId, newEmail) => {
  await updateUserById(userId, { email: newEmail });
  return true;
};

export const changePasswordService = async (userId, currentPassword, newPassword) => {
const validate = passwordSchema.safeParse(currentPassword);

if (!validate.success) {
  const firstError = validate.error.issues[0].message;

  return res.status(400).json({
    success: false,
    message: firstError
  });
}
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;

  await saveUser(user);

  return true;
};