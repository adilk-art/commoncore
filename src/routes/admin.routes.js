import express from "express";
import * as adminController from "../controllers/admin/admin.controller.js";
import * as categoryController from "../controllers/admin/category.controller.js"
import * as productController from "../controllers/admin/product.controller.js"
import * as inventoryController from "../controllers/admin/inventory.controller.js"
import * as orderController from "../controllers/admin/order.controller.js"
import * as returnController from "../controllers/admin/return.controller.js"
import * as offerController from "../controllers/admin/offer.controller.js"
import * as couponController from "../controllers/admin/coupon.controller.js"
import * as salesController from "../controllers/admin/sales.controller.js"
import * as dashboardController from "../controllers/admin/dashboard.controller.js"
import { isAdminAuth,isAdminNotAuth } from "../middlewares/adminAuth.middleware.js";
import userController from "../controllers/user/user.controller.js";
import { noCache } from "../middlewares/noCache.middleware.js";
import { createUpload } from "../middlewares/upload.js";
const uploadVariant = createUpload("variant-images");

const router=express.Router();
router.use(noCache)

router.get("/login",isAdminNotAuth,adminController.loadLoginPage);
router.post("/login",adminController.login);
router.get("/users",isAdminAuth,adminController.loadUsersPage);
router.post("/users/toggle-block/:id",isAdminAuth,adminController.blockUser)

router.get("/logout",isAdminAuth,adminController.logout);

router.get("/categories",isAdminAuth,categoryController.loadCategoryPage);
router.post("/categories/add-category",isAdminAuth,categoryController.addCategory);
router.patch("/categories/update/:id",isAdminAuth,categoryController.updateCategory);
router.patch("/categories/toggle-status/:id", categoryController.changeStatus);

router.get("/products",isAdminAuth,productController.loadProductPage);
router.get("/products/add",isAdminAuth,productController.loadAddProductPage);
router.post("/products/add",isAdminAuth,productController.addProduct);
router.get("/products/edit/:id",isAdminAuth,productController.loadEditProductPage);
router.patch("/products/edit/:id",isAdminAuth,productController.editProduct);
router.patch("/products/status/:id",isAdminAuth,productController.changeProductStatus);

router.get("/products/:productId/variants",isAdminAuth,productController.loadManageVariantsPage);
router.post("/products/:productId/variants",isAdminAuth,uploadVariant.array("images", 10),productController.addVariant);
router.patch("/products/variants/edit/:id",isAdminAuth,uploadVariant.array("images", 10),productController.editVariant);
router.patch("/products/variants/status/:id",isAdminAuth,productController.changeVariantStatus);

router.get("/inventory", isAdminAuth,inventoryController.getInventoryPage);
router.get("/inventory/:productId/variants",isAdminAuth,inventoryController.getInventoryVariants);
router.patch("/inventory/variant/:variantId/stock",isAdminAuth,inventoryController.updateVariantStock);

router.get("/orders", isAdminAuth,orderController.getOrdersPage);
router.get( "/orders/:orderId",isAdminAuth,orderController.getOrderDetailPage);
router.post("/orders/:orderId/mark-paid", isAdminAuth,orderController.markCodAsPaid);
router.patch("/orders/item-status", isAdminAuth,orderController.updateItemStatus);

router.get("/returns", isAdminAuth,returnController.getReturnsPage);
router.get("/returns/:returnId", isAdminAuth,returnController.getReturnDetailPage);
router.patch("/returns/:returnId/status", returnController.updateReturnStatus);
router.patch("/returns/:returnId/reject", returnController.rejectReturn);
router.patch("/returns/:returnId/refund", returnController.processReturnRefund);

router.get("/offers", isAdminAuth,offerController.loadOfferPage);
router.get("/offers/add", isAdminAuth,offerController.loadAddOfferPage);
router.post("/offers/add", isAdminAuth,offerController.addOffer);
router.get("/offers/:id/edit", isAdminAuth,offerController.loadEditOfferPage);
router.patch("/offers/:id/edit",isAdminAuth,offerController.editOffer);
router.patch("/offers/status/:id", isAdminAuth, offerController.changeOfferStatus);


router.get("/coupons", isAdminAuth,couponController.loadCouponPage);
router.get("/coupons/add",isAdminAuth,couponController.loadAddCouponPage);
router.post("/coupons/add",isAdminAuth,couponController.addCoupon);
router.get("/coupons/:id/edit",isAdminAuth,couponController.loadEditCouponPage);
router.patch("/coupons/:id/edit",isAdminAuth,couponController.editCoupon);
router.patch("/coupons/status/:id",isAdminAuth,couponController.changeCouponStatus);

router.get("/sales-report",isAdminAuth,salesController.getSalesReportPage);
router.get("/sales-report/pdf",isAdminAuth,salesController.downloadSalesReportPdf);
router.get("/sales-report/excel",isAdminAuth,salesController.downloadSalesReportExcel);


router.get("/dashboard",isAdminAuth,dashboardController.getDashboard);
router.get("/dashboard/sales-chart",isAdminAuth,dashboardController.getSalesChart);
router.get("/dashboard/top-selling",isAdminAuth,dashboardController.getTopSellingData);




export default router;


