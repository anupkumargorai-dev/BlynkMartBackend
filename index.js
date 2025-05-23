import express from "express";
const app = express();

const port = 4006;
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/user.js";
import categoryRout from "./routes/category.js";
import productRout from "./routes/products.js";
import cartRoute from "./routes/cart/cart_rout.js";

import authenticateUser from "./middleware/auth.js";

dotenv.config();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const MONGOOSE_URL = process.env.MONGODB_URI

main()
  .then(() => {
    console.log("connected to db");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(MONGOOSE_URL);
}

// User authentication routes
app.use("/api/unauth", authRoutes);

// Category routes
app.use("/api/auth/category", authenticateUser, categoryRout);

// Product routes
app.use("/api/auth/product", authenticateUser, productRout);

// Product Cart
app.use("/api/auth/product/cart", authenticateUser, cartRoute);

app.listen(port, () => {
  console.log("Connected to server");
});
