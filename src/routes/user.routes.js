import express from "express";
const router = express.Router();
import userController from "../controllers/user.controller.js";

router.get("/signup", userController.loadSignupPage);
router.get("/login", userController.loadLoginPage);
router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.get("/verify-otp",userController.loadOtpPage)
router.post("/verify-otp",userController.verifyOtp)
router.post("/resend-otp",userController.resendOtp)

export default router;

