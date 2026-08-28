import CheckoutSession from "../models/checkoutSession.model.js";

export const createCheckoutSessionRepo = async (payload) => {
  return CheckoutSession.create(payload);
};

export const findCheckoutSessionByRazorpayOrderIdRepo = async (
  razorpayOrderId,
  userId,
) => {
  return CheckoutSession.findOne({
    razorpayOrderId,
    userId,
  });
};

export const deleteCheckoutSessionRepo = async (
  razorpayOrderId,
  userId,
) => {
  return CheckoutSession.deleteOne({
    razorpayOrderId,
    userId,
  });
};