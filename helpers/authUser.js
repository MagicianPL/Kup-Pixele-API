const jwt = require("jsonwebtoken");

const authUser = (req, res, next) => {
  //const authHeader = req.headers["authorization"];
  //Bearer token
  const token = ""; //authHeader && authHeader.split(" ")[1];

  if (!token) {
    //return res.status(401).json({ message: "Brak dostępu" });
    req.user = {
      _id: "61f502932a6e105ec2f7e650",
      email: "test@teeest.pl",
    };
    next();
  }

  /*jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: err.message });
    }
    req.user = user;
    next();
  });*/
};

module.exports = authUser;
