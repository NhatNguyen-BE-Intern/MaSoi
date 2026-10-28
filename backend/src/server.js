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

const fs = require("fs");

// Phục vụ static assets (như ảnh thẻ bài trong public/cards)
app.use(express.static(path.join(__dirname, "../public")));

// Phục vụ frontend tĩnh nếu đã build (hỗ trợ triển khai gộp fullstack trên Render / Single Host)
const frontendOutPath = path.join(__dirname, "../../frontend/out");
if (fs.existsSync(frontendOutPath)) {
  app.use(express.static(frontendOutPath));
}

// REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/cards", cardRoutes);

// Route kiểm tra trạng thái sức khỏe của Server
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Fallback phục vụ trang chủ frontend cho các route không phải API
if (fs.existsSync(frontendOutPath)) {
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.startsWith("/socket.io")) {
      return res.sendFile(path.join(frontendOutPath, "index.html"));
    }
    next();
  });
}

// Khởi tạo Realtime Socket.IO Server
const io = initSocketServer(server, { corsOrigin: CORS_ORIGIN });

// Bắt các lỗi chưa được xử lý để ngăn máy chủ bị crash đột xuất
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err.message, err.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
});

// Khởi chạy máy chủ
server.listen(PORT, () => {
  console.log(`🚀 MaSoi Backend Server đang chạy tại: http://localhost:${PORT}`);
});

module.exports = { app, server, io };
