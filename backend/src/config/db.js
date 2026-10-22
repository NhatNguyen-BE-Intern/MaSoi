const mongoose = require("mongoose");
const { MONGODB_URI } = require("./env");

/**
 * Kết nối tới cơ sở dữ liệu MongoDB Atlas
 */
async function connectDB() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI chưa được định nghĩa trong file .env!");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Đã kết nối thành công với MongoDB Atlas!");
  } catch (err) {
    console.error("❌ Lỗi kết nối MongoDB Atlas:", err.message);
  }
}

module.exports = { connectDB };
