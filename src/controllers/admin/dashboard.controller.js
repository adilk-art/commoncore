import {
  getDashboardService,
  getSalesChartService,
  getTopSellingDataService,
} from "../../services/admin/dashboard.service.js";

export const getDashboard = async (req, res, next) => {
  try {
    const data = await getDashboardService();
    res.render("admin/dashboard", data);
  } catch (error) {
    next(error);
  }
};

export const getSalesChart = async (req, res, next) => {
  try {
    const data = await getSalesChartService({
      filter: req.query.filter || "monthly",

      year: req.query.year,
    });

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

export const getTopSellingData = async (req, res, next) => {
  try {
    const data = await getTopSellingDataService();

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};
