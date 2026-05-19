export const generateSku = (productId, size, colorName) => {
  const colorPart = colorName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .toUpperCase();

  return `${productId.slice(-4)}-${size}-${colorPart}`;
};