import mongoose from "mongoose";
import {
  findInventoryProducts,
  countInventoryProducts,
  getInventoryStats,
  findVariantsByProductId,
  findVariantById,
  saveVariant,
  findAllCategories
} from "../../repositories/admin/inventory.repository.js";

export const getInventoryPageService = async ({
  page,
  limit,
  skip,
  search,
  sort,
  category,
  stock,
}) => {

  const filter = {};

  if (search) {

    filter.name = {
      $regex: search,
      $options: "i",
    };

  }

  if (category) {

    filter.categoryId =
      new mongoose.Types.ObjectId(category);

  }

  let sortOrder = {
    createdAt: -1,
  };

  if (sort === "oldest") {

    sortOrder = {
      createdAt: 1,
    };

  }

  const stockFilter = stock || "";

  const [
    products,
    stats,
    categories,
  ] = await Promise.all([

    findInventoryProducts(
      limit,
      skip,
      filter,
      sortOrder,
      stockFilter,
    ),

    getInventoryStats(),

    findAllCategories(),

  ]);

  let filteredCount = 0;

  if (stockFilter) {

    const allFilteredProducts =
      await findInventoryProducts(
        999999,
        0,
        filter,
        sortOrder,
        stockFilter,
      );

    filteredCount =
      allFilteredProducts.length;

  } else {

    filteredCount =
      await countInventoryProducts(filter);

  }

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCount / limit),
  );

  return {
    products,

    productCount: filteredCount,

    totalPages,

    currentPage: page,

    limit,

    skip,

    search,

    sort,

    category,

    stock,

    categories,

    totalProducts: stats.totalProducts,

    totalVariants: stats.totalVariants,

    lowStockVariants:
      stats.lowStockVariants,

    outOfStockVariants:
      stats.outOfStockVariants,
  };

};

export const getInventoryVariantsService = async (productId) => {
  return await findVariantsByProductId(productId);
};

export const updateVariantStockService = async ({
  variantId,
  operation,
  quantity,
}) => {
  const parsedQuantity = Number(quantity);

  if (isNaN(parsedQuantity) || parsedQuantity < 0) {
    const error = new Error("Invalid quantity");
    error.statusCode = 400;
    throw error;
  }

  const variant = await findVariantById(variantId);

  if (!variant) {
    const error = new Error("Variant not found");
    error.statusCode = 404;
    throw error;
  }

  if (operation === "add") {
    variant.stock += parsedQuantity;
  }

  if (operation === "reduce") {
    if (variant.stock < parsedQuantity) {
      const error = new Error("Insufficient stock");
      error.statusCode = 400;
      throw error;
    }

    variant.stock -= parsedQuantity;
  }

  if (operation === "set") {
    variant.stock = parsedQuantity;
  }

  await saveVariant(variant);
};
