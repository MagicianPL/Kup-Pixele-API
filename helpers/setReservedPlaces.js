const getRandomArrayIndex = require("./getRandomArrayIndex");
const Pixel = require("../models/pixelModel");

const setReservedPlaces = (qty, buyedPlaces) => {
  return new Promise(async (resolve, reject) => {
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

    if (buyedPlaces.length === qty) {
      resolve();
    } else {
      reject({ message: "Wystąpił błąd z wymaganą ilością" });
    }
  });
};

module.exports = setReservedPlaces;
