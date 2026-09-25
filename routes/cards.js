const express = require("express");
const router = express.Router();
const Card = require("../models/Card");

// API lấy toàn bộ danh sách lá bài từ Database
router.get("/", async (req, res) => {
  try {
    const cards = await Card.find({}).lean();
    res.status(200).json(cards);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi server khi lấy danh sách bài", error: error.message });
  }
});

module.exports = router;
