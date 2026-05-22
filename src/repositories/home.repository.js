import Product from "../models/product.model.js"

export const getFeaturedProducts = async (limit = 4) => {
  return await Product.find({ isActive: true })
    .populate("categoryId", "name")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};