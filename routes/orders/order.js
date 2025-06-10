// routes/orderRoutes.js

import express from "express";
import Order from "../../models/order.js";
import User from "../../models/user.js";
import Product from "../../models/product.js";
import authenticateUser from "../../middleware/auth.js";
import ResponseTemplate from "../../utils/ResponseTemplate.js";

const router = express.Router();
router.use(authenticateUser);
// Create a new order
router.post("/", async (req, res) => {
    const response = new ResponseTemplate();

    try {
        const addressId = req.body.shippingAddressId;
        const userId = req.body.userId;
        const incomingProducts = req.body.products;
        const shippingCharges = req.body.shippingCharges || 0;
        const taxAmount = req.body.taxAmount || 0;
        const discountAmount = req.body.discountAmount || 0; // You can modify this as per your discount logic
        const couponCode = req.body.couponCode;
        const paymentMethod = req.body.paymentMethod;
        const notes = req.body.notes;

        if (!userId) {
            return res.status(400).json(response.error("User ID is required", "USER_ID_REQUIRED").getResponse());
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(response.error("User not found", "USER_NOT_FOUND").getResponse());
        }
        // Get shippingAddress from user addresses using addressId
        let shippingAddress = null;
        if (addressId) {
            shippingAddress = user.addresses.id(addressId);
            if (!shippingAddress) {
                return res.status(404).json(response.error("Address not found for user", "ADDRESS_NOT_FOUND").getResponse());
            }
        } else {
            if (user.addresses.length > 0) {
                shippingAddress = user.addresses[0];
            } else {
                return res.status(400).json(response.error("No address found for user", "ADDRESS_NOT_FOUND").getResponse());
            }
        }

        if (!incomingProducts || !Array.isArray(incomingProducts) || incomingProducts.length === 0) {
            return res.status(400).json(response.error("Order must include at least one product", "NO_PRODUCTS").getResponse());
        }

        // Fetch products details like price for each productId
        const productIds = incomingProducts.map((p) => p.productId);
        const dbProducts = await Product.find({ _id: { $in: productIds } });

        // Prepare products array for Order and calculate totalAmount
        let totalAmount = 0;
        const products = incomingProducts.map((item) => {
            const productFromDb = dbProducts.find((p) => p._id.toString() === item.productId);
            if (!productFromDb) {
                throw new Error(`Product not found with id ${item.productId}`);
            }
            const price = productFromDb.price;
            const quantity = item.quantity || 1;
            totalAmount += price * quantity;
            return {
                product: productFromDb._id,
                quantity,
                price,
            };
        });

        // Calculate final total after discount, shipping charges and tax
        const finalAmount = totalAmount - discountAmount + shippingCharges + taxAmount;
        if (finalAmount <= 0) {
            return res.status(400).json(response.error("Final total amount must be greater than 0", "INVALID_TOTAL_AMOUNT").getResponse());
        }

        const timestamp = Date.now();
        const generatedID = `BLYNK-${userId}-${timestamp}`;
        const orderData = {
            orderId: generatedID,
            user: userId,
            products,
            shippingAddress: {
                fullName: shippingAddress.fullName,
                mobileNumber: shippingAddress.mobileNumber,
                addressLine1: shippingAddress.addressLine1,
                addressLine2: shippingAddress.addressLine2,
                landmark: shippingAddress.landmark,
                city: shippingAddress.city,
                district: shippingAddress.district,
                state: shippingAddress.state,
                pinCode: shippingAddress.pinCode,
                addressType: shippingAddress.addressType || "Home",
            },
            totalAmount: finalAmount,
            shippingCharges,
            taxAmount,
            discountAmount,
            couponCode: couponCode || null,
            paymentMethod: paymentMethod || "COD",
            notes: notes || null,
            status: "Pending",
            paymentStatus: "Pending",
            isDelivered: false,
            isCancelled: false,
        };

        const newOrder = new Order(orderData);

        await newOrder.save();
        res.status(201).json(response.success("Order created successfully", newOrder).getResponse());
    } catch (err) {
        res.status(500).json(response.error("Server error", "SERVER_ERROR", err.message).getResponse());
    }
});

// Get all orders (admin)
router.get("/", async (req, res) => {
    const response = new ResponseTemplate();
    try {
        const orders = await Order.find().populate("user").populate("products.product");
        res.json(response.success("Orders fetched", orders).getResponse());
    } catch (err) {
        res.status(500).json(response.error("Server error", "SERVER_ERROR", err.message).getResponse());
    }
});

// Get orders by user
router.get("/user/:userId", async (req, res) => {
    const response = new ResponseTemplate();
    try {
        const orders = await Order.find({ user: req.params.userId }).populate("products.product");
        res.json(response.success("User orders fetched", orders).getResponse());
    } catch (err) {
        res.status(500).json(response.error("Server error", "SERVER_ERROR", err.message).getResponse());
    }
});

// Update order status
router.put("/:orderId/status", async (req, res) => {
    const response = new ResponseTemplate();
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json(response.error("Order not found", "ORDER_NOT_FOUND").getResponse());
        }
        order.status = status;
        await order.save();
        res.json(response.success("Order status updated", order).getResponse());
    } catch (err) {
        res.status(500).json(response.error("Server error", "SERVER_ERROR", err.message).getResponse());
    }
});

// Cancel an order item
router.delete("/:orderId/item/:itemId", async (req, res) => {
    const response = new ResponseTemplate();
    try {
        const { orderId, itemId } = req.params;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json(response.error("Order not found", "ORDER_NOT_FOUND").getResponse());
        }
        order.products = order.products.filter((item) => item._id.toString() !== itemId);
        await order.save();
        res.json(response.success("Order item cancelled", order).getResponse());
    } catch (err) {
        res.status(500).json(response.error("Server error", "SERVER_ERROR", err.message).getResponse());
    }
});

// Track an order
router.get("/:orderId/track", async (req, res) => {
    const response = new ResponseTemplate();
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json(response.error("Order not found", "ORDER_NOT_FOUND").getResponse());
        }
        res.json(response.success("Order tracking info", {
            status: order.status,
            expectedDelivery: order.expectedDelivery
        }).getResponse());
    } catch (err) {
        res.status(500).json(response.error("Server error", "SERVER_ERROR", err.message).getResponse());
    }
});

// Reorder (duplicate a previous order)
router.post("/:orderId/reorder", async (req, res) => {
    const response = new ResponseTemplate();
    try {
        const oldOrder = await Order.findById(req.params.orderId);
        if (!oldOrder) {
            return res.status(404).json(response.error("Previous order not found", "ORDER_NOT_FOUND").getResponse());
        }
        const newOrder = new Order({
            user: oldOrder.user,
            products: oldOrder.products,
            totalAmount: oldOrder.totalAmount,
            status: "Pending",
            shippingAddress: oldOrder.shippingAddress,
        });
        await newOrder.save();
        res.status(201).json(response.success("Reorder successful", newOrder).getResponse());
    } catch (err) {
        res.status(500).json(response.error("Server error", "SERVER_ERROR", err.message).getResponse());
    }
});

// Get monthly order stats (Admin analytics)
router.get("/stats/monthly", async (req, res) => {
    const response = new ResponseTemplate();
    try {
        const stats = await Order.aggregate([
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.json(response.success("Monthly order stats", stats).getResponse());
    } catch (err) {
        res.status(500).json(response.error("Server error", "SERVER_ERROR", err.message).getResponse());
    }
});

export default router;
