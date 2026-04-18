import express from "express";
const router = express.Router();
import userController from "../controllers/user.controller.js";
import addressController from "../controllers/address.controller.js";
import passport from "passport";
import { isAuthenticated,isNotAuthenticated } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.js";

router.get("/",userController.loadHomePage)
router.get("/signup",isNotAuthenticated, userController.loadSignupPage);
router.get("/login",isNotAuthenticated, userController.loadLoginPage);
router.post("/signup/initiate", userController.initialSignup);
router.post("/login", userController.login);
router.get("/logout",userController.logout)

router.get("/verify-otp",userController.loadOtpPage)
router.post("/verify-otp",userController.verifyOtp)
router.post("/resend-otp",userController.resendOtp)

router.get("/forgot-password",userController.loadForgotPasswordPage)
router.post("/forgot-password",userController.forgotPassword)
router.get("/reset-password",userController.loadResetPasswordPage)
router.post("/reset-password",userController.resetPassword)

router.get("/profile",isAuthenticated,userController.loadProfilePage)
router.get("/profile/edit",isAuthenticated,userController.loadEditProfile)
router.post("/profile/email-change",isAuthenticated,userController.emailChange)
router.post("/profile/email-change-verify",isAuthenticated,userController.verifyOtp)
router.post("/profile/edit",isAuthenticated,upload.single("profileImage"),userController.EditProfile)

router.get("/address", isAuthenticated, addressController.getAddressPage);
router.post("/address/add", isAuthenticated, addressController.addAddress);
router.get("/address/delete/:id", isAuthenticated, addressController.deleteAddress);
router.get("/address/default/:id", isAuthenticated, addressController.setDefaultAddress);
router.get("/address/edit/:id", isAuthenticated, addressController.getEditAddressPage);
router.post("/address/update/:id", isAuthenticated, addressController.updateAddress);

router.get('/auth/google',
    passport.authenticate('google',{scope:['profile','email']})
)
router.get('/auth/google/callback',
    passport.authenticate('google',{failureRedirect:"/user/login"}),
    (req,res)=>{
        req.session.userId=req.user._id;
        res.redirect('/');
    }
);

export default router;

