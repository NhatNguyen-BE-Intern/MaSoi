const Card = require("../models/Card");
const { DEFAULT_ROLES } = require("../constants/roles");

/**
 * Tự động chèn và cập nhật các lá bài mặc định vào MongoDB
 */
async function autoSeedCards() {
  try {
    const rolesList = Object.values(DEFAULT_ROLES);
    let addedCount = 0;

    for (const r of rolesList) {
      const existing = await Card.findOne({ name: r.name });
      if (!existing) {
        await Card.create({
          name: r.name,
          team: r.team,
          description: r.description,
          isSpecial: r.isSpecial,
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      console.log(`🌱 Đã cập nhật thành công ${addedCount} lá bài mới (bao gồm Sói Biến Thể) vào Database!`);
    }
  } catch (error) {
    console.error("⚠️ Lỗi khi auto-seed dữ liệu lá bài:", error.message);
  }
}

module.exports = { autoSeedCards };
