import Category from "../models/category.model.js";

export const createCategory = async (data) => {
  return await Category.create(data);
};

export const findCategoryByName = async (name) => {
  return await Category.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
  });
};

export const getAllCategories = async () => {
  return await Category.find().sort({ createdAt: -1 });
};

export const getPaginatedCategories = async (skip, limit) => {
  return await Category.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
};

export const getCategoryCount = async () => {
  return await Category.countDocuments();
};
