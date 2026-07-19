import {
  getWalletPageService,
  createWalletRazorpayOrderService,
  verifyWalletPaymentService,
  retryWalletPaymentService,
} from "../../services/user/wallet.service.js";

export const getWalletPage = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const paymentSuccess = req.session.walletPaymentSuccess || null;
    delete req.session.walletPaymentSuccess;
    const { wallet, stats, transactions, pagination } =
      await getWalletPageService(req.session.userId, page);

    res.render("user/wallet", {
      wallet,
      stats,
      transactions,
      pagination,
      paymentSuccess
    });
  } catch (error) {
    next(error);
  }
};

export const createWalletRazorpayOrder = async (req, res, next) => {
  try {
    req.session.pendingWalletPayment = {
      amount: Number(req.body.amount),
      createdAt: Date.now(),
    };

    const data = await createWalletRazorpayOrderService(
      req.session.userId,
      Number(req.body.amount),
    );

    req.session.pendingWalletPayment.razorpayOrderId = data.order.id;

    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const verifyWalletPayment = async (req, res, next) => {
  try {
    const data = await verifyWalletPaymentService(
      req.session.userId,
      req.body,
      req.session.pendingWalletPayment,
    );

    delete req.session.pendingWalletPayment;
    req.session.walletPaymentSuccess = {
      amount: data.amount,
      balance: data.balance,
      transactionId: data.transactionId,
    };

    res.json(data);
  } catch (err) {
    delete req.session.pendingWalletPayment;

    next(err);
  }
};

export const getWalletPaymentFailedPage = async (req, res, next) => {
  try {
    if (!req.session.pendingWalletPayment) {
      return res.redirect("/user/wallet");
    }

    res.render("user/wallet-payment-failed");
  } catch (err) {
    next(err);
  }
};

export const retryWalletPayment = async (req, res, next) => {
  try {
    const data = await retryWalletPaymentService(
      req.session.userId,
      req.session.pendingWalletPayment,
    );

    res.json(data);
  } catch (err) {
    if (err.message === "Wallet payment session expired.") {
      delete req.session.pendingWalletPayment;
    }

    next(err);
  }
};
