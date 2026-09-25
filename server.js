const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const Card = require("./models/Card"); // Load model Card để chia bài

// Khởi tạo app và server
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// --- KẾT NỐI MONGODB ATLAS ---
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Đã kết nối thành công với MongoDB Atlas!"))
  .catch((err) => console.error("❌ Lỗi kết nối MongoDB Atlas:", err));

// --- CÁC ĐƯỜNG DẪN API (ROUTES) ---
const authRoutes = require("./routes/auth");
const friendRoutes = require("./routes/friends");
const cardRoutes = require("./routes/cards");

app.use("/api/auth", authRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/cards", cardRoutes);

// Fallback phục vụ giao diện Next.js SPA
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.startsWith("/socket.io")) {
    return res.sendFile(path.join(__dirname, "public", "index.html"));
  }
  next();
});

// --- XỬ LÝ REALTIME (SOCKET.IO) ---
const rooms = {};
const roomGameData = {};

// Quản lý timeout khi người chơi disconnect tạm thời (F5, chuyển mạng)
const disconnectGraceTimers = new Map(); // key: `${roomCode}_${characterName}`, value: timerId
const roomEmptyCleanupTimers = new Map(); // key: roomCode, value: timerId

function generateNightOrder(deckRoles) {
  const roleNames = deckRoles
    .map((r) => (r && r.name ? r.name.toLowerCase().trim() : ""))
    .filter(Boolean);

  const hasRole = (keyword) => roleNames.some((n) => n.includes(keyword.toLowerCase()));
  const order = [];

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

io.on("connection", (socket) => {
  console.log(`⚡ Một thiết bị vừa kết nối: ${socket.id}`);

  // 1. TẠO PHÒNG (Chống trùng mã phòng với phòng đang tồn tại)
  socket.on("create_room", (user) => {
    if (!user || !user.characterName) {
      return socket.emit("error_msg", "Thông tin người dùng không hợp lệ!");
    }

    let roomCode;
    let attempts = 0;
    do {
      roomCode = Math.floor(1000 + Math.random() * 9000).toString();
      attempts++;
    } while (rooms[roomCode] && attempts < 1000);

    rooms[roomCode] = [{ ...user, socketId: socket.id, isHost: true }];
    socket.join(roomCode);
    socket.emit("room_created", roomCode);
    io.to(roomCode).emit("update_players", rooms[roomCode]);
  });

  // 2. VÀO PHÒNG (Hỗ trợ Reconnect mượt mà khi F5 / rớt mạng)
  socket.on("join_room", (data) => {
    const { roomCode, user } = data;
    if (!roomCode || !user || !user.characterName) {
      return socket.emit("error_msg", "Dữ liệu vào phòng không hợp lệ!");
    }

    if (!rooms[roomCode]) {
      return socket.emit("error_msg", "Phòng không tồn tại hoặc đã bị giải tán!");
    }

    // Hủy bộ đếm dọn phòng trống nếu có ai đó kết nối lại
    if (roomEmptyCleanupTimers.has(roomCode)) {
      clearTimeout(roomEmptyCleanupTimers.get(roomCode));
      roomEmptyCleanupTimers.delete(roomCode);
    }

    // Hủy grace timer disconnect của người chơi này nếu đang chạy
    const graceKey = `${roomCode}_${user.characterName}`;
    if (disconnectGraceTimers.has(graceKey)) {
      clearTimeout(disconnectGraceTimers.get(graceKey));
      disconnectGraceTimers.delete(graceKey);
      console.log(`🔄 Hủy bộ đếm rời phòng, khôi phục ${user.characterName} trong phòng ${roomCode}`);
    }

    const activeGame = roomGameData[roomCode];
    const existingPlayer = rooms[roomCode].find(
      (p) => p.characterName === user.characterName,
    );

    // Nếu ván đấu đang diễn ra mà người này không thuộc phòng từ trước
    if (activeGame && !existingPlayer) {
      return socket.emit(
        "error_msg",
        "Trận đấu trong phòng này đang diễn ra! Bạn không thể vào giữa ván.",
      );
    }

    if (!existingPlayer) {
      rooms[roomCode].push({ ...user, socketId: socket.id, isHost: false });
    } else {
      existingPlayer.socketId = socket.id;
    }

    socket.join(roomCode);
    socket.emit("room_joined", roomCode);
    io.to(roomCode).emit("update_players", rooms[roomCode]);

    // --- HỖ TRỢ PHỤC HỒI KHI F5 / RỚT MẠNG VÀO LẠI TRẬN ĐẤU ĐANG CHẠY ---
    if (activeGame) {
      // 1. Nếu là Quản trò kết nối lại
      if (activeGame.moderator && activeGame.moderator.characterName === user.characterName) {
        activeGame.moderator.socketId = socket.id;
        socket.emit("receive_role", {
          isModerator: true,
          name: "Quản Trò (Game Master)",
          team: "Quản Trò",
          description:
            "Bạn là Quản Trò - nắm giữ toàn bộ diễn biến của ngôi làng. Hãy sử dụng bảng điều khiển này để điều hành trận đấu trực tiếp!",
          roomCode,
          moderatorData: {
            players: activeGame.players,
            allCards: activeGame.cardsInGame,
            nightOrder: activeGame.nightOrder,
            wolves: activeGame.players
              .filter((p) => p.role && (p.role.team === "Sói" || p.role.name?.includes("Sói")))
              .map((p) => p.characterName),
          },
        });
      } else {
        // 2. Nếu là người chơi thường kết nối lại
        const inGamePlayer = activeGame.players.find(
          (p) => p.characterName === user.characterName,
        );
        if (inGamePlayer) {
          inGamePlayer.socketId = socket.id;
          socket.emit("receive_role", {
            ...inGamePlayer.role,
            isAlive: inGamePlayer.isAlive !== undefined ? inGamePlayer.isAlive : true,
            isModerator: false,
            roomCode,
            moderatorName: activeGame.moderator ? activeGame.moderator.characterName : null,
          });

          // CẬP NHẬT LẬP TỨC CHO QUẢN TRÒ DANH SÁCH MỚI (bao gồm socketId mới)
          if (activeGame.moderator) {
            io.to(activeGame.moderator.socketId).emit(
              "moderator_players_updated",
              activeGame.players,
            );
          }
        }
      }
    }
  });

  // 3. BẮT ĐẦU GAME VÀ PHÁT BÀI / QUẢN TRÒ
  socket.on("start_game", async (data) => {
    const { roomCode, mode, customDeck, moderatorMode, moderatorSocketId } = data;
    const roomPlayers = rooms[roomCode];

    if (!roomPlayers || roomPlayers.length === 0) return;

    // BẢO VỆ: Chỉ Chủ phòng mới có quyền bắt đầu ván game
    const hostPlayer = roomPlayers.find((p) => p.isHost);
    if (!hostPlayer || hostPlayer.socketId !== socket.id) {
      return socket.emit("error_msg", "Chỉ có Chủ phòng mới có quyền bắt đầu ván game!");
    }

    // Xác định người làm Quản trò
    let moderator = null;
    if (moderatorMode === "host") {
      moderator = roomPlayers.find((p) => p.isHost) || roomPlayers[0];
    } else if (moderatorMode === "select" && moderatorSocketId) {
      moderator = roomPlayers.find((p) => p.socketId === moderatorSocketId) || roomPlayers[0];
    } else if (moderatorMode === "random") {
      const randIdx = Math.floor(Math.random() * roomPlayers.length);
      moderator = roomPlayers[randIdx];
    }

    // Danh sách người nhận lá bài chơi (không bao gồm quản trò nếu có)
    const playersToDeal = moderator
      ? roomPlayers.filter((p) => p.socketId !== moderator.socketId)
      : [...roomPlayers];

    if (playersToDeal.length === 0) {
      return socket.emit(
        "error_msg",
        "Cần ít nhất 1 người chơi nhận bài!",
      );
    }

    const playerCount = playersToDeal.length;
    let deck = [];
    let allCards = [];
    try {
      allCards = await Card.find({});
    } catch (err) {
      console.error("Lỗi lấy danh sách bài từ DB:", err);
    }

    // Fallback nếu database chưa có đủ dữ liệu
    const defaultWolf = allCards.find((c) => c.name === "Ma Sói (Thường)") ||
      allCards.find((c) => c.team === "Sói") || {
        _id: "wolf_default",
        name: "Ma Sói (Thường)",
        team: "Sói",
        description: "Mỗi đêm thức dậy cùng bầy sói chọn 1 người dân để cắn.",
        isSpecial: true,
      };

    const defaultVillager = allCards.find((c) => c.name === "Dân Làng") || {
      _id: "villager_default",
      name: "Dân Làng",
      team: "Dân",
      description: "Ngủ say vào ban đêm. Ban ngày cùng thảo luận và biểu quyết treo cổ Ma Sói.",
      isSpecial: false,
    };

    const defaultSeer = allCards.find((c) => c.name === "Tiên Tri") || {
      _id: "seer_default",
      name: "Tiên Tri",
      team: "Dân",
      description: "Mỗi đêm được thức dậy chọn soi thân phận của 1 người chơi bất kỳ.",
      isSpecial: true,
    };

    const defaultGuard = allCards.find((c) => c.name === "Bảo Vệ") || {
      _id: "guard_default",
      name: "Bảo Vệ",
      team: "Dân",
      description: "Mỗi đêm được chọn bảo vệ 1 người chơi an toàn trước nanh vuốt loài Sói.",
      isSpecial: true,
    };

    if (mode === "custom" && customDeck && typeof customDeck === "object") {
      let totalSelected = 0;
      for (const [cardId, count] of Object.entries(customDeck)) {
        const num = Math.max(0, Math.min(50, Math.floor(Number(count) || 0)));
        if (num > 0) {
          const cardInfo = allCards.find((c) => c._id.toString() === cardId);
          if (cardInfo) {
            for (let i = 0; i < num; i++) {
              deck.push(cardInfo);
              totalSelected++;
            }
          }
        }
      }
      if (totalSelected !== playerCount) {
        return socket.emit(
          "error_msg",
          `Số lượng bài (${totalSelected}) không khớp với số người chơi (${playerCount})! (Không tính Quản trò)`,
        );
      }
    } else {
      // Tự động cân bằng bài
      let wolfCount = Math.floor(playerCount / 4) || 1;
      for (let i = 0; i < wolfCount; i++) deck.push(defaultWolf);

      if (playerCount >= 4) deck.push(defaultSeer);
      if (playerCount >= 5) deck.push(defaultGuard);

      while (deck.length < playerCount) {
        deck.push(defaultVillager);
      }
    }

    // Trộn bài (Fisher-Yates Shuffle)
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Lưu dữ liệu ván đấu
    const dealtPlayers = playersToDeal.map((p, index) => ({
      characterName: p.characterName,
      socketId: p.socketId,
      role: deck[index],
      isAlive: true,
    }));

    // Lọc danh sách thẻ bài duy nhất trong ván
    const uniqueCardsMap = new Map();
    deck.forEach((c) => {
      if (c && c.name && !uniqueCardsMap.has(c.name)) {
        uniqueCardsMap.set(c.name, c);
      }
    });
    const cardsInGame = Array.from(uniqueCardsMap.values());

    roomGameData[roomCode] = {
      moderator: moderator
        ? { socketId: moderator.socketId, characterName: moderator.characterName }
        : null,
      players: dealtPlayers,
      cardsInGame,
      nightOrder: generateNightOrder(deck),
    };

    // 1. Phát bài cho người chơi thường
    dealtPlayers.forEach((player) => {
      io.to(player.socketId).emit("receive_role", {
        ...player.role,
        isAlive: true,
        isModerator: false,
        roomCode,
        moderatorName: moderator ? moderator.characterName : null,
      });
    });

    // 2. Gửi dữ liệu Dashboard đầy đủ cho Quản trò
    if (moderator) {
      io.to(moderator.socketId).emit("receive_role", {
        isModerator: true,
        name: "Quản Trò (Game Master)",
        team: "Quản Trò",
        description:
          "Bạn là Quản Trò - nắm giữ toàn bộ diễn biến của ngôi làng. Hãy sử dụng bảng điều khiển này để điều hành trận đấu trực tiếp!",
        roomCode,
        moderatorData: {
          players: dealtPlayers,
          allCards: cardsInGame,
          nightOrder: roomGameData[roomCode].nightOrder,
          wolves: dealtPlayers
            .filter((p) => p.role && (p.role.team === "Sói" || p.role.name?.includes("Sói")))
            .map((p) => p.characterName),
        },
      });
    }

    // Thông báo cho toàn phòng ván đấu đã bắt đầu
    io.to(roomCode).emit("game_started", {
      hasModerator: !!moderator,
      moderatorName: moderator ? moderator.characterName : null,
      totalPlayers: playerCount,
    });
  });

  // 4. QUẢN TRÒ CẬP NHẬT TRẠNG THÁI SỐNG / CHẾT CỦA NGƯỜI CHƠI (HỖ TRỢ ĐỊNH DANH THEO TÊN)
  socket.on("moderator_toggle_status", (data) => {
    const { roomCode, targetCharacterName, targetSocketId } = data;
    const g = roomGameData[roomCode];
    if (!g) return;

    // BẢO VỆ: Chỉ Quản trò (hoặc Chủ phòng nếu không có quản trò) mới có quyền
    if (g.moderator) {
      if (g.moderator.socketId !== socket.id) {
        return socket.emit("error_msg", "Chỉ Quản trò mới có quyền thay đổi trạng thái người chơi!");
      }
    } else {
      const roomPlayers = rooms[roomCode];
      const isHost = roomPlayers?.some((p) => p.socketId === socket.id && p.isHost);
      if (!isHost) {
        return socket.emit("error_msg", "Chỉ Chủ phòng mới có quyền điều chỉnh trạng thái!");
      }
    }

    // Tìm người chơi theo characterName (bền vững qua reconnect) hoặc socketId
    const p = g.players.find(
      (x) =>
        (targetCharacterName && x.characterName === targetCharacterName) ||
        (targetSocketId && x.socketId === targetSocketId),
    );

    if (p) {
      p.isAlive = !p.isAlive;
      // Cập nhật lại cho quản trò
      socket.emit("moderator_players_updated", g.players);
      // Thông báo cho cả phòng biết ai vừa bị loại hoặc hồi sinh
      io.to(roomCode).emit("player_status_changed", {
        characterName: p.characterName,
        isAlive: p.isAlive,
      });
    }
  });

  // 5. PHÁT HIỆU ỨNG ÂM THANH CHO CẢ PHÒNG (SOUNDBOARD)
  socket.on("play_sound_effect", (data) => {
    const { roomCode, soundType } = data;
    const g = roomGameData[roomCode];
    const roomPlayers = rooms[roomCode];
    if (!roomPlayers) return;

    // Cho phép Quản trò hoặc Host kích hoạt âm thanh
    const isModerator = g?.moderator?.socketId === socket.id;
    const isHost = roomPlayers.some((p) => p.socketId === socket.id && p.isHost);
    if (isModerator || isHost) {
      io.to(roomCode).emit("sound_triggered", soundType);
    }
  });

  // 6. ĐỒNG BỘ ĐỒNG HỒ ĐẾM NGƯỢC THẢO LUẬN
  socket.on("start_discussion_timer", (data) => {
    const { roomCode, seconds, label } = data;
    const g = roomGameData[roomCode];
    const roomPlayers = rooms[roomCode];
    if (!roomPlayers) return;

    const isModerator = g?.moderator?.socketId === socket.id;
    const isHost = roomPlayers.some((p) => p.socketId === socket.id && p.isHost);
    if (isModerator || isHost) {
      io.to(roomCode).emit("timer_started", { seconds: Number(seconds) || 60, label });
    }
  });

  // 7. RỜI PHÒNG CHỦ ĐỘNG
  socket.on("leave_room", (roomCode) => {
    if (rooms[roomCode]) {
      const playerIndex = rooms[roomCode].findIndex((p) => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const leftPlayer = rooms[roomCode].splice(playerIndex, 1)[0];
        const graceKey = `${roomCode}_${leftPlayer.characterName}`;
        if (disconnectGraceTimers.has(graceKey)) {
          clearTimeout(disconnectGraceTimers.get(graceKey));
          disconnectGraceTimers.delete(graceKey);
        }

        socket.leave(roomCode);
        if (rooms[roomCode].length === 0) {
          delete rooms[roomCode];
          delete roomGameData[roomCode]; // Dọn dẹp RAM
          console.log(`🗑️ Phòng ${roomCode} đã bị giải tán.`);
        } else {
          if (leftPlayer.isHost) rooms[roomCode][0].isHost = true;
          io.to(roomCode).emit("update_players", rooms[roomCode]);
        }
      }
    }
  });

  // 8. CHƠI VÁN MỚI
  socket.on("play_again", (roomCode) => {
    const roomPlayers = rooms[roomCode];
    if (!roomPlayers) return;
    const hostPlayer = roomPlayers.find((p) => p.isHost);
    const g = roomGameData[roomCode];
    const isModerator = g?.moderator?.socketId === socket.id;
    const isHost = hostPlayer?.socketId === socket.id;

    if (!isHost && !isModerator) {
      return socket.emit("error_msg", "Chỉ Chủ phòng hoặc Quản trò mới có thể bắt đầu lại!");
    }

    delete roomGameData[roomCode];
    io.to(roomCode).emit("back_to_room");
  });

  // 9. NGẮT KẾT NỐI VÀ DỌN "PHÒNG MA" (CÓ GRACE PERIOD CHO F5 RECONNECT)
  socket.on("disconnect", () => {
    console.log(`❌ Thiết bị ngắt kết nối: ${socket.id}`);
    for (const roomCode in rooms) {
      const roomPlayers = rooms[roomCode];
      const playerIndex = roomPlayers.findIndex(
        (p) => p.socketId === socket.id,
      );

      if (playerIndex !== -1) {
        const leftPlayer = roomPlayers[playerIndex];

        // TRƯỜNG HỢP 1: Game chưa bắt đầu (Đang ở phòng chờ) -> Cho Grace Period 8 giây để F5 Reconnect
        if (!roomGameData[roomCode]) {
          const graceKey = `${roomCode}_${leftPlayer.characterName}`;
          if (disconnectGraceTimers.has(graceKey)) {
            clearTimeout(disconnectGraceTimers.get(graceKey));
          }

          const timer = setTimeout(() => {
            disconnectGraceTimers.delete(graceKey);
            const currentRoom = rooms[roomCode];
            if (!currentRoom) return;

            // Nếu sau 8 giây người này vẫn giữ socketId cũ (chưa reconnect thành công)
            const idx = currentRoom.findIndex(
              (p) => p.characterName === leftPlayer.characterName && p.socketId === socket.id,
            );
            if (idx !== -1) {
              const removed = currentRoom.splice(idx, 1)[0];
              console.log(`⏱️ Hết thời gian chờ: ${removed.characterName} đã rời phòng ${roomCode}`);
              if (currentRoom.length === 0) {
                delete rooms[roomCode];
                console.log(`🗑️ Phòng ${roomCode} đã bị giải tán do không còn ai.`);
              } else {
                if (removed.isHost) {
                  currentRoom[0].isHost = true;
                }
                io.to(roomCode).emit("update_players", currentRoom);
              }
            }
          }, 8000); // 8 giây grace period cho phòng chờ

          disconnectGraceTimers.set(graceKey, timer);
        } else {
          // TRƯỜNG HỢP 2: Game đang diễn ra -> Kiểm tra xem cả phòng có bị bỏ trống hay không
          const socketsInRoom = io.sockets.adapter.rooms.get(roomCode);
          const activeConnectionsCount = socketsInRoom ? socketsInRoom.size : 0;

          // Nếu tất cả người chơi trong phòng đều đã thoát hết (size === 0)
          if (activeConnectionsCount === 0) {
            console.log(`⚠️ Phòng ${roomCode} đang trống, bắt đầu đếm 60s trước khi dọn RAM...`);
            if (roomEmptyCleanupTimers.has(roomCode)) {
              clearTimeout(roomEmptyCleanupTimers.get(roomCode));
            }
            const cleanupTimer = setTimeout(() => {
              const recheckSockets = io.sockets.adapter.rooms.get(roomCode);
              if (!recheckSockets || recheckSockets.size === 0) {
                delete rooms[roomCode];
                delete roomGameData[roomCode];
                console.log(`🗑️ Đã dọn dẹp phòng ${roomCode} sau 60s không có ai kết nối lại.`);
              }
              roomEmptyCleanupTimers.delete(roomCode);
            }, 60000);
            roomEmptyCleanupTimers.set(roomCode, cleanupTimer);
          }
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});
