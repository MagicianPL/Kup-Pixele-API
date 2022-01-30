const express = require("express");
const Pixel = require("../models/pixelModel");
const authUser = require("../helpers/authUser");
const { findOneAndUpdate } = require("../models/pixelModel");

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

pixelRouter.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const place = await Pixel.findOne({ _id: id });
    if (!place) {
      return res
        .status(404)
        .json({ message: "Nie znaleziono miejsca o podanym id" });
    }
    res.status(200).json(place);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

pixelRouter.put("/:id", authUser, async (req, res) => {
  const { id } = req.params;
  const { name, url, description, background } = req.body;

  try {
    const place = await Pixel.findOne({ _id: id });
    if (!place)
      return res
        .status(404)
        .json({ message: "Nie znaleziono miejsca o podanym id" });
    const updatedPlace = {
      name: name || place.name,
      url: url || place.url,
      description: description || place.description,
      background: background || place.background,
    };
    const updated = await Pixel.findOneAndUpdate({ _id: id }, updatedPlace, {
      new: true,
    });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

pixelRouter.get("/test", async (req, res) => {
  const nonLimitedPlaces = await Pixel.find({ isLimited: false });
  const buyedPlaces = [];
  for (i = 1; i < 6; i++) {
    console.log(i);
    console.log(nonLimitedPlaces.length);
    const randomNumber = Math.floor(Math.random() * nonLimitedPlaces.length);
    console.log(randomNumber);
    let place = await Pixel.findOne({ number: randomNumber });
    if (place.isSold === true || place.isLimited === true) {
      do {
        const randomNumber = Math.floor(Math.random * nonLimitedPlaces.length);
        const findPlace = await Pixel.findOne({ number: randomNumber });
        place = findPlace;
      } while (place.isSold === true || place.isLimited === true);
    } else {
      await Pixel.findOneAndUpdate(
        { number: place.number },
        {
          isSold: true,
          background: "yellow",
          owner: "61f502932a6e105ec2f7e650",
        }
      );
      buyedPlaces.push(place);
    }
  }
  res.json({ array: buyedPlaces });
});

module.exports = pixelRouter;
