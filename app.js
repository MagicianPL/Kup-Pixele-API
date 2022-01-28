const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const pixelRouter = require("./routers/pixelsRouter");
const userRouter = require("./routers/userRouter");

const port = process.env.PORT || 5000;

//Connection to DB
mongoose
  .connect(process.env.DB_CONNECTION)
  .then(() => {
    console.log("Connected to the database");
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  })
  .catch((err) => console.log(err));

//middleware
app.use(cors());
app.use(bodyParser.json());

//routers
app.use("/api/pixels", pixelRouter);
app.use("/api/user", userRouter);

app.get("/", (req, res) => {
  res.send("Homepage");
});
