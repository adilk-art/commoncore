
import Referral from "../models/referral.model.js";
import User from "../models/user.model.js";

export const findUserByReferralCode = async (referralCode) => {
  return await User.findOne({
    referralCode: referralCode.toUpperCase(),
  });
};

export const referralCodeExists = async (referralCode) => {
  return await User.exists({
    referralCode,
  });
};

export const createReferral = async (data) => {
  return await Referral.create(data);
};

export const findReferralByReferredUser = async (referredUserId) => {
  return await Referral.findOne({
    referredUserId,
  });
};
export const findPendingReferralByReferredUser = async (
  referredUserId,
) => {
  return await Referral.findOne({
    referredUserId,
    status: "Pending",
  });
};

export const findReferralById = async (referralId) => {
  return await Referral.findById(referralId);
};

export const saveReferral = async (referral) => {
  return await referral.save();
};

export const findReferralsByReferrerId = async (referrerId) => {
  return await Referral.find({
    referrerId,
  }).sort({ createdAt: -1 });
};