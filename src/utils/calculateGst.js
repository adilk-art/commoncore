export const calculateItemGstAmount = (item) => {
  const unitPrice = Number(item?.unitPrice) || 0;

  const quantity = Number(item?.quantity) || 0;

  const gstRate = Number(item?.gstRate) || 0;

  const couponDiscount = Number(item?.couponDiscountAmount || 0);

  const itemAmount = unitPrice * quantity;

  const finalAmount = Math.max(itemAmount - couponDiscount, 0);

  if (finalAmount <= 0 || gstRate <= 0) {
    return 0;
  }

  const taxableValue = finalAmount / (1 + gstRate / 100);

  const gstAmount = finalAmount - taxableValue;

  return Number(gstAmount.toFixed(2));
};
