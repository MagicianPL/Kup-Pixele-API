const mongoose = require("mongoose");

const placeOrderSchema = new mongoose.Schema(
  {
    paymentIntentId: { type: String, required: true },
    places: { type: Array, required: true },
    costInGrosz: { type: Number },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "PixelUser" },
    isPaid: { type: Boolean, default: false },
    expired: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const PlaceOrder = mongoose.model("PlaceOrder", placeOrderSchema);

module.exports = PlaceOrder;
