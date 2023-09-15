import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";

import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

connectDB();
const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running");
});
app.use("/api/v1/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(
  5000,
  console.log(`Server running ${process.env.NODE_ENV} mode on port ${PORT}`)
);
