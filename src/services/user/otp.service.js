import { success } from "zod";
import generateOtp from "../../utils/generateOtp.js";
import { sendOtpEmail } from "./email.service.js";

export const createAndSendOtp = async ({ email, purpose, session }) => {
  const otp = generateOtp();
  session.otpData = {
    otp,
    purpose,
    expiresAt: Date.now() + 60 * 1000,
    attempts: 0,
  };
  await sendOtpEmail({ email, otp, purpose });
  return { success: true };
};

export const verifyOtpService = async ({ otp, purpose, session }) => {
  const otpData = session.otpData;

  if (!otpData) {
    throw { message: "OTP not found. Please try again." };
  }

  if (otpData.purpose !== purpose) {
    throw { message: "Invalid OTP request." };
  }

  if (otpData.expiresAt < Date.now()) {
    throw { message: "OTP expired. Please resend." };
  }

  if (otpData.attempts >= 5) {
    throw { message: "Too many attempts. Request new OTP." };
  }

  if (otpData.otp !== otp) {
    otpData.attempts += 1;
    throw { message: "Invalid OTP" };
  }

  session.otpData = null;

  return { success: true };
};

// RESEND
export const resendOtpService = async ({ email, purpose, session }) => {
  return await createAndSendOtp({ email, purpose, session });
};
