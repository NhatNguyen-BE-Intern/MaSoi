const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user");

// --- 1. API ĐĂNG KÝ TÀI KHOẢN ---
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Kiểm tra xem tài khoản đã tồn tại chưa
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Tài khoản này đã có người sử dụng!" });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo user mới (lúc này characterName vẫn đang trống)
    const newUser = new User({
      username,
      password: hashedPassword,
    });

    await newUser.save();
    res
      .status(201)
      .json({ message: "Đăng ký thành công! Giờ bạn có thể đăng nhập." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi đăng ký", error });
  }
});

// --- 2. API ĐĂNG NHẬP ---
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Tìm user trong Database
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Tài khoản không tồn tại!" });
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu!" });
    }

    // Đăng nhập thành công, trả về thông tin user (không trả về password)
    res.status(200).json({
      message: "Đăng nhập thành công!",
      user: {
        id: user._id,
        username: user.username,
        characterName: user.characterName, // Nếu chưa tạo tên, cái này sẽ là undefined
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi đăng nhập", error });
  }
});

// --- 3. API TẠO TÊN NHÂN VẬT ---
router.post("/create-character", async (req, res) => {
  try {
    const { userId, characterName } = req.body;

    // Kiểm tra xem tên nhân vật này có ai lấy chưa (vì tên này dùng để kết bạn)
    const existingCharacter = await User.findOne({ characterName });
    if (existingCharacter) {
      return res.status(400).json({
        message: "Tên nhân vật này đã có người lấy, vui lòng chọn tên khác!",
      });
    }

    // Tìm user và cập nhật tên nhân vật
    const user = await User.findByIdAndUpdate(
      userId,
      { characterName: characterName },
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
    res.status(500).json({ message: "Lỗi server khi tạo tên nhân vật", error });
  }
});

module.exports = router;
