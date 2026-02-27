const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
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

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// --- XỬ LÝ REALTIME (SOCKET.IO) ---
const rooms = {};

io.on("connection", (socket) => {
  console.log(`⚡ Một thiết bị vừa kết nối: ${socket.id}`);

  // 1. TẠO PHÒNG
  socket.on("create_room", (user) => {
    const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
    rooms[roomCode] = [{ ...user, socketId: socket.id, isHost: true }];
    socket.join(roomCode);
    socket.emit("room_created", roomCode);
    io.to(roomCode).emit("update_players", rooms[roomCode]);
  });

  // 2. VÀO PHÒNG
  socket.on("join_room", (data) => {
    const { roomCode, user } = data;
    if (rooms[roomCode]) {
      const isAlreadyIn = rooms[roomCode].find(
        (p) => p.characterName === user.characterName,
      );
      if (!isAlreadyIn) {
        rooms[roomCode].push({ ...user, socketId: socket.id, isHost: false });
      }
      socket.join(roomCode);
      socket.emit("room_joined", roomCode);
      io.to(roomCode).emit("update_players", rooms[roomCode]);
    } else {
      socket.emit("error_msg", "Phòng không tồn tại!");
    }
  });

  // 3. BẮT ĐẦU GAME VÀ CHIA BÀI
  socket.on("start_game", async (data) => {
    const { roomCode, mode, customDeck } = data;
    const roomPlayers = rooms[roomCode];

    if (!roomPlayers) return;

    const playerCount = roomPlayers.length;
    let deck = [];
    const allCards = await Card.find({});

    if (mode === "custom") {
      let totalSelected = 0;
      for (const [cardId, count] of Object.entries(customDeck)) {
        if (count > 0) {
          const cardInfo = allCards.find((c) => c._id.toString() === cardId);
          for (let i = 0; i < count; i++) {
            deck.push(cardInfo);
            totalSelected++;
          }
        }
      }
      if (totalSelected !== playerCount) {
        return socket.emit(
          "error_msg",
          `Số lượng bài (${totalSelected}) không khớp với số người chơi (${playerCount})!`,
        );
      }
    } else {
      // ĐÃ SỬA LẠI TÊN BÀI CHO KHỚP VỚI DATABASE MỚI
      const wolfCard = allCards.find((c) => c.name === "Ma Sói (Thường)");
      const villagerCard = allCards.find((c) => c.name === "Dân Làng");
      const seerCard = allCards.find((c) => c.name === "Tiên Tri");
      const guardCard = allCards.find((c) => c.name === "Bảo Vệ");

      let wolfCount = Math.floor(playerCount / 4) || 1;
      for (let i = 0; i < wolfCount; i++) deck.push(wolfCard);

      if (playerCount >= 4) deck.push(seerCard);
      if (playerCount >= 5) deck.push(guardCard);

      while (deck.length < playerCount) {
        deck.push(villagerCard);
      }
    }

    // Trộn bài
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Phát bài
    roomPlayers.forEach((player, index) => {
      const role = deck[index];
      io.to(player.socketId).emit("receive_role", role);
    });
  });

  // 4. CHƠI VÁN MỚI
  socket.on("play_again", (roomCode) => {
    io.to(roomCode).emit("back_to_room");
  });

  // 5. NGẮT KẾT NỐI VÀ DỌN "PHÒNG MA"
  socket.on("disconnect", () => {
    console.log(`❌ Thiết bị ngắt kết nối: ${socket.id}`);
    for (const roomCode in rooms) {
      const roomPlayers = rooms[roomCode];
      const playerIndex = roomPlayers.findIndex(
        (p) => p.socketId === socket.id,
      );

      if (playerIndex !== -1) {
        const leftPlayer = roomPlayers.splice(playerIndex, 1)[0];
        if (roomPlayers.length === 0) {
          delete rooms[roomCode];
          console.log(`🗑️ Phòng ${roomCode} đã bị giải tán.`);
        } else {
          if (leftPlayer.isHost) roomPlayers[0].isHost = true;
          io.to(roomCode).emit("update_players", roomPlayers);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});
