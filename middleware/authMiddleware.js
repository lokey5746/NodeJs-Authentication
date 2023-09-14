import User from "../models/userModel.js";
import verifyToken from "../utilis/verifyToken.js";

const protect = asyncHandler(async (req, res, next) => {
  // get token
  const headerObj = req.headers;
  const token = headerObj?.authorization?.split(" ")[1];
  // verify token
  const verifiedToken = verifyToken(token);
  if (verifiedToken) {
    const user = await Admin.findById(verifiedToken.id).select(
      "name email role"
    );
    req.userAuth = user;
    // console.log(req.userAuth);
    next();
  } else {
    const err = new Error("Token expired/invalid");
    next(err);
  }
});

export { protect };
