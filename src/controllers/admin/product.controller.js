import { success } from "zod";
import {
  addProductService,
  getAllProductsService,
  getProductByIdService,
  editProductService,
  changeProductStatusService,
  loadManageVariantsPageService,
  addVariantService,
  editVariantService,
  getProductsStatsService,
  getVariantsStatsService,
  changeVariantStatusService,
  getAllActiveCategoriesService
} from "../../services/admin/product.service.js";

export const loadProductPage = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const search = req.query.search || "";
    const sort=req.query.sort||"latest"
    
    const { products, totalPages, productCount, skip, limit } =
          await getAllProductsService(page, search,sort);
    const stats=await getProductsStatsService();
  

    res.render("admin/products.ejs", {
      products,
      totalPages,
      productCount,
      skip,
      limit,
      currentPage: page,
      search,
      sort,
      totalProducts:stats.totalProducts,
      activeProducts:stats.activeProducts,
      hiddenProducts:stats.hiddenProducts

    });
  } catch (err) {
    next(err);
  }
};

export const loadAddProductPage = async (req, res, next) => {
  try {
    const categories = await getAllActiveCategoriesService();
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
    const categories = await getAllActiveCategoriesService();
    
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

export const loadManageVariantsPage = async (req, res, next) => {
  try {

    const { productId } = req.params;
    const page = Number(req.query.page) || 1;
    const search = req.query.search || "";

    const { product, 
      variants,
      sizes,
      totalVariants,
    totalPages,
    limit } = await loadManageVariantsPageService(productId,page,search);
    
    const stats=await getVariantsStatsService(productId);

    res.render("admin/manage-variants", {
      product,
      variants,
      sizes,
      totalVariants,
      totalPages,
      limit,
      currentPage:page,
      search,
      variantsCount:stats.totalVariants,
      activeVariants:stats.activeVariants,
      inactiveVariants:stats.hiddenVariants

    });

  } catch (err) {
    next(err);
  }
};

 export const addVariant = async (req, res,next) => {
  try {
    const {productId}=req.params
    await addVariantService(productId, req.body, req.files);
    
    res.status(200).json({ success: true,
      message:"Variant Added"
     });

  } catch (err) {
    next(err)
  }
};

export const editVariant=async(req,res,next)=>{
  try{
    const {id}=req.params

    const imgFiles=req.files||[]
     await editVariantService(id,req.body,imgFiles)
     res.status(200).json({
      success:true,
      message:"Variant Updated"
     })
  }catch(err){
    next(err)
  }
}

export const changeVariantStatus=async(req,res,next)=>{
  try{
    await changeVariantStatusService(req.params.id);
    res.status(200).json({
      success:true,
      message:"Variant Status Updated"
    })

  }catch(err){
    next(err)
  }
}