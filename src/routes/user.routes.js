import express from "express";
const router = express.Router();
import userController from "../controllers/user.controller.js";

router.get("/signup", userController.loadSignupPage);
router.get("/login", userController.loadLoginPage);

export default router;
