import mongoose from "mongoose";
import Category from "../models/category.js";
import Tag from "../models/tag.js";
import Review from "../models/review.js";
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      default: "No description available",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    discountPrice: {
      type: {
        original: { type: Number, required: true },
        calculated: { type: Number, default: 0 },
      },
      required: true,
      default: {
        original: 0,
        calculated: 0,
      },
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    images: [
      {
        url: String,
        path: String,
      },
    ],
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: [],
      },
    ],
    tags: [
      // {
      //   type: mongoose.Schema.Types.ObjectId,
      //   ref: "Tag",
      //   default: [],
      // },
    ],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
        default: [],
      },
    ],
    ratings: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming the User model exists
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field to calculate and set discountPrice.calculated
productSchema.pre("save", function (next) {
  if (this.discountPercentage > 0 && this.price > 0) {
    this.discountPrice.calculated =
      this.price - this.price * (this.discountPercentage / 100);
  } else {
    this.discountPrice.calculated = this.price; // No discount
  }
  this.discountPrice.original = this.price;
  next();
});

const Product = mongoose.model("Product", productSchema);

export default Product;
