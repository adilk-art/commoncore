import PDFDocument from "pdfkit";

const money = (value) => {
  return `Rs. ${Number(value || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`;
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

const drawTableHeader = (
  doc,
  y,
) => {
  doc
    .fontSize(8)
    .font("Helvetica-Bold");

  doc.text("Date", 35, y, {
    width: 65,
  });

  doc.text("Order", 100, y, {
    width: 105,
  });

  doc.text("Items", 205, y, {
    width: 35,
    align: "center",
  });

  doc.text("Gross", 240, y, {
    width: 70,
    align: "right",
  });

  doc.text("Offer", 310, y, {
    width: 65,
    align: "right",
  });

  doc.text("Coupon", 375, y, {
    width: 65,
    align: "right",
  });

  doc.text("Discount", 440, y, {
    width: 65,
    align: "right",
  });

  doc.text("Net", 505, y, {
    width: 65,
    align: "right",
  });

  doc
    .moveTo(35, y + 14)
    .lineTo(570, y + 14)
    .stroke();

  return y + 22;
};

export const generateSalesReportPdf = ({
  res,
  report,
  rows,
  filter,
  startDate,
  endDate,
}) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 35,
  });

  res.setHeader(
    "Content-Type",
    "application/pdf",
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="sales-report-${Date.now()}.pdf"`,
  );

  doc.pipe(res);

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("COMMON CORE");

  doc
    .font("Helvetica")
    .fontSize(10)
    .text("Sales Report", {
      align: "right",
    });

  doc.moveDown(0.6);

  doc
    .fontSize(9)
    .text(
      `Period: ${formatDate(startDate)} - ${formatDate(endDate)}`,
    );

  doc.text(
    `Filter: ${String(filter).toUpperCase()}`,
  );

  doc.moveDown();

  const summaryY = doc.y;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(
      `Orders: ${report.orderCount}`,
      35,
      summaryY,
    );

  doc.text(
    `Items Sold: ${report.salesQuantity}`,
    170,
    summaryY,
  );

  doc.text(
    `Gross Sales: ${money(report.grossSales)}`,
    320,
    summaryY,
  );

  doc.moveDown(1.3);

  doc
    .font("Helvetica")
    .fontSize(9)
    .text(
      `Offer Discount: ${money(report.offerDiscount)}`,
    );

  doc.text(
    `Coupon Discount: ${money(report.couponDiscount)}`,
  );

  doc.text(
    `Total Discount: ${money(report.totalDiscount)}`,
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(
      `Net Sales: ${money(report.netSales)}`,
    );

  doc.moveDown(1.5);

  let y = drawTableHeader(
    doc,
    doc.y,
  );

  doc
    .font("Helvetica")
    .fontSize(7.5);

  for (const row of rows) {
    if (y > 770) {
      doc.addPage();

      y = drawTableHeader(
        doc,
        40,
      );

      doc
        .font("Helvetica")
        .fontSize(7.5);
    }

    doc.text(
      formatDate(row.createdAt),
      35,
      y,
      {
        width: 65,
      },
    );

    doc.text(
      row.orderNumber,
      100,
      y,
      {
        width: 105,
      },
    );

    doc.text(
      String(row.itemsSold),
      205,
      y,
      {
        width: 35,
        align: "center",
      },
    );

    doc.text(
      money(row.grossAmount),
      240,
      y,
      {
        width: 70,
        align: "right",
      },
    );

    doc.text(
      money(row.offerDiscount),
      310,
      y,
      {
        width: 65,
        align: "right",
      },
    );

    doc.text(
      money(row.couponDiscount),
      375,
      y,
      {
        width: 65,
        align: "right",
      },
    );

    doc.text(
      money(row.totalDiscount),
      440,
      y,
      {
        width: 65,
        align: "right",
      },
    );

    doc.text(
      money(row.netAmount),
      505,
      y,
      {
        width: 65,
        align: "right",
      },
    );

    y += 19;
  }

  if (!rows.length) {
    doc
      .fontSize(10)
      .text(
        "No sales found for the selected period.",
        35,
        y + 10,
      );
  }

  doc.end();
};