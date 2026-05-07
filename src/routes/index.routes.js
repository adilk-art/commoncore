import express from "express";
const router = express.Router();
import userController from "../controllers/user/user.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

router.get("/", userController.loadHomePage);

export default router;
