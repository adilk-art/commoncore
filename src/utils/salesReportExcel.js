import ExcelJS from "exceljs";

const formatMoney = (value) => {
  return Number(value || 0);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
};

export const generateSalesReportExcel = async ({
  res,
  report,
  rows,
  filter,
  startDate,
  endDate,
}) => {
  const workbook = new ExcelJS.Workbook();

  const worksheet =
    workbook.addWorksheet("Sales Report");

  worksheet.mergeCells("A1:H1");

  worksheet.getCell("A1").value =
    "COMMON CORE - SALES REPORT";

  worksheet.getCell("A1").font = {
    bold: true,
    size: 16,
  };

  worksheet.getCell("A1").alignment = {
    horizontal: "center",
  };

  worksheet.mergeCells("A2:H2");

  worksheet.getCell("A2").value =
    `Period: ${formatDate(startDate)} - ${formatDate(endDate)}`;

  worksheet.getCell("A2").alignment = {
    horizontal: "center",
  };

  worksheet.mergeCells("A3:H3");

  worksheet.getCell("A3").value =
    `Filter: ${String(filter).toUpperCase()}`;

  worksheet.getCell("A3").alignment = {
    horizontal: "center",
  };

  worksheet.addRow([]);

  worksheet.addRow([
    "Sales Orders",
    report.orderCount,
    "Items Sold",
    report.salesQuantity,
    "Gross Sales",
    formatMoney(report.grossSales),
    "Net Sales",
    formatMoney(report.netSales),
  ]);

  worksheet.addRow([
    "Offer Discount",
    formatMoney(report.offerDiscount),
    "Coupon Discount",
    formatMoney(report.couponDiscount),
    "Total Discount",
    formatMoney(report.totalDiscount),
  ]);

  worksheet.addRow([]);

  const headerRow =
    worksheet.addRow([
      "Date",
      "Order ID",
      "Items",
      "Gross Amount",
      "Offer Discount",
      "Coupon Discount",
      "Total Discount",
      "Net Amount",
    ]);

  headerRow.font = {
    bold: true,
  };

  headerRow.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  rows.forEach((row) => {
    worksheet.addRow([
      formatDate(row.createdAt),
      row.orderNumber,
      row.itemsSold,
      formatMoney(row.grossAmount),
      formatMoney(row.offerDiscount),
      formatMoney(row.couponDiscount),
      formatMoney(row.totalDiscount),
      formatMoney(row.netAmount),
    ]);
  });

  worksheet.columns = [
    {
      key: "date",
      width: 16,
    },
    {
      key: "order",
      width: 24,
    },
    {
      key: "items",
      width: 10,
    },
    {
      key: "gross",
      width: 18,
    },
    {
      key: "offer",
      width: 18,
    },
    {
      key: "coupon",
      width: 18,
    },
    {
      key: "discount",
      width: 18,
    },
    {
      key: "net",
      width: 18,
    },
  ];

  ["F5", "H5"].forEach((cell) => {
    worksheet.getCell(cell).numFmt =
      '₹#,##0.00';
  });

  ["B6", "D6", "F6"].forEach((cell) => {
    worksheet.getCell(cell).numFmt =
      '₹#,##0.00';
  });

  for (
    let rowNumber = 8;
    rowNumber <= worksheet.rowCount;
    rowNumber++
  ) {
    ["D", "E", "F", "G", "H"].forEach(
      (column) => {
        worksheet.getCell(
          `${column}${rowNumber}`,
        ).numFmt = '₹#,##0.00';
      },
    );
  }

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 7,
    },
  ];

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="sales-report-${Date.now()}.xlsx"`,
  );

  await workbook.xlsx.write(res);

  res.end();
};