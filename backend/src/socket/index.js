const { Server } = require("socket.io");
const { registerRoomHandlers } = require("./handlers/roomHandler");
const { registerGameHandlers } = require("./handlers/gameHandler");

/**
 * Khởi tạo Socket.IO Server và gắn các module xử lý sự kiện
 * @param {http.Server} httpServer
 * @param {Object} options
 * @returns {Server}
 */
function initSocketServer(httpServer, options = {}) {
  const io = new Server(httpServer, {
    cors: { origin: options.corsOrigin || "*" },
  });

  io.on("connection", (socket) => {
    console.log(`⚡ Một thiết bị vừa kết nối: ${socket.id}`);

    // Đăng ký các nhóm sự kiện riêng biệt
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
  });

  return io;
}

module.exports = { initSocketServer };
