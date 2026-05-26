import express from "express";
const router = express.Router();
import userController from "../controllers/user/user.controller.js";
import addressController from "../controllers/user/address.controller.js";
import * as shopController from "../controllers/user/shop.controller.js"
import * as cartController from "../controllers/user/cart.controller.js"
import * as wishlistController from "../controllers/user/wishlist.controller.js"
import * as checkoutController from "../controllers/user/checkout.controller.js"
import passport from "passport";
import { isAuthenticated,isNotAuthenticated } from "../middlewares/auth.middleware.js";
import { createUpload } from "../middlewares/upload.js";
import { noCache } from "../middlewares/noCache.middleware.js";
const uploadProfile = createUpload("profile-images");
router.use(noCache)

router.get("/",userController.loadHomePage)
router.get("/signup",isNotAuthenticated, userController.loadSignupPage);
router.get("/login",isNotAuthenticated, userController.loadLoginPage);
router.post("/signup/initiate", isNotAuthenticated,userController.initialSignup);
router.post("/login",isNotAuthenticated,userController.login);
router.get("/logout",isAuthenticated,userController.logout)

router.post("/verify-otp",userController.verifyOtp)
router.post("/resend-otp",userController.resendOtp)

router.get("/forgot-password",isNotAuthenticated,userController.loadForgotPasswordPage)
router.post("/forgot-password",isNotAuthenticated,userController.forgotPassword)
router.get("/reset-password",isNotAuthenticated,userController.loadResetPasswordPage)
router.post("/reset-password",isNotAuthenticated,userController.resetPassword)

router.get("/profile",isAuthenticated,userController.loadProfilePage)
router.get("/profile/edit",isAuthenticated,userController.loadEditProfile)
router.patch("/profile/email-change",isAuthenticated,userController.emailChange)
router.patch("/profile/edit",isAuthenticated,uploadProfile.single("profileImage"),userController.EditProfile)
router.post("/profile/verify-password", isAuthenticated, userController.verfifyPassword);  //emailchange

router.post("/profile/change-password", isAuthenticated, userController.changePassword);

router.get("/address", isAuthenticated, addressController.getAddressPage);
router.post("/address/add", isAuthenticated, addressController.addAddress);
router.delete("/address/delete/:id", isAuthenticated, addressController.deleteAddress);
router.patch("/address/default/:id", isAuthenticated, addressController.setDefaultAddress);
router.patch("/address/update/:id", isAuthenticated, addressController.updateAddress);

router.get("/shop", shopController.getShopPage);
router.get("/product/:id", shopController.getProductDetail);


router.post("/cart/add", cartController.addToCart);
router.get("/cart", isAuthenticated,cartController.loadCart);
router.get("/cart/variants/:productId",cartController.getCartVariants);
router.patch("/cart/quantity", isAuthenticated,cartController.updateCartQuantity);
router.delete("/cart/item/:itemId", isAuthenticated,cartController.removeCartItem);
router.post("/cart/move-to-wishlist",isAuthenticated,cartController.moveToWishlist);

router.get("/wishlist", isAuthenticated, wishlistController.getWishlist);
router.post("/wishlist/add", wishlistController.addToWishlist);
router.delete("/wishlist/:productId",isAuthenticated,wishlistController.removeWishlistItem);
router.post("/wishlist/move-to-cart",isAuthenticated,wishlistController.moveWishlistToCart);
router.post("/wishlist/add-all-to-cart",isAuthenticated,wishlistController.addAllWishlistToCart,);
router.get("/wishlist/variants/:productId",isAuthenticated,wishlistController.getWishlistVariants);  //getting available variants to add cart

router.get("/checkout", isAuthenticated, checkoutController.loadCheckout);
router.post("/checkout/buy-now", checkoutController.loadBuyNowCheckout);
router.get("/checkout/buy-now", isAuthenticated, checkoutController.renderBuyNowCheckout);



router.get('/auth/google',
    passport.authenticate('google',{scope:['profile','email']})
)
router.get('/auth/google/callback',
    passport.authenticate('google',{failureRedirect:"/user/login"}),
    (req,res)=>{
        if(!req.user.isBlocked){
            req.session.userId=req.user._id;
            res.redirect('/');
        }else{
            req.logout(function (err) {
                if (err) {
                    return next(err);
                }
                });
           return res.render("user/login",{error:"Your account has been Blocked by admin",successMessage:null,formData:null})
           
        }
        
    }
);

export default router;

