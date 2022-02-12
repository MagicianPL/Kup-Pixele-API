const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_API);
var bodyParser = require("body-parser");
const Pixel = require("../models/pixelModel");
const authUser = require("../helpers/authUser");
const getRandomArrayIndex = require("../helpers/getRandomArrayIndex");
const { findOneAndUpdate } = require("../models/pixelModel");
const setReservedPlaces = require("../helpers/setReservedPlaces");
const setSoldPlaces = require("../helpers/setSoldPlaces");
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

/*Route below has two functions from helpers which returns promises. One function sets random places as reserved and pushes them to array - and the second function sets reserved places from array as sold*/
pixelRouter.post("/buy/nonlimited", authUser, async (req, res) => {
  const { qty, name, url, description, background } = req.body;
  const { _id: userId } = req.user;
  if (!qty || !name || !url || !background) {
    return res.status(400).json({ message: "Złe dane" });
  }

  //array of buyed places - for user
  const buyedPlaces = [];

  try {
    await setReservedPlaces(qty, buyedPlaces);
    //checking if an array has number of required places for sold
    if (buyedPlaces.length !== qty) {
      throw new Error("Coś poszło nie tak z ilością wymaganych miejsc");
    }

    //stripe
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card", "p24"],
        mode: "payment",
        customer_email: req.user?.email || "test@test.com",
        payment_intent_data: {
          metadata: {
            email: req.user?.email || "test@test.com",
            places: JSON.stringify(buyedPlaces.map((place) => place.number)),
            totalPriceInGrosz: qty * 1000,
            name,
            url,
            description,
            background,
            userId,
          },
        },
        line_items: [
          {
            price_data: {
              currency: "pln",
              unit_amount: 1000,
              product_data: {
                name: "Pixelowe Miejsce",
              },
            },
            quantity: qty,
          },
        ],
        expires_at: Math.ceil(Date.now() / 1000) + 3720,
        success_url: "https://magicianpl.github.io/Kup-Pixele/",
        cancel_url: "https://magicianpl.github.io/Kup-Pixele/",
      },
      {
        stripeAccount: "acct_1KQfEbCOnznOsZux",
      }
    );
    res.status(200).json(buyedPlaces);
    console.log(session);
    setTimeout(() => {
      stripe.checkout.sessions.expire(session.id);
    }, 720000);
    //TODO *********** send res with session url
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

pixelRouter.post("/payments", async (req, res) => {
  //Checking if request is from STRIPE
  const payload = req.body;
  const sig = req.headers["stripe-signature"];
  const endpointSecret =
    "whsec_3614f2537ba0e6dca8acb0ab11f5e42dd7204af88eaa6ee20149695a58ce7e07";
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
      console.log("payment_intent.canceled");
      const buyedPlaces = JSON.parse(event.data.object.metadata.places);
      for (const place of buyedPlaces) {
        console.log("canceling");
        await Pixel.findOneAndUpdate({ _id: place._id }, { isReserved: false });
        console.log("canceled");
      }
    }
    case "payment_intent.succeeded": {
      console.log("Payment succeeeded");
      if (event.data.object.status === "canceled") {
        return;
      } else {
        const buyedPlaces = JSON.parse(event.data.object.metadata.places);
        //code for updating places on isSold: true
        //updating reserved places for sold places
        const { name, url, background, description, userId } =
          event.data.object.metadata;
        setSoldPlaces(buyedPlaces, name, url, background, description, userId);
      }
      break;
    }
    default:
      return null;
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
