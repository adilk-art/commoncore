import {
  findWalletByUserId,
  createWallet,
  getWalletById,
  saveWallet,
} from "../../repositories/wallet.repository.js";

import razorpay from "../../config/razorpay.js";
import crypto from "crypto";
import { verifyRazorpaySignature } from "../../utils/razorpayVerification.js";
const limit = 5;

export const getWalletPageService = async (userId, page = 1) => {
  const wallet = await findWalletByUserId(userId);

  if (!wallet) {
    await createWallet(userId);
  }

  const transactions = [...wallet.transactions].sort(
    (a, b) => b.createdAt - a.createdAt,
  );

  let moneyAdded = 0;
  let moneySpent = 0;
  let refunds = 0;

  for (const transaction of transactions) {
    if (transaction.type === "Credit" && transaction.category === "AddMoney") {
      moneyAdded += transaction.amount;
    }

    if (
      transaction.type === "Debit" &&
      transaction.category === "OrderPayment"
    ) {
      moneySpent += transaction.amount;
    }

    if (
      transaction.type === "Credit" &&
      (transaction.category === "OrderRefund" ||
        transaction.category === "ReturnRefund")
    ) {
      refunds += transaction.amount;
    }
  }

  const totalTransactions = transactions.length;
  const totalPages = Math.max(1, Math.ceil(totalTransactions / limit));
  page = Math.max(1, Math.min(Number(page) || 1, totalPages));
  const startIndex = (page - 1) * limit;

  const paginatedTransactions = transactions.slice(
    startIndex,
    startIndex + limit,
  );

  return {
    wallet,
    stats: {
      moneyAdded,
      moneySpent,
      refunds,
      transactionCount: totalTransactions,
    },
    transactions: paginatedTransactions,
    pagination: {
      currentPage: page,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    },
  };
};

export const creditWalletService = async (
  userId,
  { amount, category, description = "", reference = "", status = "Completed" },
) => {
  let wallet = await findWalletByUserId(userId);

  if (!wallet) {
    wallet = await createWallet(userId);
  }

  wallet.balance += amount;
  wallet.transactions.unshift({
    type: "Credit",
    category,
    amount,
    balanceAfter: wallet.balance,
    reference,
    description,
    status,
  });

  await saveWallet(wallet);
  return wallet;
};

export const debitWalletService = async (
  userId,
  { amount, category, description = "", reference = "", status = "Completed" },
) => {
  const wallet = await findWalletByUserId(userId);
  if (!wallet) {
    throw new Error("Wallet not found");
  }
  if (wallet.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }
  wallet.balance -= amount;

  wallet.transactions.unshift({
    type: "Debit",
    category,
    amount,
    balanceAfter: wallet.balance,
    reference,
    description,
    status,
  });

  await saveWallet(wallet);
  return wallet;
};

export const createWalletRazorpayOrderService = async (userId, amount) => {
  if (!Number.isFinite(amount) || amount < 100) {
    const error = new Error("Minimum top-up amount is ₹100");
    error.status = 400;
    throw error;
  }
  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: `wallet_${Date.now()}`,
  });

  return {
    success: true,
    key: process.env.RAZORPAY_KEY,
    order,
  };
};

export const verifyWalletPaymentService = async (
  userId,
  paymentData,
  pendingWalletPayment,
) => {
  if (!pendingWalletPayment) {
    const error = new Error("No pending wallet payment found");
    error.status = 400;
    throw error;
  }
  const { razorpay_payment_id } = verifyRazorpaySignature(paymentData);

  const wallet = await creditWalletService(userId, {
    amount: pendingWalletPayment.amount,
    category: "AddMoney",
    description: "Money added via Razorpay",
    reference: razorpay_payment_id,
  });

  return {
    success: true,
    amount: pendingWalletPayment.amount,
    balance: wallet.balance,
    transactionId: razorpay_payment_id,
  };
};

export const retryWalletPaymentService = async (
  userId,
  pendingWalletPayment,
) => {
  if (!pendingWalletPayment) {
    const error = new Error("No pending wallet payment found.");
    error.status = 400;
    throw error;
  }

  const age = Date.now() - pendingWalletPayment.createdAt;

  if (age > 15 * 60 * 1000) {
    const error = new Error("Wallet payment session expired.");
    error.status = 400;
    throw error;
  }

  return await createWalletRazorpayOrderService(
    userId,
    pendingWalletPayment.amount,
  );
};
