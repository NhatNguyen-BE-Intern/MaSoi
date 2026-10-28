const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true }, // Tài khoản đăng nhập
  password: { type: String, required: true }, // Mật khẩu
  characterName: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  friends: [{ type: String }],
  sessionToken: { type: String },
});

module.exports = mongoose.model("User", userSchema);
