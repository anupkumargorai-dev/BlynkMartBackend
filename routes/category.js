import express from "express";
import Category from "../models/category.js";
import ResponseTemplate from "../utils/ResponseTemplate.js";
import authenticateUser from "../middleware/auth.js";

import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../storage/storage.js";

import multer from "multer";

const router = express.Router();

router.use(authenticateUser);

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./upload");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

let upload = multer({ storage: storage });


router.post("/add", upload.single("image"), async (req, res) => {
  const responseHandler = new ResponseTemplate();
  const { name, description, relatedCategories, createdBy } = req.body;
  console.log("image" + req.file);
  if (!name || !createdBy) {
    return res
      .status(400)
      .json(
        responseHandler
          .error("All required fields must be provided", "MISSING_FIELDS")
          .getResponse()
      );
  }

  let imageUrl = null;
  let imagePublicId = null;

  try {
    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.path,
        "categories"
      );
      if (uploadResult.message === "Success") {
        imageUrl = uploadResult.url;
        imagePublicId = uploadResult.public_id;
      } else {
        return res
          .status(500)
          .json(
            responseHandler
              .error("Cloud Error", "SERVER_ERROR_IMG", err.message)
              .getResponse()
          );
      }
    } else {
      return res
        .status(500)
        .json(
          responseHandler
            .error("Failed to add category", "SERVER_ERROR_IMG", err.message)
            .getResponse()
        );
    }

    const category = new Category({
      name,
      image: {
        url: imageUrl,
        path: imagePublicId,
      },
      description,
      relatedCategories,
      createdBy,
    });
    // Save to the database
    await category.save();

    // Send success response
    return res
      .status(200)
      .json(
        responseHandler
          .success("Category added successfully", { category })
          .getResponse()
      );
  } catch (err) {
    console.log(imagePublicId);
    await deleteFromCloudinary(imagePublicId);
    return res
      .status(500)
      .json(
        responseHandler
          .error("Failed to add category", "SERVER_ERROR", err.message)
          .getResponse()
      );
  }
});

// GET all category
router.get("/", async (req, res) => {
  const responseHandler = new ResponseTemplate();
  try {
    const categories = await Category.find()
      .populate("relatedCategories", "name image")
      .populate("createdBy", "name email")
      .exec();

    return res
      .status(200)
      .json(
        responseHandler
          .success("Categories fetched successfully", { categories })
          .getResponse()
      );
  } catch (err) {
    return res
      .status(500)
      .json(
        responseHandler
          .error("Failed to fetch categories", "SERVER_ERROR", error.message)
          .getResponse()
      );
  }
});

// Route to fetch a category by ID
router.get("/:id", async (req, res) => {
  const responseHandler = new ResponseTemplate();
  const { id } = req.params;

  try {
    // Fetch the category by ID and populate relatedCategories
    const category = await Category.findById(id).populate(
      "relatedCategories",
      "name image"
    );

    if (!category) {
      return res
        .status(404)
        .json(
          responseHandler
            .error("Category not found", "CATEGORY_NOT_FOUND")
            .getResponse()
        );
    }

    return res
      .status(200)
      .json(
        responseHandler
          .success("Category fetched successfully", { category })
          .getResponse()
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        responseHandler
          .error("Failed to fetch category", "SERVER_ERROR", error.message)
          .getResponse()
      );
  }
});

//Delete routes

router.post("/delete", async (req, res) => {
  const responseHandler = new ResponseTemplate();
  const { id } = req.body;

  try {
    const category = await Category.findById(id);

    if (!category) {
      return res
        .status(404)
        .json(
          responseHandler
            .error("Category not found", "CATEGORY_NOT_FOUND")
            .getResponse()
        );
    }
    const response = await deleteFromCloudinary(category.image.path);
    console.log(response);
    await category.deleteOne();

    return res
      .status(200)
      .json(
        responseHandler
          .success("Category and related categories deleted successfully")
          .getResponse()
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        responseHandler
          .error("Failed to delete category", "SERVER_ERROR", error.message)
          .getResponse()
      );
  }
});

// Delete a related category from the category's relatedCategories array
router.delete(
  "/:categoryId/related-categories/:relatedCategoryId",
  async (req, res) => {
    const responseHandler = new ResponseTemplate();
    const { categoryId, relatedCategoryId } = req.params;

    try {
      const category = await Category.findById(categoryId);

      if (!category) {
        return res
          .status(404)
          .json(
            responseHandler
              .error("Category not found", "CATEGORY_NOT_FOUND")
              .getResponse()
          );
      }

      const index = category.relatedCategories.indexOf(relatedCategoryId);

      if (index === -1) {
        return res
          .status(404)
          .json(
            responseHandler
              .error("Related category not found", "RELATED_CATEGORY_NOT_FOUND")
              .getResponse()
          );
      }

      // Remove the related category from the array
      category.relatedCategories.splice(index, 1);

      // Save the updated category
      await category.save();

      return res.status(200).json(
        responseHandler
          .success("Related category deleted successfully", {
            category,
          })
          .getResponse()
      );
    } catch (error) {
      return res
        .status(500)
        .json(
          responseHandler
            .error(
              "Failed to delete related category",
              "SERVER_ERROR",
              error.message
            )
            .getResponse()
        );
    }
  }
);

// Update route

// Update category route
router.post("/update", upload.single("image"), async (req, res) => {
  const responseHandler = new ResponseTemplate();
  const { id } = req.body;
  const { name, description, relatedCategories } = req.body;
  console.log(">>" + id);
  try {
    // Find the category by ID
    const category = await Category.findById(id)
      .populate("createdBy", "name email")
      .exec();

    if (!category) {
      return res
        .status(404)
        .json(
          responseHandler
            .error("Category not found", "CATEGORY_NOT_FOUND")
            .getResponse()
        );
    }

    let imageUrl = null;
    let imagePublicId = null;
    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.path,
        "categories"
      );
      if (uploadResult.message === "Success") {
        imageUrl = uploadResult.url;
        imagePublicId = uploadResult.public_id;
        const response = await deleteFromCloudinary(category.image.path);
        console.log(response);
        category.image.url = imageUrl;
        category.image.path = imagePublicId;
      } else {
        return res
          .status(500)
          .json(
            responseHandler
              .error("Cloud Error", "SERVER_ERROR_IMG", err.message)
              .getResponse()
          );
      }
    }

    // Update the category fields
    category.name = name || category.name;
    category.description = description || category.description;
    category.relatedCategories =
      relatedCategories || category.relatedCategories;

    // Save the updated category
    await category.save();

    return res.status(200).json(
      responseHandler
        .success("Category updated successfully", {
          category,
        })
        .getResponse()
    );
  } catch (error) {
    return res
      .status(500)
      .json(
        responseHandler
          .error("Failed to update category", "SERVER_ERROR", error.message)
          .getResponse()
      );
  }
});

// Update related categories route
router.patch("/:id/related-categories", async (req, res) => {
  const responseHandler = new ResponseTemplate();
  const { id } = req.params;
  const { relatedCategories } = req.body;

  if (!Array.isArray(relatedCategories)) {
    return res
      .status(400)
      .json(
        responseHandler
          .error("relatedCategories must be an array", "INVALID_DATA")
          .getResponse()
      );
  }

  try {
    // Find the category by ID
    const category = await Category.findById(id);

    if (!category) {
      return res
        .status(404)
        .json(
          responseHandler
            .error("Category not found", "CATEGORY_NOT_FOUND")
            .getResponse()
        );
    }

    // Update the relatedCategories field
    category.relatedCategories = relatedCategories;

    // Save the updated category
    await category.save();

    return res.status(200).json(
      responseHandler
        .success("Related categories updated successfully", {
          category,
        })
        .getResponse()
    );
  } catch (error) {
    return res
      .status(500)
      .json(
        responseHandler
          .error(
            "Failed to update related categories",
            "SERVER_ERROR",
            error.message
          )
          .getResponse()
      );
  }
});

export default router;
