import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";
import generateToken from "../utilis/generateToken.js";

import { hashPassword, verifyPassword } from "../utilis/helpers.js";

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
  const user = await User.create({
    name,
    email,
    password: await hashPassword(password),
  });

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

// @desc Login user
// @route Post /api/users
//  @access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // find user

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ message: "User not exist" });
  }
  // verify password

  const isMatched = await verifyPassword(password, user.password);
  if (!isMatched) {
    return res.json({ message: "Invalid login" });
  } else {
    return res.json({
      data: generateToken(user._id),
      message: "User logged in successfully",
    });
  }
});

// @desc Get user
// @route Get /api/users
//  @access Public

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    data: users,
    message: "Users fetched successfully",
  });
});

// @desc Get Profile
// @route Get /api/user/profile
//  @access Private

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userAuth._id).select(
    "-password -createdAt -updatedAt"
  );
  if (!user) {
    throw new Error("User not found");
  } else
    [
      res.status(200).json({
        status: "success",
        data: user,
        message: "User profile fetch sucessfuly",
      }),
    ];
});

//@desc Get user By ID
//@route GET /api/users/:id
//@access Private/Admin

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    throw new Error("User not found");
  } else {
    res.status(200).json({
      status: "success",
      data: user,
      message: "user found successfully",
    });
  }
});

export { registerUser, loginUser, getUsers, getUserProfile, getUser };
