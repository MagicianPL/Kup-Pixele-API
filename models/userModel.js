const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    login: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minLength: 6, maxLength: 300 },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("PixelUser", userSchema);

module.exports = User;
