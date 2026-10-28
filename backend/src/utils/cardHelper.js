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
    code: raw.code || undefined,
    name: String(raw.name || "Dân Làng").trim(),
    team: String(raw.team || "Dân").trim(),
    description: String(
      raw.description ||
        "Ngủ say vào ban đêm. Ban ngày cùng thảo luận và biểu quyết treo cổ Ma Sói.",
    ).trim(),
    isSpecial: !!raw.isSpecial,
  };
}

/**
 * Kiểm tra xem một vai trò có thuộc phe Ma Sói chủ động (thức giấc cùng bầy, chat bầy sói, tính điều kiện thắng) hay không
 * @param {Object} role - Dữ liệu thẻ bài
 * @param {Object} [state] - Online Game State (nếu có, để kiểm tra Kẻ Phản Bội đã thức tỉnh chưa)
 * @returns {boolean}
 */
function isRoleWolf(role, state = null) {
  if (!role) return false;
  const name = String(role.name || "").toLowerCase().trim();
  const team = String(role.team || "").trim();
  const code = String(role.code || role._id || "").toUpperCase().trim();

  // 1. Bán Sói (Lycan): Luôn thuộc phe Dân Làng! (Chỉ Tiên Tri soi ra Sói)
  if (name.includes("bán sói") || name.includes("lycan") || code === "LYCAN") {
    return false;
  }

  // 2. Người Hóa Sói (Doppelganger): Chỉ là Sói nếu ĐÃ thừa kế vai trò phe Sói
  if (name.includes("hóa sói") || name.includes("doppelganger")) {
    return team === "Sói" && !name.includes("người hóa sói");
  }

  // 3. Sói Nguyền (Cursed Wolf): Ban đầu là phe Dân, chỉ là Sói khi đã bị cắn và biến đổi ("Ma Sói (Đã Thức Tỉnh)")
  if (name.includes("sói nguyền") && team !== "Sói") {
    return false;
  }

  // 4. Kẻ Phản Bội (Traitor): Chỉ là Sói chủ động khi bầy Sói nguyên bản đã chết và Kẻ Phản Bội đã thức tỉnh
  if (name.includes("phản bội") || name.includes("traitor") || code === "TRAITOR") {
    if (state && !state.traitorAwakened) {
      return false;
    }
  }

  // 5. Các vai trò Ma Sói chính thức
  if (
    team === "Sói" ||
    name.includes("ma sói") ||
    name.includes("sói đầu đàn") ||
    name.includes("sói con") ||
    name.includes("sói trắng") ||
    name.includes("sói già") ||
    name.includes("sói ẩn") ||
    name.includes("sói lửa") ||
    name.includes("sói băng") ||
    name.includes("werewolf") ||
    name.includes("wolf")
  ) {
    return true;
  }

  return false;
}

/**
 * Kiểm tra xem vai trò có thuộc Phe Thứ 3 / Phe Độc Lập / Phe Trung Lập hay không
 */
function isRoleThirdParty(role) {
  if (!role) return false;
  const team = String(role.team || "").toLowerCase().trim();
  const name = String(role.name || "").toLowerCase().trim();
  const code = String(role.code || role._id || "").toUpperCase().trim();

  if (
    team === "thứ 3" ||
    team === "trung lập" ||
    team === "solo" ||
    team === "third_party" ||
    team === "neutral"
  ) {
    return true;
  }

  return (
    name.includes("sát thủ") ||
    name.includes("serial killer") ||
    name.includes("kẻ độc hành") ||
    name.includes("arsonist") ||
    name.includes("kẻ chán đời") ||
    name.includes("tanner") ||
    code === "SERIAL_KILLER" ||
    code === "ARSONIST" ||
    code === "TANNER"
  );
}

/**
 * Kiểm tra xem vai trò có thuộc Phe Dân Làng hay không
 */
function isRoleVillager(role, state = null) {
  if (!role) return false;
  if (isRoleWolf(role, state)) return false;
  if (isRoleThirdParty(role)) return false;
  return true;
}

module.exports = {
  sanitizeCard,
  isRoleWolf,
  isRoleThirdParty,
  isRoleVillager,
};

