import {
  findUserByReferralCode,
  referralCodeExists,
  findReferralByReferredUser,
  createReferral,
} from "../../repositories/referral.repository.js";
import {
  findUserById,
} from "../../repositories/user.repository.js";
import {
  findPendingReferralByReferredUser,
  saveReferral,
} from "../../repositories/referral.repository.js";

import { creditWalletService } from "./wallet.service.js";
import {
  findReferralsByReferrerId,
} from "../../repositories/referral.repository.js";




const generateReferralCode = (name = "USER") => {
  const cleanName = String(name)
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 5);

  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();

  return `${cleanName || "USER"}${randomPart}`;
};

export const createUniqueReferralCodeService = async (name) => {
  let referralCode;
  do {
    referralCode = generateReferralCode(name);
  } while (await referralCodeExists(referralCode));

  return referralCode;
};

export const validateReferralCodeService = async (referralCode) => {
  if (!referralCode) {
    return null;
  }

  const code = String(referralCode).trim().toUpperCase();
  const referrer = await findUserByReferralCode(code);
  if (!referrer) {
    const error = new Error("Invalid referral code");
    error.status = 400;
    error.code = "INVALID_REFERRAL_CODE";
    throw error;
  }
  return referrer;
};

export const createReferralService = async ({
  referrerId,
  referredUserId,
  referralCode,
}) => {
  const existingReferral = await findReferralByReferredUser(referredUserId);

  if (existingReferral) {
    return existingReferral;
  }

  return await createReferral({
    referrerId,
    referredUserId,
    referralCode,
    referrerReward: 150,
    referredUserReward: 100,
    status: "Pending",
  });
};

export const rewardReferralService = async ({
  userId,
  orderId,
  orderStatus,
  paymentStatus,
}) => {
  if (
    orderStatus !== "Delivered" ||
    paymentStatus !== "Paid"
  ) {
    return null;
  }

  const referral =
    await findPendingReferralByReferredUser(
      userId,
    );

  if (!referral) {
    return null;
  }

  await creditWalletService(
    referral.referrerId,
    {
      amount:Number(referral.referrerReward),
      category:"ReferralReward",
      description:"Reward earned from a successful referral",
      reference:String(orderId),
    },
  );

  await creditWalletService(
    referral.referredUserId,
    {
      amount:Number(
        referral.referredUserReward,
      ),
      category:"ReferralReward",
      description:"Referral signup reward",
      reference:String(orderId),
    },
  );

  referral.qualifyingOrderId = orderId;
  referral.status = "Rewarded";
  referral.rewardedAt = new Date();

  await saveReferral(referral);

  return referral;
};

export const getProfileReferralService = async (userId) => {
  const [user, referrals] = await Promise.all([
    findUserById(userId),
    findReferralsByReferrerId(userId),
  ]);

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const successfulReferrals = referrals.filter(
    (referral) => referral.status === "Rewarded",
  ).length;

  const pendingReferrals = referrals.filter(
    (referral) => referral.status === "Pending",
  ).length;

  const totalEarnings = referrals
    .filter((referral) => referral.status === "Rewarded")
    .reduce(
      (total, referral) =>
        total + Number(referral.referrerReward || 0),
      0,
    );

  return {
    referralCode: user.referralCode || "",
    successfulReferrals,
    pendingReferrals,
    totalEarnings,
    referrerReward: 150,
    friendReward: 100,
  };
};