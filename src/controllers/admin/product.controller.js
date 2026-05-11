import {
  addProductService,
  getAllProductsService,
  getAllCategoriesService
} from "../../services/admin/product.service.js";

export const loadProductPage = async (req, res, next) => {
  try {
    const products = await getAllProductsService();
    res.render("admin/products.ejs", {
      products,
    });
  } catch (err) {
    next(err);
  }
};

export const loadAddProductPage = async (req,res,next) => {
  try {
    const categories = await getAllCategoriesService();
    res.render("admin/add-product.ejs",{categories});
  } catch (err) {
    next(err);
  }
};



export const addProduct = async (req, res, next) => {
  try {
    await addProductService(req.body);
    res.status(201).json({
      success: true,
      message: "Product added succesfully",
    });
  } catch (err) {
    next(err);
  }
};
