import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    image: {
      url: String,
      path: String,
    },
    description: {
      type: String,
      maxlength: 500,
      default: "No description available",
    },
    relatedCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      // Delete all related categories
      await this.model("Category").deleteMany({
        _id: { $in: this.relatedCategories },
      });
      next();
    } catch (err) {
      next(err);
    }
  }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
