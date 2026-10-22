/**
 * Tự động tạo kịch bản gọi đêm (Night Sequence) dựa trên các lá bài có trong ván
 * @param {Array} deckRoles - Danh sách lá bài trong ván chơi
 * @returns {Array} Kịch bản từng bước gọi đêm dành cho Quản trò
 */
function generateNightOrder(deckRoles) {
  const roleNames = deckRoles
    .map((r) => (r && r.name ? r.name.toLowerCase().trim() : ""))
    .filter(Boolean);

  const hasRole = (keyword) => roleNames.some((n) => n.includes(keyword.toLowerCase()));
  const order = [];

  // 1. Bảo Vệ
  if (hasRole("bảo vệ") || hasRole("guard")) {
    order.push({
      step: 1,
      roleName: "Bảo Vệ",
      title: "🛡️ Bảo Vệ thức giấc",
      instruction:
        "Quản trò gọi: 'Bảo vệ thức dậy! Hãy chỉ tay vào 1 người bạn muốn bảo vệ đêm nay.'",
      team: "Dân",
    });
  }

  // 2. Bầy Sói
  const hasWolves = deckRoles.some(
    (r) =>
      r &&
      (r.team === "Sói" ||
        (r.name && (r.name.toLowerCase().includes("sói") || r.name.toLowerCase().includes("wolf")))),
  );
  if (hasWolves) {
    order.push({
      step: 2,
      roleName: "Ma Sói",
      title: "🐺 Phe Ma Sói thức giấc",
      instruction:
        "Quản trò gọi: 'Ma Sói thức dậy! Hãy nhận diện đồng đội và thống nhất chỉ tay chọn 1 con mồi đêm nay.'",
      team: "Sói",
    });
  }

  // 3. Phù Thủy
  if (hasRole("phù thủy") || hasRole("witch")) {
    order.push({
      step: 3,
      roleName: "Phù Thủy",
      title: "🧙 Phù Thủy thức giấc",
      instruction:
        "Quản trò gọi: 'Phù Thủy thức dậy! Đêm nay có người bị cắn (chỉ tay vào nạn nhân). Bạn có muốn dùng bình cứu không? Có muốn dùng bình độc không?'",
      team: "Dân",
    });
  }

  // 4. Tiên Tri
  if (hasRole("tiên tri") || hasRole("seer")) {
    order.push({
      step: 4,
      roleName: "Tiên Tri",
      title: "🔮 Tiên Tri thức giấc",
      instruction:
        "Quản trò gọi: 'Tiên Tri thức dậy! Hãy chỉ tay vào 1 người bạn muốn soi danh tính. (Quản trò gật đầu nếu là Sói, lắc đầu nếu là Dân)'",
      team: "Dân",
    });
  }

  // 5. Cả làng thức giấc
  order.push({
    step: 5,
    roleName: "Trời Sáng",
    title: "☀️ Cả làng thức giấc!",
    instruction:
      "Quản trò gọi: 'Trời đã sáng rồi! Cả làng cùng thức dậy. Đêm qua...' (Thông báo người bị loại nếu có).",
    team: "Tất cả",
  });

  return order;
}

module.exports = { generateNightOrder };
