import mongoose from "mongoose";

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        productPrice: { type: Number, required: true }, // Store product price
        itemTotalPrice: { type: Number, required: true, default: 0 }, // quantity * productPrice
      },
    ],
    totalPrice: { type: Number, default: 0 }, // Sum of all itemTotalPrice
  },
  { timestamps: true }
);

CartSchema.pre("save", function (next) {
  this.items.forEach((item) => {
    item.itemTotalPrice = item.quantity * item.productPrice; // Calculate per item
  });
  this.totalPrice = this.items.reduce(
    (sum, item) => sum + item.itemTotalPrice,
    0
  );
  next();
});

const Cart = mongoose.model("Cart", CartSchema);

export default Cart;
