import {
  createProduct,
  getAllProducts,
  countProducts,
  findProductByCategoryId,
  getProductById,
  updateProductById,
  getTotalProductsCount,
  getActiveProductsCount,
  getHiddenProductsCount,
} from "../../repositories/admin/product.repository.js";
import { productSchema } from "../../validators/product.validation.js";
import { variantSchema } from "../../validators/variant.validation.js";
import { getAllActiveCategories, getAllCategories } from "../../repositories/category.repository.js";
import {
  getVariants,
  createVariant,
  clearDefaultVariant,
  findVariantBySku,
  findVariantBySkuExceptCurrent,
  updateVariantById,
  findVariantById,
  countVariants,
  getProductTotalVariantsCount,
  getProductActiveVariantsCount,
  getProductInactiveVariantsCount,
} from "../../repositories/admin/variant.repository.js";
import { generateSku } from "../../utils/generateSku.js";
import { formatTitleCase } from "../../utils/formatText.js";
import cloudinary from "../../config/cloudinary.js";

export const getAllProductsService = async (page, search,sort) => {
  const limit = 6;
  const skip = limit * (page - 1);
  const filter = search
    ? { name: { $regex:search, $options: "i" } }
    : {};
  const sortOrder=sort === "oldest" ? { isActive: 1 } : { createdAt: -1 }

  const products = await getAllProducts(limit, skip, filter,sortOrder);
  const productCount = await countProducts(filter);
  const totalPages = Math.ceil(productCount / limit);


  return {
    products,
    totalPages,
    productCount,
    skip,
    limit
  };
};

export const getAllActiveCategoriesService = async () => {
  return await getAllActiveCategories();

};

export const addProductService = async (data) => {
  data.name = data.name.trim().replace(/\s+/g, " ");
  const validated = productSchema.safeParse(data);
  if (!validated.success) {
    const err = new Error(validated.error.errors[0].message);
    err.status = 400;
    throw err;
  }
  const {
    name,
    description,
    category,
    fit,
    material,
    washCare,
    isActive,
    basePrice,
  } = validated.data;
  const normalizeName = (value) =>
    value.trim().toLowerCase().replace(/\s+/g, " ");

  const cleanName = normalizeName(name);

  const products = await findProductByCategoryId(category);

  const exists = products.some(
    (product) => normalizeName(product.name) === cleanName,
  );

  if (exists) {
    const err = new Error("Product already exists in this category");
    err.status = 400;
    throw err;
  }

   await createProduct({
    name,
    description,
    fit,
    material,
    isActive: isActive === "true" || isActive === true,
    washCare,
    categoryId: category,
    basePrice,
  });
};

export const getProductByIdService = async (id) => {
  return await getProductById(id);
};

export const editProductService = async (id, data) => {
  data.name = data.name.trim().replace(/\s+/g, " ");

  const validated = productSchema.safeParse(data);

  if (!validated.success) {
    const err = new Error(validated.error.errors[0].message);
    err.status = 400;
    throw err;
  }

  const {
    name,
    description,
    category,
    fit,
    material,
    washCare,
    isActive,
    basePrice,
  } = validated.data;

  const normalizeName = (value) =>
    value.trim().toLowerCase().replace(/\s+/g, " ");

  const cleanName = normalizeName(name);

  const products = await findProductByCategoryId(category);

  const exists = products.some(
    (product) =>
      product._id.toString() !== id &&
      normalizeName(product.name) === cleanName,
  );

  if (exists) {
    const err = new Error("Product already exists in this category");
    err.status = 400;
    throw err;
  }

  await updateProductById(id, {
    name,
    description,
    fit,
    material,
    washCare,
    isActive: isActive === "true" || isActive === true,
    categoryId: category,
    basePrice,
  });
};
export const changeProductStatusService = async (id) => {
  const product = await getProductById(id);
  if (!product) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }
  const updatedStatus = !product.isActive;
  await updateProductById(id, { isActive: updatedStatus });
  return updatedStatus
    ? "Product enabled successfully"
    : "Product disabled successfully";
};

export const getProductsStatsService = async () => {
  const totalProducts = await getTotalProductsCount();
  const activeProducts = await getActiveProductsCount();
  const hiddenProducts = await getHiddenProductsCount();
  return {
    totalProducts,
    activeProducts,
    hiddenProducts,
  };
};


export const loadManageVariantsPageService = async (productId,page,search) => {
  const limit=5
  const skip=(page-1)*limit
   const filter = search? {productId,$or: [{ size: { $regex: `^${search}`, $options: "i" } },
          { "color.name": { $regex: `^${search}`, $options: "i" } }
        ]
      }
    : { productId };
  const variants = await getVariants(filter,skip,limit);
  const totalVariants=await countVariants(filter)
  const totalPages= Math.ceil(totalVariants / limit);

  const product = await getProductById(productId);
  let sizes = [];
  if (product.categoryId.sizeType === "Alpha") {
    sizes = ["XS", "S", "M", "L", "XL"];
  } else if (product.categoryId.sizeType === "Numeric") {
    sizes = ["28", "30", "32", "34", "36"];
  }

  if (!product) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }


  return {
    product,
    variants,
    totalVariants,
    totalPages,
    limit,
    sizes,
  };
};

export const addVariantService = async (productId, data, imgFiles) => {
  const validated = variantSchema.safeParse(data);
  if (!validated.success) {
    const err = new Error(validated.error.issues[0].message);
    err.status = 400;
    throw err;
  }
  if (!imgFiles || imgFiles.length < 3) {
    const err = new Error("Minimum 3 images required");
    err.status = 400;
    throw err;
  }

  const isDefault = data.isDefault === "true";

  if (data.isDefault) {
    await clearDefaultVariant(productId);
  }
  const formattedColor = formatTitleCase(data.colorName);
  const sku = generateSku(productId, data.size, formattedColor);
  const existing = await findVariantBySku(sku);
  if (existing) {
    const error = new Error("The variant already exists");
    error.status = 409;
    throw error;
  }
  const images = imgFiles.map((file) => ({
    url: file.path,
    publicId: file.fileName,
  }));
  const variantData = {
    productId,
    size: data.size,
    stock: data.stock,
    price: data.price,
    sku,
    color: {
      name: formattedColor,
      code: data.colorCode,
    },
    images,
    isActive: data.isActive,
    isDefault: data.isDefault === "true",
  };
  return await createVariant(variantData);
};

export const editVariantService = async (variantId, data, imgFiles) => {
  const validated = variantSchema.safeParse(data);
  if (!validated.success) {
    const err = new Error(validated.error.issues[0].message);
    err.status = 400;
    throw err;
  }
  const existingImages = JSON.parse(data.existingImages);
  const newImages = (imgFiles||[]).map((file) => ({
    url: file.path,
    publicId: file.fileName,
  }));
  const finalImages = [...existingImages, ...newImages];
  if (finalImages.length < 3) {
    const err = new Error("Minimum 3 images required");
    err.status = 400;
    throw err;
  }
  const variant = await findVariantById(variantId);
  const productId=variant.productId.toString();
  const formattedColor = formatTitleCase(data.colorName);
  const sku = generateSku(productId, data.size, formattedColor);
  const existing = await findVariantBySkuExceptCurrent(sku, variantId);
  if (existing) {
    const error = new Error("Same variant already exists");
    error.status = 409;
    throw error;
  }



  const existingPublicIds = existingImages.map((img) => img.publicId);
  const removedImages = variant.images.filter((img) => {
    return !existingPublicIds.includes(img.publicId);
  });

  for (const image of removedImages) {
  await cloudinary.uploader.destroy(image.publicId);
}

 const isDefault = data.isDefault === "true";
  if (data.isDefault) {
    await clearDefaultVariant(variant.productId);
  }

  const updateData = {
    size: data.size,
    stock: data.stock,
    price: data.price,
    sku,
    color: {
      name: formattedColor,
      code: data.colorCode,
    },
    images: finalImages,
    isActive: data.isActive === "true",
    isDefault: data.isDefault === "true",
  };

 return await updateVariantById(variantId, updateData);

};

export const getVariantsStatsService = async (productId) => {
  const totalVariants = await getProductTotalVariantsCount(productId);
  const activeVariants = await getProductActiveVariantsCount(productId);
  const hiddenVariants = await getProductInactiveVariantsCount(productId);
  return {
    totalVariants,
    activeVariants,
    hiddenVariants
  };
};

export const changeVariantStatusService=async(variantId)=>{
  const variant=await findVariantById(variantId);
 return await updateVariantById(variantId,{isActive:!variant.isActive})
}