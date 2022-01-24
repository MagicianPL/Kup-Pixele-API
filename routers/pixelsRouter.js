const express = require("express");
const Pixel = require("../models/pixelModel");

const pixelRouter = express.Router();

pixelRouter.get("/seed", async (req, res) => {
  try {
    const packages = Pixel.find();
    if (packages.length > 0) {
      return res.status(400).json({ message: "Cannot seeds more packages" });
    } else {
      for (i = 1; i < 100001; i++) {
        const pixelPack = new Pixel({
          number: i,
        });
        await pixelPack.save();
        res.status(201).json({ success: true });
      }
    }
  } catch (err) {
    console.log(err);
    res.send({ message: err.message });
  }
});

module.exports = pixelRouter;
