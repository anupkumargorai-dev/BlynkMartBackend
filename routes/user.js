import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import ResponseTemplate from "../utils/ResponseTemplate.js";
import { omitFields } from "../utils/ext.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const responseHandler = new ResponseTemplate();
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json(
        responseHandler
          .error(
            "All fields are required",
            "MISSING_FIELDS",
            "Please provide email and password"
          )
          .getResponse()
      );
  }
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      if (userExists) {
        return res
          .status(400)
          .json(
            responseHandler
              .error(
                "User already exists",
                "USER_EXISTS",
                "A user with this email already exists in the system."
              )
              .getResponse()
          );
      }
    }
    const user = new User({ email, password });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Send successful response
    res.status(201).json(
      responseHandler
        .success("User registered successfully", {
          user: {
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            addresses: user.addresses || [],
          },
          token: token,
        })
        .getResponse()
    );
  } catch (err) {
    res
      .status(500)
      .json(
        responseHandler
          .error("Server error", "SERVER_ERROR", err.message)
          .getResponse()
      );
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Create an instance of ResponseTemplate
  const response = new ResponseTemplate();

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json(
          response
            .error(
              "Invalid credentials",
              "USER_NOT_FOUND",
              "No user found with the provided email."
            )
            .getResponse()
        );
    }

    // Check if the password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(400)
        .json(
          response
            .error(
              "Invalid credentials",
              "INVALID_PASSWORD",
              "The provided password is incorrect."
            )
            .getResponse()
        );
    }

    // Generate JWT token with 7 days expiry
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d", // Set token expiration to 7 days
    });

    const userWithoutSensitiveInfo = omitFields(user, ["password"]);

    // Send successful response
    res.json(
      response
        .success("Login successful", {
          user: userWithoutSensitiveInfo,
          token: token,
        })
        .getResponse()
    );
  } catch (err) {
    res
      .status(500)
      .json(
        response
          .error("Server error", "SERVER_ERROR", err.message)
          .getResponse()
      );
  }
});

export default router;
