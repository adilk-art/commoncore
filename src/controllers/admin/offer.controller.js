import {
  getAllOffersService,
  getOfferStatsService,
  getAllActiveProductsAndCategoriesService,
  addOfferService,
} from "../../services/admin/offer.service.js";

export const loadOfferPage = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const search = req.query.search || "";
    const status = req.query.status || "all";
    const scope = req.query.scope || "all";
    const discount = req.query.discount || "all";
    const sort = req.query.sort || "latest";

    const { offers, offerCount, totalPages, skip, limit } =
      await getAllOffersService(page, search, status, scope, discount, sort);

    const stats = await getOfferStatsService();

    res.render("admin/offers", {
      offers,
      offerCount,
      totalPages,
      currentPage: page,
      skip,
      limit,

      search,
      status,
      scope,
      discount,
      sort,

      ...stats,
    });
  } catch (err) {
    next(err);
  }
};

export const loadAddOfferPage = async (req, res, next) => {
  try {
    const { products, categories } =
      await getAllActiveProductsAndCategoriesService();

    res.render("admin/add-offer", {
      products,
      categories,
    });
  } catch (err) {
    next(err);
  }
};


export const addOffer = async (req, res, next) => {
  try {
    await addOfferService(req.body);

    res.status(201).json({
      success: true,
      message: "Offer created successfully",
    });
  } catch (err) {
    next(err);
  }
};
