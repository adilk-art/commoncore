import mongoose from "mongoose";

import {
  getShopProducts,
  getShopCategories,
  countShopProducts,
  findProductDetail,
  findRelatedProducts,
  
} from "../../repositories/shop.repository.js";

import { findWishlistByUserId } from "../../repositories/wishlist.repository.js";

export const getShopPageService = async (query, userId) => {

  const page = Number(query.page) || 1;
  const limit = 8;
  const skip = (page - 1) * limit;
  const {
    search = "",
    category = "",
    sort = "",
    minPrice = "",
    maxPrice = "",
  } = query;

  const filter = {
    isActive: true,
  };

  if (search) {
    filter.name = {
      $regex: search,
      $options: "i",
    };
  }

  if (category) {
    filter.categoryId = new mongoose.Types.ObjectId(category);
  }

  if (minPrice || maxPrice) {
    filter.basePrice = {};

    if (minPrice) {
      filter.basePrice.$gte = Number(minPrice);
    }

    if (maxPrice) {
      filter.basePrice.$lte = Number(maxPrice);
    }
  }

  let sortOption = {
    createdAt: -1,
  };

  if (sort === "az") {
    sortOption = { name: 1 };
  }

  if (sort === "za") {
    sortOption = { name: -1 };
  }

  if (sort === "low") {
    sortOption = { basePrice: 1 };
  }

  if (sort === "high") {
    sortOption = { basePrice: -1 };
  }

  const data = await getShopProducts(filter, sortOption, skip, limit);
  let wishlistProductIds = [];

  if (userId) {
    const wishlist = await findWishlistByUserId(userId);
    wishlistProductIds = wishlist?.products?.map((item) => String(item)) || [];
  }

  const products = data.map((product) => ({
    ...product,

    isWishlisted: wishlistProductIds.includes(String(product._id)),
  }));

  const total = await countShopProducts(filter);

  const categories = await getShopCategories();

  return {
    products,
    categories,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    search,
    category,
    sort,
    minPrice,
    maxPrice,
  };
};

export const getProductDetailService = async ({ productId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product");
  }

  const product = await findProductDetail(productId);
  if (
  !product ||
  !product.isActive ||
  !product.categoryId?.isActive
) {

  const error =
    new Error("Product unavailable");

  error.statusCode = 404;

  throw error;
}

  const activeVariants = product.variants.filter((item) => item.isActive);
  if (!activeVariants.length) {

  const error =
    new Error("Product unavailable");

  error.statusCode = 404;

  throw error;
}

  let selectedVariant = activeVariants.find((v) => v.isDefault);    //default variant selection
  if (!selectedVariant) {
    selectedVariant = activeVariants[0];
  }

  const relatedProducts = await findRelatedProducts(
    product.categoryId._id,
    product._id,
  );

  let isWishlisted = false;
  if (userId) {
    const wishlist = await findWishlistByUserId(userId);

    isWishlisted = wishlist?.products?.some(
      (id) => String(id) === String(productId),
    );
  }

  return {
    product,
    variants: activeVariants,
    selectedVariant,
    relatedProducts,
    isWishlisted,
  };
};

