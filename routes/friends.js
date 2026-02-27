const express = require("express");
const router = express.Router();
const User = require("../models/user.js");

// --- 1. TÌM KIẾM NGƯỜI CHƠI THEO TÊN NHÂN VẬT ---
router.get("/search", async (req, res) => {
  try {
    const name = req.query.name;
    const user = await User.findOne({ characterName: name });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy người chơi này!" });
    }

    res.status(200).json({ characterName: user.characterName });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi tìm bạn", error });
  }
});

// --- 2. KẾT BẠN (Thêm tên vào danh sách của nhau) ---
router.post("/add", async (req, res) => {
  try {
    const { myName, friendName } = req.body;

    if (myName === friendName) {
      return res
        .status(400)
        .json({ message: "Không thể tự kết bạn với chính mình!" });
    }

    const me = await User.findOne({ characterName: myName });
    const friend = await User.findOne({ characterName: friendName });

    if (!friend) {
      return res.status(404).json({ message: "Người chơi không tồn tại!" });
    }

    // Kiểm tra xem đã kết bạn chưa
    if (me.friends.includes(friendName)) {
      return res.status(400).json({ message: "Hai người đã là bạn bè rồi!" });
    }

    // Thêm tên nhân vật vào mảng friends của cả 2 người
    me.friends.push(friendName);
    friend.friends.push(myName);

    // Lưu vào Database
    await me.save();
    await friend.save();

    res
      .status(200)
      .json({ message: `Đã kết bạn thành công với ${friendName}!` });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi kết bạn", error });
  }
});

// --- 3. LẤY DANH SÁCH BẠN BÈ ---
router.get("/list/:characterName", async (req, res) => {
  try {
    const user = await User.findOne({
      characterName: req.params.characterName,
    });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    res.status(200).json({ friends: user.friends });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi tải danh sách", error });
  }
});

module.exports = router;
