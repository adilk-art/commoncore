export const generateSku = (productId, size, colorName) => {
    console.log(productId);
  const colorPart = colorName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .toUpperCase();

  return `${productId.slice(-4)}-${size}-${colorPart}`;
};