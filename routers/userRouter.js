const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");

const userRouter = express.Router();

//USER REGISTER
userRouter.post("/register", async (req, res) => {
  try {
    const newUser = new User({
      login: req.body.login,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
    });

    const existingEmail = await User.findOne({ email: req.body.email });
    if (existingEmail) {
      return res.status(400).json({ message: "Adres e-mail już istnieje" });
    }

    if (req.body.password.length < 6) {
      return res
        .status(400)
        .json({ message: "Hasło musi składać się z co najmniej 6 znaków" });
    }
    //if email doesn't exist - create new account (user)
    await newUser.save();
    res.status(201).json({ login: newUser.login, email: newUser.email });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = userRouter;
