import Variant from "../../models/variant.model.js";
import Product from "../../models/product.model.js";

export const getVariants = async (filter, skip, limit) => {
  return await Variant.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export const countVariants = async (filter) => {
  return await Variant.countDocuments(filter);
};
export const createVariant = async (data) => {
  return await Variant.create(data);
};
export const clearDefaultVariant = async (productId) => {
  return await Variant.updateMany(
    { productId },
    { $set: { isDefault: false } },
  );
};
export const findVariantBySku = async (sku) => {
  return await Variant.findOne({ sku });
};
export const findVariantBySkuExceptCurrent = async (sku, id) => {
  return await Variant.findOne({ sku, _id: { $ne: id } });
};

export const updateVariantById = async (variantId, updateData) => {
  return await Variant.findByIdAndUpdate(variantId, updateData, {
    returnDocument: "after",
  });
};

export const findVariantById = async (id) => {
  return await Variant.findById(id);
};

export const getProductTotalVariantsCount = async (productId) => {
  return await Variant.countDocuments({ productId });
};

export const getProductActiveVariantsCount = async (productId) => {
  return await Variant.countDocuments({ productId, isActive: true });
};
export const getProductInactiveVariantsCount = async (productId) => {
  return await Variant.countDocuments({ productId, isActive: false });
};

export const reduceVariantStock = async (variantId, quantity) => {
  return Variant.findByIdAndUpdate(
    variantId,
    {
      $inc: {
        stock: -quantity,
      },
    },
    {
      returnDocument: "after",
    },
  );
};

export const increaseVariantStock = (
  variantId,
  quantity,
) => {

  return Variant.findByIdAndUpdate(
    variantId,
    {
      $inc: {
        stock: quantity,
      },
    }
  );

};

export const findActiveVariant = async (variantId) => {
  return await Variant.findOne({
    _id: variantId,
    isActive: true,
  }).populate({
    path: "productId",
    populate: {
      path: "categoryId",
    },
  });
};

export const deactivateVariantsByCategoryId = async (categoryId) => {
  return await Variant.updateMany(
    { productId: { $in: await Product.find({ categoryId }).distinct("_id") } },
    { $set: { isActive: false } }
  );
};

export const getAllVariantsByProductId = async (productId) => {
  return await Variant.find({ productId });
};