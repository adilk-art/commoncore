import {
  findCategoryByName,
  createCategory,
  getAllCategories,
  getPaginatedCategories,
  getCategoryCount,
} from "../../repositories/category.repository.js";
import { categorySchema } from "../../validators/category.validation.js";

export const getAllCategoriesService = async (page = 1) => {
  const limit = 5; //limit per page;
  const skip = (page - 1) * limit;

  const categories = await getPaginatedCategories(skip, limit);
  const totalCategoryCount = await getCategoryCount();

  const totalPages = Math.ceil(totalCategoryCount / limit);

  return {
    categories,
    totalPages,
    currentPage: page,
  };
};

export const addCategoryService = async (data) => {
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

  return await createCategory({ name, sizeType });
};
