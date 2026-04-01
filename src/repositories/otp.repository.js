import Otp from "../models/otp.model.js";

export const saveOtp = async ({ email, otp, purpose, expiresAt }) => {
  const newOtp = new Otp({ email, otp, purpose, expiresAt });
  return await newOtp.save();
};

export const findOtp = async ({ email, purpose }) => {
  return await Otp.findOne({ email, purpose, isUsed: false }).sort({
    createdAt: -1,
  });
};

export const markOtpAsUsed = async (otpId) => {
  return await Otp.findByIdAndUpdate(otpId, { isUsed: true });
};

export const invalidateOtp = async ({ email, purpose }) => {
  return await Otp.deleteMany({ email, purpose });
};
