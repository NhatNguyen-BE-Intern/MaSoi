const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Tên lá bài (VD: Tiên tri, Sói, Dân làng)
  team: { type: String, required: true }, // Phe phái (VD: Dân, Sói, Phe thứ 3)
  description: { type: String, required: true }, // Mô tả chức năng để hiện lên cho người chơi đọc
  isSpecial: { type: Boolean, default: true }, // Phân biệt bài có chức năng và Dân làng thường
});

module.exports = mongoose.model("Card", cardSchema);
