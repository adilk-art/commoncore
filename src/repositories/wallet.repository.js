import Wallet from "../models/wallet.model.js";

export const findWalletByUserId = async (userId) => {
  return Wallet.findOne({ userId });
};

export const createWallet = async (userId) => {
  return Wallet.create({
    userId,
  });
};

export const getWalletById = async (walletId) => {
  return Wallet.findById(walletId);
};

export const saveWallet = async (wallet) => {
  return wallet.save();
};
