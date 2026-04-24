import express from "express";
const router = express.Router();
import userController from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

router.get("/",isAuthenticated, userController.loadHomePage);

export default router;
