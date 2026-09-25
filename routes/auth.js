const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/user");

// --- 1. API ĐĂNG KÝ TÀI KHOẢN ---
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      !username ||
      !password ||
      typeof username !== "string" ||
      typeof password !== "string"
    ) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ tài khoản và mật khẩu hợp lệ!" });
    }

    const cleanUsername = username.trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res
        .status(400)
        .json({ message: "Tên tài khoản phải từ 3 đến 30 ký tự!" });
    }

    if (password.length < 6 || password.length > 100) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải từ 6 đến 100 ký tự!" });
    }

    // Kiểm tra xem tài khoản đã tồn tại chưa
    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Tài khoản này đã có người sử dụng!" });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo user mới (characterName để undefined để không bị duplicate key với sparse index)
    const newUser = new User({
      username: cleanUsername,
      password: hashedPassword,
    });

    await newUser.save();
    res
      .status(201)
      .json({ message: "Đăng ký thành công! Giờ bạn có thể đăng nhập." });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Tên tài khoản này đã có người sử dụng!" });
    }
    res.status(500).json({ message: "Lỗi server khi đăng ký", error: error.message });
  }
});

// --- 2. API ĐĂNG NHẬP ---
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      !username ||
      !password ||
      typeof username !== "string" ||
      typeof password !== "string"
    ) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ tài khoản và mật khẩu!" });
    }

    const cleanUsername = username.trim();

    // Tìm user trong Database
    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
      return res.status(400).json({ message: "Tài khoản không tồn tại!" });
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu!" });
    }

    // Đăng nhập thành công, trả về thông tin user
    res.status(200).json({
      message: "Đăng nhập thành công!",
      user: {
        id: user._id,
        username: user.username,
        characterName: user.characterName || undefined,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi đăng nhập", error: error.message });
  }
});

// --- 3. API TẠO TÊN NHÂN VẬT ---
router.post("/create-character", async (req, res) => {
  try {
    const { userId, characterName } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Mã người dùng không hợp lệ!" });
    }

    if (
      !characterName ||
      typeof characterName !== "string" ||
      !characterName.trim()
    ) {
      return res.status(400).json({ message: "Vui lòng nhập tên nhân vật hợp lệ!" });
    }

    const cleanName = characterName.trim();
    if (cleanName.length < 2 || cleanName.length > 25) {
      return res
        .status(400)
        .json({ message: "Tên nhân vật phải từ 2 đến 25 ký tự!" });
    }

    // Kiểm tra xem tên nhân vật này có ai lấy chưa
    const existingCharacter = await User.findOne({ characterName: cleanName });
    if (existingCharacter) {
      return res.status(400).json({
        message: "Tên nhân vật này đã có người lấy, vui lòng chọn tên khác!",
      });
    }

    // Tìm user và cập nhật tên nhân vật
    const user = await User.findByIdAndUpdate(
      userId,
      { characterName: cleanName },
      { new: true }, // Trả về data mới sau khi update
    );

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }

    res.status(200).json({
      message: "Tạo tên nhân vật thành công!",
      characterName: user.characterName,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Tên nhân vật này đã có người sử dụng, vui lòng chọn tên khác!" });
    }
    res.status(500).json({ message: "Lỗi server khi tạo tên nhân vật", error: error.message });
  }
});

module.exports = router;
