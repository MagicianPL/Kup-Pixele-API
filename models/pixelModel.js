const mongoose = require("mongoose");

const pixelSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true },
    name: { type: String },
    url: { type: String },
    description: { type: String },
    isReserved: { type: Boolean, default: false },
    isSold: { type: Boolean, default: false },
    isLimited: { type: Boolean, default: false },
    background: { type: String, default: "transparent" },
    isGold: { type: Boolean, default: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "PixelUser" },
  },
  {
    timestamps: true,
  }
);

const Pixel = mongoose.model("Pixel", pixelSchema);

module.exports = Pixel;
