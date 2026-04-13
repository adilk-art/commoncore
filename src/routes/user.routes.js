import express from "express";
const router = express.Router();
import userController from "../controllers/user.controller.js";
import passport from "passport";
import { isAutenticated,isNotAuthenticated } from "../middlewares/auth.middleware.js";
router.get("/",userController.loadHomePage)
router.get("/signup",isNotAuthenticated, userController.loadSignupPage);
router.get("/login",isNotAuthenticated, userController.loadLoginPage);
router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.get("/verify-otp",userController.loadOtpPage)
router.post("/verify-otp",userController.verifyOtp)
router.post("/resend-otp",userController.resendOtp)
router.get("/forgot-password",userController.loadForgotPasswordPage)
router.post("/forgot-password",userController.forgotPassword)
router.get("/reset-password",userController.loadResetPasswordPage)
router.post("/reset-password",userController.resetPassword)
router.get("/logout",userController.logout)
router.get("/profile",userController.loadProfilePage)
router.get("/profile/edit",isAutenticated,userController.loadEditProfile)
router.post("/profile/email-change",isAutenticated,userController.emailChange)
router.post("/profile/email-change-verify",isAutenticated,userController.verifyOtp)


router.get("/set-password",userController.loadSetPassword)
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

