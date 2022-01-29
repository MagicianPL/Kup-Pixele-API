const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  const token = jwt.sign(
    user.toObject(),
    process.env.JWT_SECRET || "top_secret"
  );
  return token;
};

module.exports = generateToken;
