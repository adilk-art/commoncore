import PDFDocument from "pdfkit";

const money = (value) => {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatPaymentMethod = (paymentMethod) => {
  if (paymentMethod === "CashOnDelivery") {
    return "Cash On Delivery";
  }

  if (paymentMethod === "Razorpay") {
    return "Razorpay";
  }

  if (paymentMethod === "Wallet") {
    return "Wallet";
  }

  return paymentMethod || "Not specified";
};

const drawTableHeader = (doc, y) => {
  doc.fontSize(7).font("Helvetica-Bold");

  doc.text("Date", 30, y, {
    width: 48,
  });

  doc.text("Order", 78, y, {
    width: 70,
  });

  doc.text("Username", 148, y, {
    width: 75,
  });

  doc.text("Payment", 223, y, {
    width: 60,
  });

  doc.text("Items", 283, y, {
    width: 30,
    align: "center",
  });

  doc.text("Gross", 313, y, {
    width: 50,
    align: "right",
  });

  doc.text("Offer", 363, y, {
    width: 45,
    align: "right",
  });

  doc.text("Coupon", 408, y, {
    width: 50,
    align: "right",
  });

  doc.text("Discount", 458, y, {
    width: 55,
    align: "right",
  });

  doc.text("Net", 513, y, {
    width: 55,
    align: "right",
  });

  doc
    .moveTo(30, y + 14)
    .lineTo(568, y + 14)
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
    margin: 30,
  });

  res.setHeader("Content-Type", "application/pdf");

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="sales-report-${Date.now()}.pdf"`,
  );

  doc.pipe(res);

  doc.font("Helvetica-Bold").fontSize(20).text("COMMON CORE");

  doc.font("Helvetica").fontSize(10).text("Sales Report", {
    align: "right",
  });

  doc.moveDown(0.6);

  doc
    .fontSize(9)
    .text(`Period: ${formatDate(startDate)} - ${formatDate(endDate)}`);

  // doc.text(`Filter: ${String(filter).toUpperCase()}`);

  doc.moveDown();

  const summaryY = doc.y;

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(`Orders: ${report.orderCount}`, 30, summaryY);

  doc.text(`Items Sold: ${report.salesQuantity}`, 150, summaryY);

  doc.text(`Gross Sales: ${money(report.grossSales)}`, 300, summaryY);

  doc.moveDown(1.3);

  doc
    .font("Helvetica")
    .fontSize(9)
    .text(`Offer Discount: ${money(report.offerDiscount)}`);

  doc.text(`Coupon Discount: ${money(report.couponDiscount)}`);

  doc.text(`Total Discount: ${money(report.totalDiscount)}`);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(`Net Sales: ${money(report.netSales)}`);

  doc.moveDown(1.5);

  let y = drawTableHeader(doc, doc.y);

  doc.font("Helvetica").fontSize(6.5);

  for (const row of rows) {
    if (y > 770) {
      doc.addPage();

      y = drawTableHeader(doc, 40);

      doc.font("Helvetica").fontSize(6.5);
    }

    doc.text(formatDate(row.createdAt), 30, y, {
      width: 48,
    });

    doc.text(row.orderNumber || "", 78, y, {
      width: 70,
    });

    doc.text(row.userName || "Unknown User", 148, y, {
      width: 75,
    });

    doc.text(formatPaymentMethod(row.paymentMethod), 223, y, {
      width: 60,
    });

    doc.text(String(row.itemsSold || 0), 283, y, {
      width: 30,
      align: "center",
    });

    doc.text(money(row.grossAmount), 313, y, {
      width: 50,
      align: "right",
    });

    doc.text(money(row.offerDiscount), 363, y, {
      width: 45,
      align: "right",
    });

    doc.text(money(row.couponDiscount), 408, y, {
      width: 50,
      align: "right",
    });

    doc.text(money(row.totalDiscount), 458, y, {
      width: 55,
      align: "right",
    });

    doc.text(money(row.netAmount), 513, y, {
      width: 55,
      align: "right",
    });

    y += 19;
  }

  if (!rows.length) {
    doc
      .fontSize(10)
      .text("No sales found for the selected period.", 30, y + 10);
  }

  doc.end();
};
