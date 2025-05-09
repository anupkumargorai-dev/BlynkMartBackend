import express from "express";
import CartSchema from "../../models/cart/CartSchema.js";
import ResponseTemplate from "../../utils/ResponseTemplate.js";
import authenticateUser from "../../middleware/auth.js";
import Product from "../../models/product.js";

const router = express.Router();
router.use(authenticateUser);

router.get("/", async (req, res) => {
  const { userId } = req.query;
  try {
    const responseHandler = new ResponseTemplate();

    const cart = await CartSchema.findOne({ userId }).populate(
      "items.productId"
    );
    if (!cart || cart.items.length === 0) {
      return res
        .status(200)
        .json(
          responseHandler
            .success("Cart Items", { items: [], totalPrice: 0 })
            .getResponse()
        );
    }
    const items = cart.items.map((item) => ({
      _id: item._id,
      productId: item.productId._id, // Only the ID
      name: item.productId.name,
      price: item.productId.price,
      quantity: item.quantity,
      productPrice: item.productPrice,
      itemTotalPrice: item.itemTotalPrice,
      image: item.productId.images?.[0]?.url || "", // First image or empty string
    }));
    res
      .status(200)
      .json(
        responseHandler
          .success("Cart Items", { items, totalPrice: cart.totalPrice })
          .getResponse()
      );
  } catch (err) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/add", async (req, res) => {
  const { productId, quantity, userId } = req.body;

  try {
    const responseHandler = new ResponseTemplate();
    let cart = await CartSchema.findOne({ userId: userId });

    if (!cart) {
      cart = new CartSchema({
        userId: userId,
        items: [],
        totalPrice: 0,
      });
    }

    // Check if product is already in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    const product = await Product.findById(productId);
    const productPrice = product.price;

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].itemTotalPrice = quantity * productPrice;
    } else {
      cart.items.push({
        productId,
        quantity,
        productPrice,
        itemTotalPrice: quantity * productPrice,
      });
    }

    await cart.save();
    return res
      .status(200)
      .json(
        responseHandler
          .success("Added to cart successfully", { cart })
          .getResponse()
      );
  } catch (err) {
    const responseHandler = new ResponseTemplate();
    return res
      .status(500)
      .json(
        responseHandler
          .error("Failed to add to cart", "SERVER_ERROR", err.message)
          .getResponse()
      );
  }
});

router.post("/removeOne", async (req, res) => {
  try {
    const responseHandler = new ResponseTemplate();

    const { userId, productId } = req.body;

    const cart = await CartSchema.findOne({ userId });

    if (!cart) {
      return res
        .status(404)
        .json(responseHandler.error("Cart not Found").getResponse());
    }

    // Find the item in the cart
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(202).json({ message: "Item not found in cart" });
    }

    // Get the product price from the Product collection
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json(responseHandler.error("Product not Found").getResponse());
    }

    // Decrease quantity or remove item if quantity is 1
    if (cart.items[itemIndex].quantity > 1) {
      cart.items[itemIndex].quantity -= 1;
      cart.items[itemIndex].totalPrice -= product.price; // Update total price
    } else {
      cart.items.splice(itemIndex, 1); // Remove the item if quantity becomes 0
    }

    // Recalculate the cart's total amount
    cart.totalAmount = cart.items.reduce(
      (acc, item) => acc + item.totalPrice,
      0
    );

    await cart.save();

    res
      .status(200)
      .json(
        responseHandler
          .success("Item quantity and price updated", { cart })
          .getResponse()
      );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/removeAll", async (req, res) => {
  try {
    const responseHandler = new ResponseTemplate();
    const { userId, productId } = req.body;

    const cart = await CartSchema.findOne({ userId });

    if (!cart) {
      return res
        .status(404)
        .json(responseHandler.error("Cart not found").getResponse());
    }

    // Filter out the product to remove it from the cart
    const updatedItems = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    // If no change in items, product was not in cart
    if (updatedItems.length === cart.items.length) {
      return res
        .status(202)
        .json(responseHandler.error("Product not found in cart").getResponse());
    }

    // Update cart items and recalculate total price
    cart.items = updatedItems;
    cart.totalPrice = updatedItems.reduce(
      (acc, item) => acc + item.itemTotalPrice,
      0
    );

    await cart.save();

    return res
      .status(200)
      .json(
        responseHandler
          .success("Product removed from cart", { cart })
          .getResponse()
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        responseHandler
          .error("Failed to remove product", "SERVER_ERROR", error.message)
          .getResponse()
      );
  }
});

router.get("/checkCart", async (req, res) => {
  try {
    const responseHandler = new ResponseTemplate();
    const { userId, productId } = req.query;
    if (!userId || !productId) {
      return res
        .status(400)
        .json(
          responseHandler
            .error("User ID and Product ID are required")
            .getResponse()
        );
    }
    const cart = await CartSchema.findOne({ userId });
    if (cart) {
      const itemExists = cart.items.some(
        (item) => item.productId.toString() === productId
      );

      if (itemExists) {
        return res
          .status(200)
          .json(responseHandler.success("Item exists in cart").getResponse());
      } else {
        return res
          .status(404)
          .json(responseHandler.error("Item not found in cart").getResponse());
      }
    } else {
      return res
        .status(200)
        .json(responseHandler.success("Cart not exist").getResponse());
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
