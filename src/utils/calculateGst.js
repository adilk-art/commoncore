export const calculateItemGstAmount = (item) => {
  const itemSubtotal = item.unitPrice * item.quantity;

  const taxableValue =
    itemSubtotal / (1 + item.gstRate / 100);

  const gstAmount = itemSubtotal - taxableValue;

  return Number(gstAmount.toFixed(2));
};