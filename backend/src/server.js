const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");

const { PORT, CORS_ORIGIN } = require("./config/env");
const { connectDB } = require("./config/db");
const { initSocketServer } = require("./socket");

const authRoutes = require("./routes/auth");
const friendRoutes = require("./routes/friends");
const cardRoutes = require("./routes/cards");

// Khởi tạo app và HTTP server
const app = express();
const server = http.createServer(app);

// Kết nối Cơ sở dữ liệu MongoDB
connectDB();

// Middlewares
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Phục vụ static assets (như ảnh thẻ bài trong public/cards)
app.use(express.static(path.join(__dirname, "../public")));

// REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/cards", cardRoutes);

// Route kiểm tra trạng thái sức khỏe của Server
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Khởi tạo Realtime Socket.IO Server
const io = initSocketServer(server, { corsOrigin: CORS_ORIGIN });

// Khởi chạy máy chủ
server.listen(PORT, () => {
  console.log(`🚀 MaSoi Backend Server đang chạy tại: http://localhost:${PORT}`);
});

module.exports = { app, server, io };
