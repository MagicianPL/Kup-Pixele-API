const express = require("express");
const Pixel = require("../models/pixelModel");

const pixelRouter = express.Router();

pixelRouter.get("/seed", async (req, res) => {
  try {
    const packages = Pixel.find();
    if (packages.length > 0) {
      return res.status(400).json({ message: "Cannot seeds more packages" });
    } else {
      for (i = 1; i < 10001; i++) {
        const pixelPack = new Pixel({
          number: i,
        });
        await pixelPack.save();
      }
      res.status(201).json({ success: true });
    }
  } catch (err) {
    console.log(err);
    res.json({ message: err.message });
  }
});

pixelRouter.get("/", async (req, res) => {
  try {
    const data = await Pixel.find();
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

pixelRouter.get("/nonlimited", async (req, res) => {
  try {
    const data = await Pixel.find({ isLimited: false });
    if (data.length > 0) {
      res.status(200).json(data);
      console.log(data.length);
    } else {
      res
        .status(404)
        .json({ message: "Sorry, no more empty non limited pixels" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

pixelRouter.get("/limited", async (req, res) => {
  try {
    const data = await Pixel.find({ isLimited: true });
    if (data.length > 0) {
      res.status(200).json(data);
      console.log(data.length);
    } else {
      res.status(404).json({ message: "Sorry, no more empty limited pixels" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = pixelRouter;
