import express from "express";
const router = express.Router();
import userController from "../controllers/user.controller.js";

router.get("/signup", userController.loadSignupPage);
router.get("/login", userController.loadLoginPage);
router.post("/signup", userController.signup);
router.post("/login", userController.login);

export default router;
