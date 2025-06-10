import express from "express";
const app = express();

const port = 4006;
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/user.js";
import userAddress from "./routes/user/userAddress.js"
import categoryRout from "./routes/category.js";
import productRout from "./routes/products.js";
import cartRoute from "./routes/cart/cart_rout.js";
import orderRoute from "./routes/orders/order.js"
import userInfo from "./routes/user/userInfo.js"

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

// User Update routes
app.use("/api/auth", userAddress)
app.use("/api/auth/stat", authenticateUser, userInfo)

// Category routes
app.use("/api/auth/category", authenticateUser, categoryRout);

// Product routes
app.use("/api/auth/product", authenticateUser, productRout);

// Product Cart
app.use("/api/auth/product/cart", authenticateUser, cartRoute);

// Product Order
app.use("/api/auth/product/order", authenticateUser, orderRoute)

app.listen(port, () => {
  console.log("Connected to server");
});
