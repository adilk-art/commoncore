import mongoose from "mongoose";
import {
  getShopProducts,
  getShopCategories,
  countShopProducts,
  findProductDetail,
  findRelatedProducts,
} from "../../repositories/shop.repository.js";

export const getShopPageService = async (query) => {
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
    if (minPrice) filter.basePrice.$gte = Number(minPrice);
    if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
  }

  let sortOption = { createdAt: -1 };

  if (sort === "az") sortOption = { name: 1 };
  if (sort === "za") sortOption = { name: -1 };
  if (sort === "low") sortOption = { basePrice: 1 };
  if (sort === "high") sortOption = { basePrice: -1 };

  const data = await getShopProducts(filter, sortOption, skip, limit);
  const total = await countShopProducts(filter);
  const categories = await getShopCategories();

  return {
    products: data,
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

export const getProductDetailService = async (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product");
  }

  const product = await findProductDetail(productId);

  if (!product || !product.isActive) {
    throw new Error("Product unavailable");
  }

  const activeVariants = product.variants.filter((item) => item.isActive);

  if (!activeVariants.length) {
    throw new Error("Product unavailable");
  }

  let selectedVariant = activeVariants.find((v) => v.isDefault);

  if (!selectedVariant) {
    selectedVariant = activeVariants[0];
  }

  const relatedProducts = await findRelatedProducts(
    product.categoryId._id,
    product._id,
  );

  return {
    product,

    variants: activeVariants,

    selectedVariant,

    relatedProducts,
  };
};
