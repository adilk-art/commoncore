import { success } from "zod/mini";
import {
  addCategoryService,
  getAllCategoriesService,
} from "../../services/admin/category.service.js";

export const loadCategoryPage = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const data = await getAllCategoriesService(page);
    res.render("admin/categories.ejs", {
      search: null,
      categories: data.categories,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
    });
  } catch (err) {
    next(err);
  }
};

export const addCategory = async (req, res, next) => {
  try {
    const data = req.body;
    await addCategoryService(data);
    return res.status(201).json({
      success: true,
      message: "category added successfully",
    });
  } catch (err) {
    next(err);
  }
};
