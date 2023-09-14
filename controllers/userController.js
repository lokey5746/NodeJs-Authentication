import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";
import generateToken from "../utilis/generateToken.js";

// @desc Register user
// @route Post /api/users
//  @access Public

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExist = await User.findOne({ email });

  if (userExist) {
    res.status(400);
    throw new Error("User already exist");
  }
  const user = await User.create({ name, email, password });

  if (user) {
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

export { registerUser };
