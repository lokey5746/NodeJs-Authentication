import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import {
  registerUser,
  loginUser,
  getUsers,
  getUserProfile,
  getUser,
} from "../controllers/userController.js";

const router = express.Router();

router.route("/").post(registerUser).get(protect, getUsers);
router.route("/login").post(loginUser);
router.route("/profile").get(protect, getUserProfile);
router.route("/:id").get(protect, getUser);

export default router;
