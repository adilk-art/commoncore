import {
  getSalesReportService,
  getSalesReportExportService,
} from "../../services/admin/sales.service.js";

import {
  generateSalesReportPdf,
} from "../../utils/salesReportPdf.js";

import {
  generateSalesReportExcel,
} from "../../utils/salesReportExcel.js";

export const getSalesReportPage = async (
  req,
  res,
  next,
) => {
  try {
    const filter =
      req.query.filter ||
      "daily";

    const startDate =
      req.query.startDate ||
      "";

    const endDate =
      req.query.endDate ||
      "";

    const page =
      Number(req.query.page) ||
      1;

    const data =
      await getSalesReportService({
        filter,
        startDate,
        endDate,
        page,
      });

    res.render(
      "admin/sales-report",
      {
        ...data,

        selectedStartDate:
          startDate,

        selectedEndDate:
          endDate,
      },
    );
  } catch (error) {
    next(error);
  }
};

export const downloadSalesReportPdf = async (
  req,
  res,
  next,
) => {
  try {
    const filter =
      req.query.filter ||
      "daily";

    const startDate =
      req.query.startDate ||
      "";

    const endDate =
      req.query.endDate ||
      "";

    const data =
      await getSalesReportExportService({
        filter,
        startDate,
        endDate,
      });

    generateSalesReportPdf({
      res,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadSalesReportExcel = async (
  req,
  res,
  next,
) => {
  try {
    const filter =
      req.query.filter ||
      "daily";

    const startDate =
      req.query.startDate ||
      "";

    const endDate =
      req.query.endDate ||
      "";

    const data =
      await getSalesReportExportService({
        filter,
        startDate,
        endDate,
      });

    await generateSalesReportExcel({
      res,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};