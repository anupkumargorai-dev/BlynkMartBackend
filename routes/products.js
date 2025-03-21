import express from "express";
import Product from "../models/product.js";
import Category from "../models/category.js";
import Tag from "../models/tag.js";
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

// POST route to create a new product
router.post("/newProduct", upload.array("images"), async (req, res) => {
  const responseHandler = new ResponseTemplate();
  try {
    const {
      name,
      description,
      price,
      discountPercentage,
      stock,
      categories,
      tags,
      createdBy,
      isActive,
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !stock || !createdBy) {
      res.status(400).json(
        responseHandler
          .error("Missing required fields", "VALIDATION_ERROR", {
            missingFields: [
              "name",
              "price",
              "stock",
              "createdBy",
              "description",
            ].filter((field) => !req.body[field]),
          })
          .getResponse()
      );
    }

    console.log(req.body);

    // Validate categories and tags
    const categoryList = categories ? JSON.parse(categories) : [];
    const tagList = tags ? JSON.parse(tags) : [];

    const validCategories = await Category.find({ _id: { $in: categoryList } });
    // const validTags = await Tag.find({ _id: { $in: tagList } });

    if (categoryList.length !== validCategories.length) {
      return res
        .status(400)
        .json(
          responseHandler
            .error("One or more categories are invalid.", "VALIDATION_ERROR")
            .getResponse()
        );
    }

    // if (tagList.length !== validTags.length) {
    //   return res
    //     .status(400)
    //     .json(ResponseTemplate.error("One or more tags are invalid."));
    // }

    // Upload images to Cloudinary
    const imageFiles = req.files;
    console.log(">>>>images" + imageFiles.length);
    if (!imageFiles.length > 0) {
      return res
        .status(400)
        .json(
          responseHandler
            .error("Need Product Images.", "MISSING_IMAGES")
            .getResponse()
        );
    }

    const uploadedImages = [];
    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        const uploadResult = await uploadToCloudinary(file.path, "products");
        uploadedImages.push({
          url: uploadResult.url,
          path: uploadResult.public_id,
        });
      }
    }

    let tagListData = [];

    if (tags) {
      tagListData = JSON.parse(tags);
    }

    // Create the product object
    const product = new Product({
      name,
      description,
      price,
      discountPercentage,
      stock,
      categories: validCategories.map((category) => category._id),
      tags: tagListData,
      images: uploadedImages,
      createdBy,
      isActive: isActive || true, // Default to active
    });

    // Save the product to the database
    await product.save();

    res
      .status(201)
      .json(
        responseHandler
          .success("Product created successfully", product)
          .getResponse()
      );
  } catch (error) {
    console.error("Error creating product:", error);
    res
      .status(500)
      .json(
        responseHandler
          .error("An error occurred while creating the product.")
          .getResponse()
      );
  }
});

// GET route to fetch products
///products?search=phone
///products?tag=<tag_id>
///products?minPrice=100&maxPrice=1000
// /products?page=2&limit=10
router.get("/", async (req, res) => {
  const responseHandler = new ResponseTemplate();
  try {
    const {
      search, // Search by product name or description
      category, // Filter by category
      tag, // Filter by tag
      minPrice, // Minimum price filter
      maxPrice, // Maximum price filter
      sortBy = "createdAt", // Field to sort by
      sortOrder = "desc", // Sort order: asc or desc
      page = 1, // Current page
      limit = 10, // Items per page
    } = req.query;

    const filters = {};

    // Search by name or description
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category
    if (category) {
      filters.categories = category; // Assuming category is an ObjectId
    }

    // Filter by tag
    if (tag) {
      filters.tags = tag; // Assuming tag is an ObjectId
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = Number(minPrice);
      if (maxPrice) filters.price.$lte = Number(maxPrice);
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const itemsPerPage = Number(limit);

    // Fetch products with filtering, sorting, and pagination
    const products = await Product.find(filters)
      .populate("categories", "name") // Populate categories with their names
      .populate("tags", "name") // Populate tags with their names
      .populate("reviews", "rating comment") // Populate reviews with specific fields
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(itemsPerPage);

    // Get total product count for pagination metadata
    const totalCount = await Product.countDocuments(filters);

    res.status(200).json(
      new ResponseTemplate()
        .success("Products fetched successfully.", {
          products,
          pagination: {
            totalItems: totalCount, // Total number of products in the database
            currentPage: Number(page), // Current page number (from the request)
            totalPages: Math.ceil(totalCount / itemsPerPage), // Total pages based on items per page
            itemsPerPage: itemsPerPage, // Number of items returned per page
          },
        })
        .getResponse()
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return res
      .status(404)
      .json(
        responseHandler
          .error("An error occurred while fetching products.")
          .getResponse()
      );
  }
});

// Delete Product
router.post("/delete", async (req, res) => {
  const responseHandler = new ResponseTemplate();
  try {
    const { id } = req.body;

    if (!id) {
      return res
        .status(400) // Use 400 for bad requests
        .json(responseHandler.error("Invalid Request.").getResponse());
    }

    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json(responseHandler.error("Product not found.").getResponse());
    }

    // Delete images from Cloudinary
    const imagesList = product.images || [];
    await Promise.all(
      imagesList.map((image) => deleteFromCloudinary(image.path))
    );

    // Delete the product
    await product.deleteOne(); // Await the deletion

    return res
      .status(200)
      .json(
        responseHandler.success("Product deleted successfully").getResponse()
      );
  } catch (err) {
    console.error(err);
    return res
      .status(500) // Use 500 for server errors
      .json(
        responseHandler
          .error("An error occurred while deleting the product.")
          .getResponse()
      );
  }
});

// Edit Product
router.post("/edit", async (req, res) => {
  const responseHandler = new ResponseTemplate();
  try {
    const { id, name, price, description, images } = req.body; // Add required fields

    if (!id) {
      return res
        .status(400) // Bad Request
        .json(
          responseHandler
            .error("Invalid Request. Product ID is required.")
            .getResponse()
        );
    }

    let product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json(responseHandler.error("Product not found.").getResponse());
    }

    // Handle image updates
    if (images && images.length > 0) {
      // Delete old images from Cloudinary
      await Promise.all(
        product.images.map((image) => deleteFromCloudinary(image.path))
      );

      // Assign new images
      product.images = images;
    }

    // Update product fields
    product.name = name || product.name;
    product.price = price || product.price;
    product.description = description || product.description;

    // Save updated product
    await product.save();

    return res
      .status(200)
      .json(
        responseHandler.success("Product updated successfully").getResponse()
      );
  } catch (err) {
    console.error(err);
    return res
      .status(500) // Server error
      .json(
        responseHandler
          .error("An error occurred while updating the product.")
          .getResponse()
      );
  }
});

export default router;
