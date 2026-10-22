/**
 * Làm sạch dữ liệu thẻ bài từ Mongoose doc hoặc plain object
 * @param {Object} c - Dữ liệu thô của thẻ bài
 * @returns {Object|null}
 */
function sanitizeCard(c) {
  if (!c) return null;
  const raw = typeof c.toObject === "function" ? c.toObject() : (c._doc || c);
  return {
    _id: raw._id ? raw._id.toString() : undefined,
    name: String(raw.name || "Dân Làng").trim(),
    team: String(raw.team || "Dân").trim(),
    description: String(
      raw.description ||
        "Ngủ say vào ban đêm. Ban ngày cùng thảo luận và biểu quyết treo cổ Ma Sói.",
    ).trim(),
    isSpecial: !!raw.isSpecial,
  };
}

module.exports = { sanitizeCard };
