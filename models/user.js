const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Tài khoản đăng nhập
  password: { type: String, required: true }, // Mật khẩu
  characterName: {
    type: String,
    unique: true,
    sparse: true,
  },
  // Đã sửa lại thành String để lưu tên nhân vật của bạn bè cho đơn giản
  friends: [{ type: String }],
});

module.exports = mongoose.model("User", userSchema);
