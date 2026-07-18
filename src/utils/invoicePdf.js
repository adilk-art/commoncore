import PDFDocument from "pdfkit";
import { REFUNDED_STATUSES } from "./orderItemStatus.js";

const PAGE_BOTTOM = 780;

const COL = {
  product: 50,
  productWidth: 220,
  qty: 280,
  status: 330,
  statusWidth: 120,
  amount: 460,
};

const drawTableHeader = (doc, y) => {
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#000");
  doc.text("Product", COL.product, y);
  doc.text("Qty", COL.qty, y);
  doc.text("Status", COL.status, y);
  doc.text("Amount", COL.amount, y);
  const lineY = y + 12;
  doc.strokeColor("#dddddd").moveTo(50, lineY).lineTo(545, lineY).stroke();
  return lineY + 10;
};

const measureRowHeight = (doc, item) => {
  doc.font("Helvetica").fontSize(10);
  const productHeight = doc.heightOfString(
    `${item.productName}\n${item.color} / ${item.size}`,
    { width: COL.productWidth },
  );
  return Math.max(36, productHeight + 14);
};

const drawItemRow = (doc, item, y, rowHeight) => {
  const amount = item.unitPrice * item.quantity;
  const isRefunded = REFUNDED_STATUSES.has(item.status);
  const statusLabel = isRefunded ? `[${item.status}]` : item.status;

  doc
    .font(isRefunded ? "Helvetica-Oblique" : "Helvetica")
    .fontSize(10)
    .fillColor("#000")
    .text(`${item.productName}\n${item.color} / ${item.size}`, COL.product, y, {
      width: COL.productWidth,
    });

  doc.font("Helvetica").text(item.quantity.toString(), COL.qty, y);

  doc
    .font(isRefunded ? "Helvetica-Bold" : "Helvetica")
    .text(statusLabel, COL.status, y, { width: COL.statusWidth });

  doc.font("Helvetica").text(`Rs. ${amount.toLocaleString("en-IN")}`, COL.amount, y);

  return y + rowHeight;
};

export const generateInvoicePdf = ({
  order,
  items,
  cancelledAmount,
  returnedAmount,
  activeSubtotal,
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
    `attachment; filename=${order.orderNumber}.pdf`,
  );

  doc.pipe(res);

  doc.font("Helvetica-Bold").fontSize(22).fillColor("#000").text("COMMONCORE", {
    align: "center",
  });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#666")
    .text("Premium Fashion & Apparel", { align: "center" });

  doc.moveDown(1.2);
  doc.strokeColor("#dddddd").moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1.2);

  doc.fillColor("#000").font("Helvetica-Bold").fontSize(15).text("INVOICE");
  doc.moveDown(0.6);

  doc.font("Helvetica").fontSize(10);
  doc.text(`Order Number : ${order.orderNumber}`);
  doc.text(`Order Date : ${new Date(order.createdAt).toLocaleDateString("en-IN")}`);
  doc.text(`Order Status : ${order.orderStatus}`);
  doc.text(`Payment Status : ${order.paymentStatus}`);
  doc.text(`Payment Method : ${order.paymentMethod}`);

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

  if (doc.y > PAGE_BOTTOM - 160) {
    doc.addPage();
    doc.y = 50;
  }

  doc.moveDown(1.2);
  doc.strokeColor("#dddddd").moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1.2);

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#000").text("PAYMENT SUMMARY");
  doc.moveDown(0.8);

  const labelX = 320;
  const valueX = 460;
  let summaryY = doc.y;

  doc.font("Helvetica").fontSize(10);
  doc.text("Original Subtotal", labelX, summaryY);
  doc.text(`Rs. ${order.subtotal.toLocaleString("en-IN")}`, valueX, summaryY);
  summaryY += 22;

  if (cancelledAmount > 0) {
    doc.text("Cancelled Amount", labelX, summaryY);
    doc.text(`-Rs. ${cancelledAmount.toLocaleString("en-IN")}`, valueX, summaryY);
    summaryY += 22;
  }

  if (returnedAmount > 0) {
    doc.text("Returned Amount", labelX, summaryY);
    doc.text(`-Rs. ${returnedAmount.toLocaleString("en-IN")}`, valueX, summaryY);
    summaryY += 22;
  }

  if (cancelledAmount > 0 || returnedAmount > 0) {
    doc.text("Current Subtotal", labelX, summaryY);
    doc.text(`Rs. ${activeSubtotal.toLocaleString("en-IN")}`, valueX, summaryY);
    summaryY += 22;
  }

  doc.text("Shipping", labelX, summaryY);
  doc.text(
    order.shippingFee === 0 ? "Free" : `Rs. ${order.shippingFee}`,
    valueX,
    summaryY,
  );
  summaryY += 22;

  doc.text("GST Included", labelX, summaryY);
  doc.text(`Rs. ${gstAmount.toFixed(2)}`, valueX, summaryY);
  summaryY += 28;

  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("TOTAL", labelX, summaryY);
  doc.text(`Rs. ${currentTotal.toLocaleString("en-IN")}`, valueX, summaryY);

  doc.y = summaryY + 30;

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#666")
    .text("All prices are inclusive of GST.", 320, doc.y, {
      width: 175,
      align: "left",
    });

  doc.moveDown(1);
  doc.moveDown(2);
  doc.strokeColor("#dddddd").moveTo(50, doc.y).lineTo(545, doc.y).stroke();
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