const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userPhone: String,
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: Number,
    },
  ],
  totalAmount: Number,
  paid: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const orderModel= mongoose.model("Order", orderSchema);
module.exports = orderModel
