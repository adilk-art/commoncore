import express from "express";
import * as adminController from "../controllers/admin/admin.controller.js";
import * as categoryController from "../controllers/admin/category.controller.js"
import * as productController from "../controllers/admin/product.controller.js"
import { isAdminAuth,isAdminNotAuth } from "../middlewares/adminAuth.middleware.js";
import userController from "../controllers/user/user.controller.js";
import { noCache } from "../middlewares/noCache.middleware.js";
import { createUpload } from "../middlewares/upload.js";
const uploadVariant = createUpload("variant-images");

const router=express.Router();
router.use(noCache)

router.get("/login",isAdminNotAuth,adminController.loadLoginPage);
router.post("/login",adminController.login);
router.get("/users",isAdminAuth,adminController.loadUsersPage);
router.post("/users/toggle-block/:id",isAdminAuth,adminController.blockUser)

router.get("/dashboard",isAdminAuth,adminController.loadDashboardPage);
router.get("/logout",isAdminAuth,adminController.logout);

router.get("/categories",isAdminAuth,categoryController.loadCategoryPage);
router.post("/categories/add-category",isAdminAuth,categoryController.addCategory);
router.patch("/categories/update/:id",isAdminAuth,categoryController.updateCategory);
router.patch("/categories/toggle-status/:id", categoryController.changeStatus);

router.get("/products",isAdminAuth,productController.loadProductPage);
router.get("/products/add",isAdminAuth,productController.loadAddProductPage);
router.post("/products/add",isAdminAuth,productController.addProduct);
router.get("/products/edit/:id",isAdminAuth,productController.loadEditProductPage);
router.patch("/products/edit/:id",isAdminAuth,productController.editProduct);
router.patch("/products/status/:id",isAdminAuth,productController.changeProductStatus);

router.get("/products/:productId/variants",isAdminAuth,productController.loadManageVariantsPage);
router.post("/products/:productId/variants",isAdminAuth,uploadVariant.array("images", 10),productController.addVariant);
router.patch("/products/variants/edit/:id",isAdminAuth,uploadVariant.array("images", 10),productController.editVariant);
router.patch("/products/variants/status/:id",isAdminAuth,productController.changeVariantStatus);

export default router;


