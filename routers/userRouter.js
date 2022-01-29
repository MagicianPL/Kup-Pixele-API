const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const generateToken = require("../helpers/generateToken");
const authUser = require("../helpers/authUser");

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

userRouter.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ message: "Adres e-mail nie może być pusty" });
    }
    //if email doesn't exist
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Nieprawidłowy e-mail lub hasło" });
    }
    //If password is correct
    if (bcrypt.compareSync(req.body.password, user.password)) {
      const loggedUser = {
        _id: user._id,
        login: user.login,
        email: user.email,
        token: generateToken(user),
      };
      res.status(200).json(loggedUser);
    } else {
      return res
        .status(404)
        .json({ message: "Nieprawidłowy e-mail lub hasło" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

userRouter.put("/update", authUser, async (req, res) => {
  const { login, email, password } = req.body;
  if (!login || !email || !password) {
    return res.status(400).json({ message: "Otrzymano niepełne informacje" });
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user._id },
      { login, email, password: bcrypt.hashSync(password, 8) }
    );
    res.status(200).json({
      login: updatedUser.login,
      email: updatedUser.email,
      password: updatedUser.password,
      _id: updatedUser._id,
      token: generateToken(updatedUser),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = userRouter;
