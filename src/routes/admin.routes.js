import express from "express";
import * as adminController from "../controllers/admin/admin.controller.js";
import * as categoryController from "../controllers/admin/category.controller.js"
import { isAdminAuth,isAdminNotAuth } from "../middlewares/adminAuth.middleware.js";
import userController from "../controllers/user/user.controller.js";
import { noCache } from "../middlewares/noCache.middleware.js";

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

export default router;