import CartSchema from "../../models/cart/CartSchema.js";
import express from "express";
import ResponseTemplate from "../../utils/ResponseTemplate.js";
import authenticateUser from "../../middleware/auth.js";

const router = express.Router();
router.use(authenticateUser);

router.get("/userStatus", async (req, res) => {
  try {
    const responseHandler = new ResponseTemplate();
    const { userId, productId } = req.body;
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
