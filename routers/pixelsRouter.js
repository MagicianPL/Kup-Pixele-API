const express = require("express");
const Pixel = require("../models/pixelModel");
const authUser = require("../helpers/authUser");
const getRandomArrayIndex = require("../helpers/getRandomArrayIndex");
const { findOneAndUpdate } = require("../models/pixelModel");

const pixelRouter = express.Router();

pixelRouter.get("/seed", async (req, res) => {
  try {
    const packages = await Pixel.find();
    console.log(packages.length);
    if (packages.length > 0) {
      return res.status(400).json({ message: "Cannot seeds more packages" });
    } else {
      for (i = 1; i < 10001; i++) {
        const pixelPack = new Pixel({
          number: i,
        });
        await pixelPack.save();
        console.log(i);
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
      console.log(data.length);
      res.status(200).json(data);
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

pixelRouter.put("/buy/nonlimited", authUser, async (req, res) => {
  const { qty, name, url, description, background } = req.body;
  const { _id: userId } = req.user;
  if (!qty || !name || !url || !background) {
    return res.status(400).json({ message: "Invalid data" });
  }

  //array of buyed places - for user
  const buyedPlaces = [];

  try {
    for (i = qty; i > 0; i--) {
      let randomPlace;
      //array of nonlimited, not reserved n not sold places
      const placesForSold = await Pixel.find({
        isReserved: false,
        isLimited: false,
        isSold: false,
      });
      const randomIndex = getRandomArrayIndex(placesForSold);
      randomPlace = placesForSold[randomIndex];

      const reserved = await Pixel.findOneAndUpdate(
        { _id: randomPlace._id },
        { isReserved: true },
        { new: true }
      );

      buyedPlaces.push(reserved.toObject());
    }

    //checking if an array has number of required places for sold
    if (buyedPlaces.length !== qty) {
      throw new Error("Cannot get choosed number of places");
    }

    //If everything is ok - update reserved places
    for (const place of buyedPlaces) {
      const soldPlace = await Pixel.findOneAndUpdate(
        { _id: place._id },
        {
          name,
          url,
          background,
          description: description || place.description,
          isSold: true,
          owner: userId,
        },
        { new: true }
      );
      //also updating properties in array for user
      place.name = soldPlace.name;
      place.url = soldPlace.url;
      place.background = soldPlace.background;
      place.description = soldPlace.description;
      place.isSold = true;
    }

    res.status(200).json(buyedPlaces);
  } catch (err) {
    //if something gone wrong - reset reserved places in array
    if (buyedPlaces.length > 0) {
      for (const place of buyedPlaces) {
        await Pixel.findOneAndUpdate({ _id: place._id }, { isReserved: false });
      }
    }

    res.status(400).json({ message: err.message });
  }
});

/*pixelRouter.get("/test/test", async (req, res) => {
  const limitedPlaces = await Pixel.find({ isLimited: true });
  const buyedPlaces = [];
  for (i = 1; i < 4; i++) {
    console.log(i);
    console.log(limitedPlaces.length);
    const randomNumber =
      Math.floor(Math.random() * limitedPlaces.length) + 4950;
    console.log(randomNumber);
    let place = await Pixel.findOne({ number: randomNumber });
    if (place.isSold === true || place.isLimited === false) {
      do {
        const randomNumber = Math.floor(Math.random * limitedPlaces.length);
        const findPlace = await Pixel.findOne({ number: randomNumber });
        place = findPlace;
      } while (place.isSold === true || place.isLimited === false);
    } else {
      await Pixel.findOneAndUpdate(
        { number: place.number },
        {
          name: "Github",
          url: "https://github.com/MagicianPL",
          description: "Github account with my repositories",
          isSold: true,
          background: "#006400",
          owner: "61f5526e69caf07b25da9a1d",
        }
      );
      buyedPlaces.push(place);
    }
  }
  res.json({ array: buyedPlaces });
});*/

module.exports = pixelRouter;
