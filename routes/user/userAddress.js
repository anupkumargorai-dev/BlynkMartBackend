import CartSchema from "../../models/cart/CartSchema.js";
import express from "express";
import ResponseTemplate from "../../utils/ResponseTemplate.js";
import authenticateUser from "../../middleware/auth.js";
import User from "../../models/user.js";
import { log } from "console";

const router = express.Router();
router.use(authenticateUser);

// Add Address
router.post("/user/:userId/address", async (req, res) => {
    const { userId } = req.params;
    const addressData = req.body;
    const response = new ResponseTemplate();

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(
                response.error("User not found", "USER_NOT_FOUND").getResponse()
            );
        }
        user.addresses.push(addressData);
        await user.save();

        res.json(
            response
                .success("Address added successfully", addressData)
                .getResponse()
        );
    } catch (err) {
        res.status(500).json(
            response.error("Server error", "SERVER_ERROR", err.message).getResponse()
        );
    }
});

// Update Address
router.put("/user/:userId/address/:addressId", async (req, res) => {
    const { userId, addressId } = req.params;
    const updatedData = req.body;
    const response = new ResponseTemplate();

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(
                response.error("User not found", "USER_NOT_FOUND").getResponse()
            );
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            return res.status(404).json(
                response.error("Address not found", "ADDRESS_NOT_FOUND").getResponse()
            );
        }

        Object.assign(address, updatedData);
        await user.save();

        res.json(
            response
                .success("Address updated successfully", user.addresses)
                .getResponse()
        );
    } catch (err) {
        res.status(500).json(
            response.error("Server error", "SERVER_ERROR", err.message).getResponse()
        );
    }
});

// Delete Address
router.delete("/user/:userId/address/:addressId", async (req, res) => {
    const { userId, addressId } = req.params;
    const response = new ResponseTemplate();

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(
                response.error("User not found", "USER_NOT_FOUND").getResponse()
            );
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            return res.status(404).json(
                response.error("Address not found", "ADDRESS_NOT_FOUND").getResponse()
            );
        }

        address.remove();
        await user.save();

        res.json(
            response
                .success("Address deleted successfully", user.addresses)
                .getResponse()
        );
    } catch (err) {
        res.status(500).json(
            response.error("Server error", "SERVER_ERROR", err.message).getResponse()
        );
    }
});

// Get All Addresses for a User
router.get("/user/:userId/addresses", async (req, res) => {
    const { userId } = req.params;
    const response = new ResponseTemplate();

    try {
        const user = await User.findById(userId).select("addresses");

        if (!user) {
            return res.status(404).json(
                response.error("User not found", "USER_NOT_FOUND").getResponse()
            );
        }

        res.json(
            response
                .success("User addresses fetched successfully", user.addresses)
                .getResponse()
        );
    } catch (err) {
        res.status(500).json(
            response.error("Server error", "SERVER_ERROR", err.message).getResponse()
        );
    }
});

export default router;
