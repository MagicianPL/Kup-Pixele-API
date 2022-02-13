const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_API);
var bodyParser = require("body-parser");
const Pixel = require("../models/pixelModel");
const PlaceOrder = require("../models/PlaceOrderModel");
const authUser = require("../helpers/authUser");
const setReservedPlaces = require("../helpers/setReservedPlaces");
const setSoldPlaces = require("../helpers/setSoldPlaces");
const createCheckoutSession = require("../helpers/stripe");
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

/* Route below has a function from helpers which returns promise. It sets random places as reserved and pushes them to array */
pixelRouter.post("/buy/nonlimited", authUser, async (req, res) => {
  const { qty, name, url, description, background } = req.body;
  const { _id: userId } = req.user;
  if (!qty || !name || !url || !background) {
    return res.status(400).json({ message: "Złe dane" });
  }

  //array of buyed places
  const buyedPlaces = [];

  try {
    await setReservedPlaces(qty, buyedPlaces);
    //checking if an array has number of required places for sold
    if (buyedPlaces.length !== Number(qty)) {
      throw new Error("Coś poszło nie tak z ilością wymaganych miejsc");
    }

    //stripe
    const sessionUrl = await createCheckoutSession(
      req.user,
      qty,
      name,
      url,
      description,
      background,
      userId,
      buyedPlaces
    );

    //TODO *********** send res with session url
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

// For listening events from STRIPE
pixelRouter.post("/payments", async (req, res) => {
  //Checking if request is from STRIPE
  const payload = req.body;
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
  let event;
  try {
    event = await stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    res.status(200).json({ success: true });
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  //********************************* */
  //handling type
  switch (event.type) {
    case "payment_intent.canceled": {
      //code for canceled (also expired)
      //place isReserved: true on false
      const order = await PlaceOrder.findOne({
        paymentIntentId: event.data.object.id,
      });
      const buyedPlaces = order.places;
      for (const place of buyedPlaces) {
        await Pixel.findOneAndUpdate({ _id: place._id }, { isReserved: false });
      }
      PlaceOrder.findOneAndUpdate({ _id: order._id }, { expired: true });
    }
    case "payment_intent.succeeded": {
      if (event.data.object.status === "canceled") {
        return;
      } else {
        const order = await PlaceOrder.findOne({
          paymentIntentId: event.data.object.id,
        });
        const buyedPlaces = order.places;
        //code for updating places on isSold: true
        //updating reserved places for sold places
        const { name, url, background, description, userId } =
          event.data.object.metadata;
        setSoldPlaces(buyedPlaces, name, url, background, description, userId);
        PlaceOrder.findOneAndUpdate({ _id: order._id }, { isPaid: true });
      }
      break;
    }
    default:
      return null;
  }
});

module.exports = pixelRouter;
