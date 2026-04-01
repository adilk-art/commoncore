import mongoose from "mongoose";
import { required } from "zod/mini";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["signup", "forgot-password", "email-change", "password-change"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      required: true,
      default:false
    },
  },
  { timestamps: true },
);
// otpSchema.index({ expiresAt: 1, expireAfterSeconds: 0 }); //ttl index for deleting the old otps
const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
