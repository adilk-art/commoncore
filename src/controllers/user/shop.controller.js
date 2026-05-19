import { getShopPageService,getProductDetailService } from "../../services/user/shop.service.js";

export const getShopPage = async (req, res, next) => {
  try {
    const result = await getShopPageService(req.query);

    res.render("user/shop.ejs", result);

  } catch (error) {
    next(error);
  }
};

export const getProductDetail = async (req, res, next) => {

  try {

    const data = await getProductDetailService(
      req.params.id
    );

    return res.render(\
      "user/product-detail.ejs",
      data
    );

  } catch (error) {

    next(error);

  }

};