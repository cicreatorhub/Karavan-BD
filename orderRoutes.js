import express from "express";
import axios from "axios";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
});

// @route   POST /api/orders
// @desc    Create order + initialize Paystack transaction
router.post("/", protect, async (req, res, next) => {
  try {
    const { items, shippingAddress } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: "No order items" });

    // Re-validate prices and stock from DB (never trust client-sent prices)
    let itemsPrice = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product ${item.productId} not found` });
      if (product.stock < item.qty) return res.status(400).json({ message: `${product.name} is out of stock` });

      itemsPrice += product.price * item.qty;
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        qty: item.qty,
      });
    }

    const shippingPrice = 0; // free delivery
    const totalPrice = itemsPrice + shippingPrice;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      itemsPrice,
      shippingPrice,
      totalPrice,
    });

    // Initialize Paystack transaction (amount in kobo)
    const paystackRes = await paystack.post("/transaction/initialize", {
      email: req.user.email,
      amount: Math.round(totalPrice * 100),
      callback_url: `${process.env.CLIENT_URL}/order-success`,
      metadata: { orderId: order._id.toString(), userId: req.user._id.toString() },
    });

    order.paymentReference = paystackRes.data.data.reference;
    await order.save();

    res.status(201).json({
      order,
      authorization_url: paystackRes.data.data.authorization_url,
      reference: paystackRes.data.data.reference,
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/orders/verify/:reference
// @desc    Verify Paystack payment and mark order as paid
router.get("/verify/:reference", protect, async (req, res, next) => {
  try {
    const { reference } = req.params;
    const verifyRes = await paystack.get(`/transaction/verify/${reference}`);
    const { status, amount } = verifyRes.data.data;

    const order = await Order.findOne({ paymentReference: reference });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (status === "success" && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.status = "Processing";
      await order.save();

      // Decrement stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
      }
    }

    res.json({ verified: status === "success", order });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/orders/webhook
// @desc    Paystack webhook (set this URL in Paystack dashboard for reliability)
router.post("/webhook", express.json(), async (req, res) => {
  const crypto = await import("crypto");
  const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest("hex");
  if (hash !== req.headers["x-paystack-signature"]) return res.sendStatus(401);

  const event = req.body;
  if (event.event === "charge.success") {
    const reference = event.data.reference;
    const order = await Order.findOne({ paymentReference: reference });
    if (order && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.status = "Processing";
      await order.save();
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
      }
    }
  }
  res.sendStatus(200);
});

// @route   GET /api/orders/myorders
router.get("/myorders", protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/orders/:id
router.get("/:id", protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/orders  (admin only - all orders)
router.get("/", protect, admin, async (req, res, next) => {
  try {
    const orders = await Order.find({}).populate("user", "name email").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/orders/:id/status  (admin only)
router.put("/:id/status", protect, admin, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = req.body.status;
    if (req.body.status === "Delivered") order.deliveredAt = Date.now();

    const updated = await order.save();
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
