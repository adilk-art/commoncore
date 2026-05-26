import {
  findInventoryProducts,
  countInventoryProducts,
  getInventoryStats,
  findVariantsByProductId,
  findVariantById,
  saveVariant,
} from "../../repositories/admin/inventory.repository.js";

export const getInventoryPageService = async ({
  page,
  limit,
  skip,
  search,
  sort,
}) => {
  const filter = {};

  if (search) {
    filter.name = {
      $regex: search,
      $options: "i",
    };
  }

  let sortOrder = { createdAt: -1 };

  if (sort === "oldest") {
    sortOrder = { createdAt: 1 };
  }

  const [products, productCount, stats] = await Promise.all([
    findInventoryProducts(limit, skip, filter, sortOrder),
    countInventoryProducts(filter),
    getInventoryStats(),
  ]);

  return {
    products,
    productCount,
    totalPages: Math.ceil(productCount / limit),

    totalProducts: stats.totalProducts,
    totalVariants: stats.totalVariants,
    lowStockVariants: stats.lowStockVariants,
    outOfStockVariants: stats.outOfStockVariants,
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
