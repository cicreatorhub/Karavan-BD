import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Product from "./models/Product.js";

dotenv.config();
connectDB();

const products = [
  { name: "Wireless Earbuds Pro", price: 12500, category: "Electronics", image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&q=80", stock: 20, description: "Premium sound quality with active noise cancellation and 30hr battery life." },
  { name: "Linen Blend Shirt", price: 8900, category: "Fashion", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80", stock: 15, description: "Breathable linen-cotton blend. Perfect for warm weather." },
  { name: "Ceramic Coffee Mug", price: 3500, category: "Home", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80", stock: 50, description: "Handcrafted ceramic mug, 350ml. Dishwasher safe." },
  { name: "Yoga Mat Premium", price: 15000, category: "Sports", image: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=400&q=80", stock: 12, description: "Non-slip surface, 6mm thick. Eco-friendly materials." },
  { name: "Leather Wallet", price: 6500, category: "Fashion", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80", stock: 30, description: "Slim bifold wallet. Genuine leather, RFID blocking." },
  { name: "Desk Lamp LED", price: 9800, category: "Electronics", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80", stock: 8, description: "Touch control, 5 brightness levels, USB-C charging port." },
];

const seed = async () => {
  try {
    await User.deleteMany();
    await Product.deleteMany();

    await User.create({
      name: "Admin User",
      email: "admin@markethub.com",
      password: "admin123",
      isAdmin: true,
    });

    await Product.insertMany(products);

    console.log("✅ Data seeded successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
