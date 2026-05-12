import { success } from "zod";
import {
  addProductService,
  getAllProductsService,
  getAllCategoriesService,
  getProductByIdService,
  editProductService,
  changeProductStatusService
} from "../../services/admin/product.service.js";

export const loadProductPage = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const search = req.query.search || "";
    const { products, totalPages, productCount, skip, limit } =
      await getAllProductsService(page, search);
    res.render("admin/products.ejs", {
      products,
      totalPages,
      productCount,
      skip,
      limit,
      currentPage: page,
      search,
    });
  } catch (err) {
    next(err);
  }
};

export const loadAddProductPage = async (req, res, next) => {
  try {
    const categories = await getAllCategoriesService();
    res.render("admin/add-product.ejs", { categories });
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
export const loadEditProductPage = async (req, res, next) => {
  try {
    const product = await getProductByIdService(req.params.id);
    const categories = await getAllCategoriesService();
    res.render("admin/edit-product.ejs", {
      product,
      categories,
    });
  } catch (err) {
    next(err);
  }
};

export const editProduct = async (req, res, next) => {
  try {
    await editProductService(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (err) {
    next(err)
  }
};
export const changeProductStatus=async(req,res,next)=>{
  try{
    const message=await changeProductStatusService(req.params.id);
    return res.status(200).json({
      success:true,
      message,
    })

  }catch{
    next(err);

  }
}