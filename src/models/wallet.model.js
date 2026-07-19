import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({

  type: {
    type: String,
    enum: ["Credit", "Debit"],
    required: true
  },

  category: {
    type: String,
    enum: [
      "AddMoney",
      "OrderPayment",
      "OrderRefund",
      "ReturnRefund",
      "AdminCredit",
      "AdminDebit"
    ],
    required: true
  },

  amount: {
    type: Number,
    required: true,
    min: 1
  },

  balanceAfter: {
    type: Number,
    required: true
  },

  reference: {
    type: String,
    default: ""
  },

  description: {
    type: String,
    default: ""
  },

  status: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Completed"
  }

}, {
  timestamps: true
});

const walletSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },

  balance: {
    type: Number,
    default: 0,
    min: 0
  },

  transactions: [transactionSchema]

}, {
  timestamps: true
});

export default mongoose.model("Wallet", walletSchema);