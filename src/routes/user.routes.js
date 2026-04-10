import express from "express";
const router = express.Router();
import userController from "../controllers/user.controller.js";
import passport from "passport";

router.get("/signup", userController.loadSignupPage);
router.get("/login", userController.loadLoginPage);
router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.get("/verify-otp",userController.loadOtpPage)
router.post("/verify-otp",userController.verifyOtp)
router.post("/resend-otp",userController.resendOtp)

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

