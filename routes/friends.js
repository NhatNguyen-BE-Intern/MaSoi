const express = require("express");
const router = express.Router();
const User = require("../models/user.js");

// --- 1. TÌM KIẾM NGƯỜI CHƠI THEO TÊN NHÂN VẬT ---
router.get("/search", async (req, res) => {
  try {
    const name = req.query.name;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập tên nhân vật hợp lệ!" });
    }

    const cleanName = name.trim();
    const user = await User.findOne({ characterName: cleanName });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy người chơi này!" });
    }

    res.status(200).json({ characterName: user.characterName });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi tìm bạn", error: error.message });
  }
});

// --- 2. KẾT BẠN (Thêm tên vào danh sách của nhau) ---
router.post("/add", async (req, res) => {
  try {
    const { myName, friendName } = req.body;

    if (
      !myName ||
      !friendName ||
      typeof myName !== "string" ||
      typeof friendName !== "string" ||
      !myName.trim() ||
      !friendName.trim()
    ) {
      return res.status(400).json({ message: "Tên nhân vật không hợp lệ!" });
    }

    const cleanMyName = myName.trim();
    const cleanFriendName = friendName.trim();

    if (cleanMyName.toLowerCase() === cleanFriendName.toLowerCase()) {
      return res
        .status(400)
        .json({ message: "Không thể tự kết bạn với chính mình!" });
    }

    const me = await User.findOne({ characterName: cleanMyName });
    if (!me) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản của bạn! Hãy đảm bảo bạn đã tạo tên nhân vật." });
    }

    const friend = await User.findOne({ characterName: cleanFriendName });
    if (!friend) {
      return res.status(404).json({ message: "Người chơi cần kết bạn không tồn tại!" });
    }

    if (!Array.isArray(me.friends)) me.friends = [];
    if (!Array.isArray(friend.friends)) friend.friends = [];

    // Kiểm tra xem đã kết bạn chưa
    if (me.friends.includes(cleanFriendName)) {
      return res.status(400).json({ message: "Hai người đã là bạn bè rồi!" });
    }

    // Thêm tên nhân vật vào mảng friends của cả 2 người
    me.friends.push(cleanFriendName);
    friend.friends.push(cleanMyName);

    // Lưu vào Database
    await me.save();
    await friend.save();

    res
      .status(200)
      .json({ message: `Đã kết bạn thành công với ${cleanFriendName}!` });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi kết bạn", error: error.message });
  }
});

// --- 3. LẤY DANH SÁCH BẠN BÈ ---
router.get("/list/:characterName", async (req, res) => {
  try {
    const characterName = req.params.characterName;
    if (!characterName || typeof characterName !== "string" || !characterName.trim()) {
      return res.status(400).json({ message: "Tên nhân vật không hợp lệ!" });
    }

    const user = await User.findOne({
      characterName: characterName.trim(),
    });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    res.status(200).json({ friends: user.friends || [] });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi tải danh sách", error: error.message });
  }
});

module.exports = router;
