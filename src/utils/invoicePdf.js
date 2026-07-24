import PDFDocument from "pdfkit";
import { REFUNDED_STATUSES } from "./orderItemStatus.js";

const PAGE_BOTTOM = 780;

const COL = {
  product: 50,
  productWidth: 210,
  qty: 275,
  status: 320,
  statusWidth: 115,
  amount: 450,
  amountWidth: 95,
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const drawHorizontalLine = (doc, y) => {
  doc.strokeColor("#dddddd").moveTo(50, y).lineTo(545, y).stroke();
};

const drawTableHeader = (doc, y) => {
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#000");

  doc.text("Product", COL.product, y);
  doc.text("Qty", COL.qty, y);
  doc.text("Status", COL.status, y);
  doc.text("Amount", COL.amount, y, {
    width: COL.amountWidth,
    align: "right",
  });

  const lineY = y + 14;

  drawHorizontalLine(doc, lineY);

  return lineY + 10;
};

const measureRowHeight = (doc, item) => {
  doc.font("Helvetica").fontSize(10);

  const productHeight = doc.heightOfString(
    `${item.productName}\n${item.color} / ${item.size}`,
    {
      width: COL.productWidth,
    },
  );

  const hasDiscount =
    Boolean(item.hasOffer) &&
    Number(item.originalUnitPrice ?? item.unitPrice) > Number(item.unitPrice);

  return Math.max(hasDiscount ? 50 : 38, productHeight + 16);
};

const drawItemRow = (doc, item, y, rowHeight) => {
  const quantity = Number(item.quantity) || 0;

  const finalAmount = Number(item.unitPrice) * quantity;

  const originalAmount =
    Number(item.originalUnitPrice ?? item.unitPrice) * quantity;

  const isRefunded = REFUNDED_STATUSES.has(item.status);

  const statusLabel = isRefunded ? `[${item.status}]` : item.status;

  doc
    .font(isRefunded ? "Helvetica-Oblique" : "Helvetica")
    .fontSize(10)
    .fillColor("#000")
    .text(`${item.productName}\n${item.color} / ${item.size}`, COL.product, y, {
      width: COL.productWidth,
    });

  doc.font("Helvetica").fillColor("#000").text(quantity.toString(), COL.qty, y);

  doc
    .font(isRefunded ? "Helvetica-Bold" : "Helvetica")
    .text(statusLabel, COL.status, y, {
      width: COL.statusWidth,
    });

  doc
    .font("Helvetica-Bold")
    .fillColor("#000")
    .text(`Rs. ${formatMoney(finalAmount)}`, COL.amount, y, {
      width: COL.amountWidth,
      align: "right",
    });

  if (item.hasOffer && originalAmount > finalAmount) {
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#777")
      .text(`MRP Rs. ${formatMoney(originalAmount)}`, COL.amount, y + 15, {
        width: COL.amountWidth,
        align: "right",
      });

    if (item.discountType) {
      const offerLabel =
        item.discountType === "PERCENTAGE"
          ? `${Number(item.discountValue)}% OFF`
          : `Rs. ${formatMoney(item.discountValue)} OFF`;

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#15803d")
        .text(offerLabel, COL.amount, y + 28, {
          width: COL.amountWidth,
          align: "right",
        });
    }
  }

  if (isRefunded) {
    doc
      .strokeColor("#999")
      .moveTo(COL.amount, y + 7)
      .lineTo(COL.amount + COL.amountWidth, y + 7)
      .stroke();
  }

  const nextY = y + rowHeight;

  drawHorizontalLine(doc, nextY - 4);

  return nextY;
};

const drawSummaryRow = (doc, label, value, y, options = {}) => {
  const { bold = false, color = "#000", fontSize = 10 } = options;

  doc
    .font(bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(fontSize)
    .fillColor(color)
    .text(label, 315, y, {
      width: 130,
    });

  doc
    .font(bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(fontSize)
    .fillColor(color)
    .text(value, 450, y, {
      width: 95,
      align: "right",
    });

  return y + 22;
};

export const generateInvoicePdf = ({
  order,
  items,

  originalSubtotal,
  discountTotal,

  cancelledAmount,
  returnedAmount,

  activeOriginalSubtotal,
  activeDiscountTotal,
  activeSubtotal,

  shippingFee,
  currentTotal,
  gstAmount,

  res,
}) => {
  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
  });

  res.setHeader("Content-Type", "application/pdf");

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${order.orderNumber}.pdf"`,
  );

  doc.pipe(res);

  doc.font("Helvetica-Bold").fontSize(22).fillColor("#000").text("COMMONCORE", {
    align: "center",
  });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#666")
    .text("Premium Fashion & Apparel", {
      align: "center",
    });

  doc.moveDown(1.2);

  drawHorizontalLine(doc, doc.y);

  doc.moveDown(1.2);

  doc.fillColor("#000").font("Helvetica-Bold").fontSize(15).text("INVOICE");

  doc.moveDown(0.6);

  doc.font("Helvetica").fontSize(10).fillColor("#000");

  doc.text(`Order Number : ${order.orderNumber}`);

  doc.text(
    `Order Date : ${new Date(order.createdAt).toLocaleDateString("en-IN")}`,
  );

  doc.text(`Order Status : ${order.orderStatus}`);

  doc.text(`Payment Status : ${order.paymentStatus}`);

  doc.text(
    `Payment Method : ${order.paymentMethod.replace(
      /([a-z])([A-Z])/g,
      "$1 $2",
    )}`,
  );

  doc.moveDown(1.5);

  doc.font("Helvetica-Bold").fontSize(11).text("BILL TO");

  doc.moveDown(0.4);

  doc.font("Helvetica").fontSize(10);

  doc.text(order.shippingAddress.fullName);

  doc.text(order.shippingAddress.line1);

  if (order.shippingAddress.line2) {
    doc.text(order.shippingAddress.line2);
  }

  doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state}`);

  doc.text(order.shippingAddress.pincode);

  doc.text(`+91 ${order.shippingAddress.phone}`);

  doc.moveDown(1.8);

  doc.font("Helvetica-Bold").fontSize(11).text("ITEMS");

  doc.moveDown(0.8);

  let y = drawTableHeader(doc, doc.y);

  items.forEach((item) => {
    const rowHeight = measureRowHeight(doc, item);

    if (y + rowHeight > PAGE_BOTTOM) {
      doc.addPage();

      y = drawTableHeader(doc, 50);
    }

    y = drawItemRow(doc, item, y, rowHeight);
  });

  doc.y = y;

  if (doc.y > PAGE_BOTTOM - 230) {
    doc.addPage();
    doc.y = 50;
  }

  doc.moveDown(1.2);

  drawHorizontalLine(doc, doc.y);

  doc.moveDown(1.2);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#000")
    .text("PAYMENT SUMMARY");

  doc.moveDown(0.8);

  let summaryY = doc.y;

  const hasAdjustments =
    Number(cancelledAmount) > 0 || Number(returnedAmount) > 0;

  summaryY = drawSummaryRow(
    doc,
    "Original Subtotal",
    `Rs. ${formatMoney(originalSubtotal)}`,
    summaryY,
  );

  if (Number(discountTotal) > 0) {
    summaryY = drawSummaryRow(
      doc,
      "Offer Discount",
      `-Rs. ${formatMoney(discountTotal)}`,
      summaryY,
      {
        color: "#15803d",
      },
    );
  }

  summaryY = drawSummaryRow(
    doc,
    "Subtotal",
    `Rs. ${formatMoney(order.subtotal)}`,
    summaryY,
  );

  if (Number(cancelledAmount) > 0) {
    summaryY = drawSummaryRow(
      doc,
      "Cancelled Amount",
      `-Rs. ${formatMoney(cancelledAmount)}`,
      summaryY,
      {
        color: "#b91c1c",
      },
    );
  }

  if (Number(returnedAmount) > 0) {
    summaryY = drawSummaryRow(
      doc,
      "Returned Amount",
      `-Rs. ${formatMoney(returnedAmount)}`,
      summaryY,
      {
        color: "#b91c1c",
      },
    );
  }

  if (hasAdjustments) {
    summaryY = drawSummaryRow(
      doc,
      "Active Original Subtotal",
      `Rs. ${formatMoney(activeOriginalSubtotal)}`,
      summaryY,
    );

    if (Number(activeDiscountTotal) > 0) {
      summaryY = drawSummaryRow(
        doc,
        "Active Offer Discount",
        `-Rs. ${formatMoney(activeDiscountTotal)}`,
        summaryY,
        {
          color: "#15803d",
        },
      );
    }

    summaryY = drawSummaryRow(
      doc,
      "Current Subtotal",
      `Rs. ${formatMoney(activeSubtotal)}`,
      summaryY,
    );
  }

  summaryY = drawSummaryRow(
    doc,
    "GST Included",
    `Rs. ${Number(gstAmount || 0).toFixed(2)}`,
    summaryY,
  );

  summaryY = drawSummaryRow(
    doc,
    "Shipping",
    Number(shippingFee) === 0 ? "Free" : `Rs. ${formatMoney(shippingFee)}`,
    summaryY,
  );

  drawHorizontalLine(doc, summaryY + 2);

  summaryY += 14;

  summaryY = drawSummaryRow(
    doc,
    hasAdjustments ? "CURRENT TOTAL" : "TOTAL",
    `Rs. ${formatMoney(currentTotal)}`,
    summaryY,
    {
      bold: true,
      fontSize: 11,
    },
  );

  doc.y = summaryY + 8;

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#666")
    .text("All prices are inclusive of GST.", 315, doc.y, {
      width: 230,
      align: "right",
    });

  doc.moveDown(3);

  if (doc.y > PAGE_BOTTOM - 50) {
    doc.addPage();
    doc.y = 50;
  }

  drawHorizontalLine(doc, doc.y);

  doc.moveDown(1);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#666")
    .text("Thank you for shopping with Commoncore", 50, doc.y, {
      width: 495,
      align: "center",
    });

  doc.end();
};
