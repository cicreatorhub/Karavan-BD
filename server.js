import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

app.get("/api/seed", async (req, res) => {
  const User = (await import("./models/User.js")).default;
  const Product = (await import("./models/Product.js")).default;
  await User.deleteMany();
  await Product.deleteMany();
  await User.create({ name:"Admin", email:"admin@karavan.com", password:"admin123", isAdmin:true });
  res.json({ message: "Seeded!" });
});

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

app.get("/", (req, res) => res.json({ message: "MarketHub API is running" }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
