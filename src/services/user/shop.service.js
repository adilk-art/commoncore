import mongoose from "mongoose";

import {
  getShopProducts,
  getShopCategories,
  countShopProducts,
  findProductDetail,
  findRelatedProducts,
} from "../../repositories/shop.repository.js";

import { findWishlistByUserId } from "../../repositories/wishlist.repository.js";
import {
  buildActiveOfferLookup,
  getBestOfferPricing,
} from "../../services/shared/pricing.service.js";
import { getProductReviewsService } from "./review.service.js";

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

    wishlistProductIds =
      wishlist?.products?.map((item) => String(item)) || [];
  }

  const offerLookup = await buildActiveOfferLookup();

  const products = data.map((product) => {
    const pricing = getBestOfferPricing(
      product,
      product.previewVariant,
      offerLookup,
    );

    return {
      ...product,
      ...pricing,
      isWishlisted: wishlistProductIds.includes(String(product._id)),
    };
  });

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
    const error = new Error("Invalid product");
    error.statusCode = 404;
    throw error;
  }

  const product = await findProductDetail(productId);

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  const isUnavailable =
    !product.isActive || !product.categoryId?.isActive;

  const activeVariants = product.variants.filter(
    (item) => item.isActive,
  );

  const defaultInStockVariant = activeVariants.find(
    (variant) => variant.isDefault && variant.stock > 0,
  );

  const inStockVariants = activeVariants.filter(
    (variant) => variant.stock > 0,
  );

  const selectedVariant =
    defaultInStockVariant ||
    inStockVariants[0] ||
    activeVariants[0];

  if (!selectedVariant) {
    const error = new Error("Product unavailable");
    error.statusCode = 404;
    throw error;
  }

  const variantUnavailable =
    !selectedVariant.isActive ||
    selectedVariant.stock <= 0;

  const finalUnavailable =
    isUnavailable ||
    variantUnavailable ||
    !activeVariants.length;

  const [relatedProducts, reviewData] = await Promise.all([
    findRelatedProducts(
      product.categoryId._id,
      product._id,
    ),
    getProductReviewsService(productId, userId),
  ]);

  let isWishlisted = false;
  let wishlistProductIds = [];

  if (userId) {
    const wishlist = await findWishlistByUserId(userId);

    wishlistProductIds =
      wishlist?.products?.map((id) => String(id)) || [];

    isWishlisted = wishlistProductIds.includes(
      String(product._id),
    );
  }

  const offerLookup = await buildActiveOfferLookup();

  const pricing = getBestOfferPricing(
    product,
    selectedVariant,
    offerLookup,
  );

  const productData = {
    ...product,
    ...pricing,
  };

  const variantsWithPricing = activeVariants.map((variant) => {
  const variantPricing = getBestOfferPricing(
    product,
    variant,
    offerLookup,
  );

  return {
    ...variant,
    ...variantPricing,
  };
});

  const relatedProductsData = relatedProducts
    .filter((item) => item.previewVariant)
    .map((item) => {
      const pricing = getBestOfferPricing(
        item,
        item.previewVariant,
        offerLookup,
      );

      return {
        ...item,
        ...pricing,
        isWishlisted: wishlistProductIds.includes(
          String(item._id),
        ),
      };
    });

  return {
    product: productData,
    variants: variantsWithPricing,
    selectedVariant,
    relatedProducts: relatedProductsData,
    isWishlisted,
    isUnavailable: finalUnavailable,
    reviews: reviewData.reviews,
    reviewSummary: reviewData.reviewSummary,
    userReview: reviewData.userReview,
    canReview: reviewData.canReview,
  };
};