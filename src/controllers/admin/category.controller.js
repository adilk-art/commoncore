import { success } from "zod/mini";
import {
  addCategoryService,
  getAllCategoriesService,
  updateCategoryService,
  changeStatusService,
  getCategoryStatsService
} from "../../services/admin/category.service.js";


export const loadCategoryPage = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const search = req.query.search || "";
    const sort=req.query.sort||"latest";
    const data = await getAllCategoriesService(page,search,sort);
    const stats = await getCategoryStatsService();
    res.render("admin/categories.ejs", {
      search,
      sort,
      limit: data.limit,
      categories: data.categories,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
      totalCategoryCount:data.totalCategoryCount,
      totalCategories: stats.totalCategories,
      activeCategories: stats.activeCategories,
      hiddenCategories: stats.hiddenCategories
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

export const updateCategory=async(req,res,next)=>{
    try{
        await updateCategoryService(req.params.id,req.body)
        return res.json({success:true,message:"Category updated successfully"})
    }
    catch(err){
        next(err)
    }

}

export const changeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    await changeStatusService(id, isActive);

    res.json({
      success: true,
      message: `Category ${isActive ? "activated" : "hidden"} successfully`
    });

  } catch (err) {
    next(err);
  }
};
