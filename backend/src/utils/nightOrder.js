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

  // 1. Thần Tình Yêu (Cupid - thức dậy đêm đầu tiên)
  if (hasRole("tình yêu") || hasRole("cupid")) {
    order.push({
      step: order.length + 1,
      roleName: "Thần Tình Yêu",
      title: "💘 Thần Tình Yêu thức giấc (Đêm 1)",
      instruction:
        "Quản trò gọi: 'Thần Tình Yêu thức dậy! Hãy chọn 2 người để ghép đôi yêu nhau. Sau đó Quản trò chạm vai 2 người đó để nhận biết.'",
      team: "Dân",
    });
  }

  // 1.5. Người Quan Sát (Beholder - thức dậy đêm đầu tiên)
  if (hasRole("quan sát") || hasRole("beholder") || hasRole("nhìn trộm")) {
    order.push({
      step: order.length + 1,
      roleName: "Người Quan Sát",
      title: "👁️ Người Quan Sát thức giấc (Đêm 1)",
      instruction:
        "Quản trò gọi: 'Người Quan Sát thức dậy! Quản trò chỉ tay cho bạn biết ai là Tiên Tri thật sự của ngôi làng.'",
      team: "Dân",
    });
  }

  // 2. Bảo Vệ
  if (hasRole("bảo vệ") || hasRole("guard")) {
    order.push({
      step: order.length + 1,
      roleName: "Bảo Vệ",
      title: "🛡️ Bảo Vệ thức giấc",
      instruction:
        "Quản trò gọi: 'Bảo vệ thức dậy! Hãy chỉ tay vào 1 người bạn muốn bảo vệ đêm nay (không được chọn cùng 1 người 2 đêm liên tiếp).'",
      team: "Dân",
    });
  }

  // 3. Bầy Sói
  const hasWolves = deckRoles.some(
    (r) =>
      r &&
      (r.team === "Sói" ||
        (r.name && (r.name.toLowerCase().includes("sói") || r.name.toLowerCase().includes("wolf")))),
  );
  if (hasWolves) {
    order.push({
      step: order.length + 1,
      roleName: "Ma Sói",
      title: "🐺 Phe Ma Sói thức giấc",
      instruction:
        "Quản trò gọi: 'Ma Sói thức dậy! Hãy nhận diện đồng đội và thống nhất chỉ tay chọn 1 con mồi đêm nay.'",
      team: "Sói",
    });
  }

  // 4. Phù Thủy
  if (hasRole("phù thủy") || hasRole("witch")) {
    order.push({
      step: order.length + 1,
      roleName: "Phù Thủy",
      title: "🧙 Phù Thủy thức giấc",
      instruction:
        "Quản trò gọi: 'Phù Thủy thức dậy! Đêm nay có người bị cắn (chỉ tay vào nạn nhân). Bạn có muốn dùng bình cứu không? Có muốn dùng bình độc không?'",
      team: "Dân",
    });
  }

  // 5. Tiên Tri
  if (hasRole("tiên tri") || hasRole("seer")) {
    order.push({
      step: order.length + 1,
      roleName: "Tiên Tri",
      title: "🔮 Tiên Tri thức giấc",
      instruction:
        "Quản trò gọi: 'Tiên Tri thức dậy! Hãy chỉ tay vào 1 người bạn muốn soi danh tính. (Quản trò gật đầu nếu là Sói, lắc đầu nếu là Dân)'",
      team: "Dân",
    });
  }

  // 5.5. Thợ Săn Bóng Đêm
  if (hasRole("thợ săn bóng đêm") || hasRole("shadow hunter") || hasRole("bóng đêm")) {
    order.push({
      step: order.length + 1,
      roleName: "Thợ Săn Bóng Đêm",
      title: "🏹 Thợ Săn Bóng Đêm thức giấc",
      instruction:
        "Quản trò gọi: 'Thợ Săn Bóng Đêm thức dậy! Bạn có muốn dùng phát đạn duy nhất để bắn 1 kẻ thuộc Phe Thứ 3 không? (Nếu chỉ đúng Phe Thứ 3, Quản trò gật đầu và mục tiêu tử trận).'",
      team: "Dân",
    });
  }

  // 6. Thợ Săn (Nhắc nhở)
  if (hasRole("thợ săn") || hasRole("hunter")) {
    order.push({
      step: order.length + 1,
      roleName: "Thợ Săn",
      title: "🎯 Kích hoạt Thợ Săn (Nếu tử trận)",
      instruction:
        "Lưu ý cho Quản trò: Nếu Thợ Săn bị loại đêm qua hoặc bị treo cổ, Thợ Săn lập tức có quyền nổ súng chỉ định 1 người chơi khác cùng tử trận.",
      team: "Dân",
    });
  }

  // 7. Cả làng thức giấc
  order.push({
    step: order.length + 1,
    roleName: "Trời Sáng",
    title: "☀️ Cả làng thức giấc!",
    instruction:
      "Quản trò gọi: 'Trời đã sáng rồi! Cả làng cùng thức dậy. Đêm qua...' (Thông báo người bị loại nếu có, sau đó bắt đầu bấm giờ thảo luận).",
    team: "Tất cả",
  });

  return order;
}

module.exports = { generateNightOrder };
