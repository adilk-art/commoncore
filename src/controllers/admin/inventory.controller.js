import {getInventoryPageService,getInventoryVariantsService,updateVariantStockService} from "../../services/admin/inventory.service.js";

export const getInventoryPage = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim() || "";
    const sort = req.query.sort || "latest";

    const result = await getInventoryPageService({
      page,
      limit,
      skip,
      search,
      sort,
    });

    res.render("admin/inventory.ejs", {
      products: result.products,
      totalProducts: result.totalProducts,
      totalVariants: result.totalVariants,
      lowStockVariants: result.lowStockVariants,
      outOfStockVariants: result.outOfStockVariants,

      productCount: result.productCount,
      totalPages: result.totalPages,
      currentPage: page,
      limit,
      skip,
      search,
      sort,
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryVariants = async (req, res, next) => {
  try {
    const variants = await getInventoryVariantsService(req.params.productId);

    res.json({
      success: true,
      variants,
    });
  } catch (error) {
    next(error);
  }
};

export const updateVariantStock = async (req, res, next) => {
  try {
    const { variantId } = req.params;
    const { operation, quantity } = req.body;

    await updateVariantStockService({
      variantId,
      operation,
      quantity,
    });

    res.json({
      success: true,
      message: "Stock updated successfully",
    });
  } catch (error) {
    next(error);
  }
};