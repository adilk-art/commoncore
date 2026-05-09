import {
  findCategoryByName,
  createCategory,
  getAllCategories,
  getPaginatedCategories,
  getCategoryCount,
  updateCategoryById,
  getTotalCategoryCount,
  getActiveCategoryCount,
  getHiddenCategoryCount,
  getCategoriesExceptCurrent,
} from "../../repositories/category.repository.js";
import Category from "../../models/category.model.js";
import { categorySchema } from "../../validators/category.validation.js";

export const getAllCategoriesService = async (page = 1, search, sort) => {
  const limit = 5; //limit per page;
  const skip = (page - 1) * limit;
  const sortOrder = sort === "latest" ? -1 : 1;
  const filter = search ? { name: { $regex: search, $options: "i" } } : {};
  const categories = await getPaginatedCategories(
    filter,
    skip,
    limit,
    sortOrder,
  );

  const categoryCount = await getCategoryCount(filter);
  const totalPages = Math.ceil(categoryCount / limit);
  return {
    sortOrder,
    categories,
    totalPages,
    currentPage: page,
    categoryCount,
    limit,
  };
};

export const addCategoryService = async (data) => {
  const { isActive } = data;
  const validated = categorySchema.safeParse(data);
  if (!validated.success) {
    const err = new Error(validated.error.errors[0].message);
    err.status = 400;
    throw err;
  }

  const { name, sizeType } = validated.data;

  const allCategories = await getAllCategories();
  const normalizedName = name.toLowerCase().replace(/\s+/g, "");

  const existing = allCategories.some((category) => {
    const normalizedExisting = category.name.toLowerCase().replace(/\s+/g, "");
    return normalizedExisting === normalizedName;
  });
  if (existing) {
    const err = new Error("Category already exists");
    err.status = 409;
    throw err;
  }

  return await createCategory({ name, sizeType, isActive });
};

export const updateCategoryService = async (id, data) => {
  const { name, sizeType, isActive } = data;

  const validated = categorySchema.safeParse({
    name,
    sizeType,
    isActive,
  });

  if (!validated.success) {
    const err = new Error(validated.error.errors[0].message);
    err.status = 400;
    throw err;
  }

  const cleanName = name.trim().toLowerCase().replace(/\s+/g, " ");

  const existing = await getCategoriesExceptCurrent(id, cleanName);

  if (existing) {
    const err = new Error("Category already exists");
    err.status = 409;
    throw err;
  }

  return await updateCategoryById(id, {
    name,
    sizeType,
    isActive,
  });
};

export const changeStatusService = async (id, isActive) => {
  return await updateCategoryById(id, { isActive });
};

export const getCategoryStatsService = async () => {
  const totalCategories = await getTotalCategoryCount();
  const activeCategories = await getActiveCategoryCount();
  const hiddenCategories = await getHiddenCategoryCount();
  return {
    totalCategories,
    activeCategories,
    hiddenCategories,
  };
};
