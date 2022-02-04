const Pixel = require("../models/pixelModel");

const setSoldPlaces = (
  buyedPlaces,
  name,
  url,
  background,
  description,
  userId
) => {
  return new Promise((resolve, reject) => {
    //If everything is ok - update reserved places for sold places (from previous promise in app)
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
  });
};

module.exports = setSoldPlaces;
