import express from "express";
import * as adminController from "../controllers/admin.controller.js";
import { isAdminAuth } from "../middlewares/adminAuth.middleware.js";
import userController from "../controllers/user.controller.js";

const router=express.Router();

router.get("/login",adminController.loadLoginPage);
router.post("/login",adminController.login);

router.get("/dashboard",isAdminAuth,adminController.loadDashboardPage);

export default router;