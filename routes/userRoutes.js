import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import {
  registerUser,
  loginUser,
  getUsers,
  getUserProfile,
  getUser,
  updateUser,
  changePassword,
} from "../controllers/userController.js";

const router = express.Router();

router.route("/").post(registerUser).get(protect, getUsers);
router.route("/login").post(loginUser);
router.route("/profile").get(protect, getUserProfile).put(protect, updateUser);
router.route("/changepassword").post(protect, changePassword);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);
router.route("/:id").get(protect, getUser);

export default router;
