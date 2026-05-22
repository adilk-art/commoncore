// repositories/user/wishlist.repository.js

import Wishlist from "../models/wishlist.model.js";
import Product from "../models/product.model.js";
import Variant from "../models/variant.model.js";

export const findWishlistByUserId = async (userId) => {
  return await Wishlist.findOne({ userId });
};

export const createWishlist = async (userId) => {
  return await Wishlist.create({
    userId,
    products: [],
  });
};

export const saveWishlist = async (wishlist) => {
  return await wishlist.save();
};

export const findWishlistProducts = async (productIds) => {
  return await Product.find({
    _id: { $in: productIds },
  }).populate("categoryId");
};

export const findWishlistPreviewVariant = async (productId) => {
  let variant = await Variant.findOne({
    productId,
    isActive: true,
    stock: { $gt: 0 },
  });

  if (variant) return variant;

  variant = await Variant.findOne({
    productId,
    isActive: true,
  });

  if (variant) return variant;

  variant = await Variant.findOne({
    productId,
  });

  return variant;
};

export const findMovableWishlistVariant = async (productId) => {
  return await Variant.findOne({
    productId,
    isActive: true,
    stock: { $gt: 0 },
  }).sort({
    isDefault: -1,
    stock: -1,
  });
};

export const hasProductStock = async (productId) => {
  return await Variant.exists({
    productId,
    isActive: true,
    stock: { $gt: 0 },
  });
};

export const findPurchasableVariants = async (productId) => {
  return await Variant.find({
    productId,
    isActive: true,
    stock: { $gt: 0 },
  })
    .populate({
      path: "productId",
      populate: {
        path: "categoryId",
      },
    })
    .sort({
      isDefault: -1,
      createdAt: 1,
    });
};
