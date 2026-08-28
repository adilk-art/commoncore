import express from "express";
const router = express.Router();

import passport from "passport";

import userController from "../controllers/user/user.controller.js";
import addressController from "../controllers/user/address.controller.js";
import * as shopController from "../controllers/user/shop.controller.js";
import * as cartController from "../controllers/user/cart.controller.js";
import * as wishlistController from "../controllers/user/wishlist.controller.js";
import * as checkoutController from "../controllers/user/checkout.controller.js";
import * as orderController from "../controllers/user/order.controller.js";
import * as returnController from "../controllers/user/return.controller.js";
import * as walletController from "../controllers/user/wallet.controller.js";
import * as couponController from "../controllers/user/coupon.controller.js";
import * as reviewController from "../controllers/user/review.controller.js";

import { isAuthenticated, isNotAuthenticated } from "../middlewares/auth.middleware.js";
import { createUpload } from "../middlewares/upload.js";
import { noCache } from "../middlewares/noCache.middleware.js";

const uploadProfile = createUpload("profile-images");

router.use(noCache);

router.get("/", userController.loadHomePage);

router.get("/signup", isNotAuthenticated, userController.loadSignupPage);
router.get("/login", isNotAuthenticated, userController.loadLoginPage);
router.post("/signup/initiate", isNotAuthenticated, userController.initialSignup);
router.post("/login", isNotAuthenticated, userController.login);
router.get("/logout", isAuthenticated, userController.logout);

router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/user/login" }), userController.googleCallback);

router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);

router.get("/forgot-password", isNotAuthenticated, userController.loadForgotPasswordPage);
router.post("/forgot-password", isNotAuthenticated, userController.forgotPassword);
router.get("/reset-password", isNotAuthenticated, userController.loadResetPasswordPage);
router.post("/reset-password", isNotAuthenticated, userController.resetPassword);

router.get("/profile", isAuthenticated, userController.loadProfilePage);
router.get("/profile/edit", isAuthenticated, userController.loadEditProfile);
router.patch("/profile/email-change", isAuthenticated, userController.emailChange);
router.patch("/profile/edit", isAuthenticated, uploadProfile.single("profileImage"), userController.EditProfile);
router.post("/profile/verify-password", isAuthenticated, userController.verfifyPassword);
router.post("/profile/change-password", isAuthenticated, userController.changePassword);

router.get("/contact",userController.loadContactPage);
router.post("/contact",userController.submitContact);

router.get("/about", userController.loadAboutPage);


router.get("/address", isAuthenticated, addressController.getAddressPage);
router.post("/address/add", isAuthenticated, addressController.addAddress);
router.patch("/address/update/:id", isAuthenticated, addressController.updateAddress);
router.patch("/address/default/:id", isAuthenticated, addressController.setDefaultAddress);
router.delete("/address/delete/:id", isAuthenticated, addressController.deleteAddress);

router.get("/shop", shopController.getShopPage);
router.get("/product/:id", shopController.getProductDetail);

router.post("/cart/add", cartController.addToCart);
router.get("/cart", isAuthenticated, cartController.loadCart);
router.get("/cart/variants/:productId", cartController.getCartVariants);
router.patch("/cart/quantity", isAuthenticated, cartController.updateCartQuantity);
router.delete("/cart/item/:itemId", isAuthenticated, cartController.removeCartItem);
router.post("/cart/move-to-wishlist", isAuthenticated, cartController.moveToWishlist);

router.get("/wishlist", isAuthenticated, wishlistController.getWishlist);
router.post("/wishlist/add", wishlistController.addToWishlist);
router.delete("/wishlist/:productId", isAuthenticated, wishlistController.removeWishlistItem);
router.post("/wishlist/move-to-cart", isAuthenticated, wishlistController.moveWishlistToCart);
router.post("/wishlist/add-all-to-cart", isAuthenticated, wishlistController.addAllWishlistToCart);
router.get("/wishlist/variants/:productId", isAuthenticated, wishlistController.getWishlistVariants);

router.get("/checkout", isAuthenticated, checkoutController.loadCheckout);
router.post("/checkout/buy-now", checkoutController.initiateBuyNow);
router.get("/checkout/buy-now", isAuthenticated, checkoutController.getBuyNowCheckoutPage);

router.get("/orders", isAuthenticated, orderController.loadOrdersPage);

router.post("/order/place", isAuthenticated, orderController.placeOrder);
router.post("/order/create-razorpay-order",isAuthenticated,orderController.createRazorpayOrder);
router.post("/order/verify-payment",isAuthenticated,orderController.verifyPaymentController);
router.post("/order/payment-failure",isAuthenticated,orderController.recordPaymentFailureController);
router.get("/order/payment-failed/:orderId",isAuthenticated, orderController.getPaymentFailedPage);

router.get("/order/success/:orderId", isAuthenticated, orderController.loadOrderSuccessPage);
router.get("/order/:orderId/invoice", isAuthenticated, orderController.downloadInvoice);
router.patch("/order/:orderId/items/:itemId/cancel", isAuthenticated, orderController.cancelOrderItem);
router.patch("/order/:orderId/cancel", isAuthenticated, orderController.cancelOrder);
router.get("/order/:orderId", isAuthenticated, orderController.loadOrderDetail);
router.post("/order/:orderId/checkout-again",isAuthenticated,orderController.prepareCheckoutAgain);
router.delete("/order/checkout-again/item/:variantId",isAuthenticated,checkoutController.removeCheckoutAgainItem);
router.patch("/order/checkout-again/item/:variantId/quantity",isAuthenticated,orderController.updateCheckoutAgainItemQuantity);
router.post("/order/checkout-again/exit",isAuthenticated, orderController.exitCheckoutAgain);
router.post("/order/razorpay/dismiss",isAuthenticated,orderController.dismissRazorpayOrderController);

router.get("/returns/request/:orderId/:itemId", isAuthenticated, returnController.loadReturnRequestPage);
router.post("/returns/request", isAuthenticated, returnController.requestReturn);
router.get("/returns/:orderId/:itemId", isAuthenticated, returnController.loadReturnDetailPage);
router.patch("/returns/:returnId/cancel", isAuthenticated, returnController.cancelReturnRequest);

router.get("/wallet",isAuthenticated,walletController.getWalletPage)
router.post("/wallet/add-money",isAuthenticated,walletController.createWalletRazorpayOrder);
router.post("/wallet/verify-payment",isAuthenticated,walletController.verifyWalletPayment);
router.get("/wallet/payment-failed",isAuthenticated,walletController.getWalletPaymentFailedPage);
router.post("/wallet/retry-payment",isAuthenticated,walletController.retryWalletPayment);

router.post("/reviews",isAuthenticated,reviewController.createReview);
router.delete("/reviews/:reviewId", isAuthenticated, reviewController.deleteReview);


router.post("/coupons/apply",isAuthenticated,couponController.applyCoupon);
router.post("/coupons/remove",isAuthenticated,couponController.removeCoupon);
export default router;