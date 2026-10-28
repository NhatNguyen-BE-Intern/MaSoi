const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Card = require("../models/Card");
const { DEFAULT_ROLES } = require("../constants/roles");

// API lấy toàn bộ danh sách lá bài từ Database
router.get("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const cards = await Card.find({}).lean().maxTimeMS(2500);
      if (cards && cards.length > 0) {
        return res.status(200).json(cards);
      }
    }
    // Fallback sang DEFAULT_ROLES nếu DB rỗng
    return res.status(200).json(Object.values(DEFAULT_ROLES));
  } catch (error) {
    console.error("Lỗi truy vấn lá bài từ DB, sử dụng danh sách dự phòng:", error.message);
    return res.status(200).json(Object.values(DEFAULT_ROLES));
  }
});

module.exports = router;
