import Product from "../models/product.model.js";
import Variant from "../models/variant.model.js";

export const findActiveProductById = async (productId) => {
  return await Product.findOne({ _id: productId, isActive: true });
};

export const findActiveVariant = async (variantId) => {
  return await Variant.findOne({ _id: variantId, isActive: true }).populate("color").populate("productId");
};