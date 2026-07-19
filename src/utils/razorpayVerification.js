import crypto from "crypto";

export const verifyRazorpaySignature = (paymentData) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    paymentData;

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    
    const error = new Error("Payment verification failed");
    error.status = 400;
    throw error;
  }

  return {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  };
};
