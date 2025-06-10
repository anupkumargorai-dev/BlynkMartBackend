import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        products: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                price: {
                    type: Number,
                    required: true,
                },
            },
        ],
        shippingAddress: {
            fullName: { type: String, required: true },
            mobileNumber: { type: String, required: true },
            addressLine1: { type: String, required: true },
            addressLine2: { type: String },
            landmark: { type: String },
            city: { type: String, required: true },
            district: { type: String },
            state: { type: String, required: true },
            pinCode: { type: String, required: true },
            addressType: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        shippingCharges: {
            type: Number,
            default: 0,
        },
        taxAmount: {
            type: Number,
            default: 0,
        },
        discountAmount: {
            type: Number,
            default: 0,
        },
        couponCode: {
            type: String,
        },
        expectedDelivery: {
            type: Date,
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending",
        },
        transactionId: {
            type: String,
        },
        isDelivered: {
            type: Boolean,
            default: false,
        },
        deliveredAt: {
            type: Date,
        },
        isCancelled: {
            type: Boolean,
            default: false,
        },
        cancelledAt: {
            type: Date,
        },
        cancelReason: {
            type: String,
        },
        notes: {
            type: String,
        },
        status: {
            type: String,
            enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
            default: "Pending",
        },
    },
    {
        timestamps: true,
    }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
