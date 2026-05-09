import express from "express";
import * as adminController from "../controllers/admin.controller.js";
import { isAdminAuth,isAdminNotAuth } from "../middlewares/adminAuth.middleware.js";
import userController from "../controllers/user.controller.js";
import { noCache } from "../middlewares/noCache.middleware.js";

const router=express.Router();
router.use(noCache)

router.get("/login",isAdminNotAuth,adminController.loadLoginPage);
router.post("/login",adminController.login);
router.get("/users",isAdminAuth,adminController.loadUsersPage);
router.post("/users/toggle-block/:id",isAdminAuth,adminController.blockUser)

router.get("/dashboard",isAdminAuth,adminController.loadDashboardPage);
router.get("/logout",isAdminAuth,adminController.logout);

export default router;