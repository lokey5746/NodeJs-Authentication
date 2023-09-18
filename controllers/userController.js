import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";
import generateToken from "../utilis/generateToken.js";
import crypto from "crypto";
import Token from "../models/tokenModel.js";

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

// @desc  update user
// @route PUT /api/v1/users/:id
// @access Private

const updateUser = asyncHandler(async (req, res) => {
  const { email, name, password } = req.body;

  // check if email is already taken
  const emailExist = await User.findOne({ email });

  if (emailExist) {
    throw new Error("email already taken");
  } else {
    // check if user update password
    if (password) {
      // update with password
      const user = await User.findByIdAndUpdate(
        req.userAuth._id,
        {
          email,
          password: await hashPassword(password),
          name,
        },
        {
          new: true,
          runValidators: true,
        }
      );
      res.status(200).json({
        status: "success",
        data: user,
        message: "User Update sucessfully",
      });
    } else {
      // update without password
      const user = await User.findByIdAndUpdate(
        req.userAuth._id,
        {
          email,
          name,
        },
        {
          new: true,
          runValidators: true,
        }
      );
      res.status(200).json({
        status: "success",
        data: user,
        message: "User Update sucessfully",
      });
    }
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userAuth._id);
  const { oldPassword, password } = req.body;
  if (!user) {
    throw new Error("user not found");
  }
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("feilds are empty");
  }

  // check oldPassword With Password in DB
  const correctPassword = await verifyPassword(oldPassword, password);
  // save new password
  if (user && correctPassword) {
    user.password = password;
    await user.save();
    res.status(200).send("password change successfully");
  } else {
    res.status(400);
    throw new Error("old password is incorrect");
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("user not found");
  }
  // dleting exiting token from Db
  let token = await Token.findOne({ userId: userAuth._id });
  if (token) {
    await token.deleteOne();
  }
  // create token
  let resetToken = crypto.randomBytes(32).toString("hex") + userAuth._id;
  // hash token
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  await new Token({
    userId: userAuth._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000),
  }).save();
  // construct reset url

  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  // Reset Email
  const message = `
   <h2>Hello ${userAuth.name}</h2>
   <p>Please use the url below to reset your password</p>  
   <p>This reset link is valid for only 30minutes.</p>
   <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
   <p>Regards...</p>
   <p>HA IT Team</p>
 `;
  const subject = "Password Reset Request";
  const send_to = userAuth.email;
  const sent_from = process.env.EMAIL_USER;
  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: "Reset Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  // Hash token, then compare token in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  // find token in Db
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });
  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired Token");
  }
  // Find user
  const user = await User.findOne({ _id: userToken.userId });
  user.password = password;
  await user.save();
  res.status(200).json({
    message: "Password Reset Successful, Please Login",
  });
});

export {
  registerUser,
  loginUser,
  getUsers,
  getUserProfile,
  getUser,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
};
