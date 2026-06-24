import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// @route   POST /api/upload   (admin only) - field name: "image"
router.post("/", protect, admin, upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "markethub" },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    res.json({ url: result.secure_url });
  } catch (err) {
    next(err);
  }
});

export default router;
