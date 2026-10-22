const {
  rooms,
  roomGameData,
  disconnectGraceTimers,
  roomEmptyCleanupTimers,
  clearPlayerGraceTimer,
  clearRoomEmptyTimer,
  deleteRoom,
} = require("../state");
const { sanitizeCard } = require("../../utils/cardHelper");
const SOCKET_EVENTS = {
  CLIENT: {
    CREATE_ROOM: "create_room",
    JOIN_ROOM: "join_room",
    LEAVE_ROOM: "leave_room",
    PLAY_AGAIN: "play_again",
  },
  SERVER: {
    ROOM_CREATED: "room_created",
    ROOM_JOINED: "room_joined",
    UPDATE_PLAYERS: "update_players",
    RECEIVE_ROLE: "receive_role",
    MODERATOR_PLAYERS_UPDATED: "moderator_players_updated",
    BACK_TO_ROOM: "back_to_room",
    ERROR_MSG: "error_msg",
  },
};

/**
 * Đăng ký các sự kiện quản lý Phòng Chờ & Kết Nối (Lobby & Lifecycle)
 * @param {Server} io
 * @param {Socket} socket
 */
function registerRoomHandlers(io, socket) {
  // 1. TẠO PHÒNG
  socket.on(SOCKET_EVENTS.CLIENT.CREATE_ROOM, (user) => {
    if (!user || !user.characterName) {
      return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Thông tin người dùng không hợp lệ!");
    }

    let roomCode;
    let attempts = 0;
    do {
      roomCode = Math.floor(1000 + Math.random() * 9000).toString();
      attempts++;
    } while (rooms[roomCode] && attempts < 1000);

    rooms[roomCode] = [{ ...user, socketId: socket.id, isHost: true }];
    socket.join(roomCode);
    socket.emit(SOCKET_EVENTS.SERVER.ROOM_CREATED, roomCode);
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.UPDATE_PLAYERS, rooms[roomCode]);
  });

  // 2. VÀO PHÒNG (Hỗ trợ Reconnect mượt mà khi F5 / rớt mạng)
  socket.on(SOCKET_EVENTS.CLIENT.JOIN_ROOM, (data) => {
    const { roomCode, user } = data || {};
    if (!roomCode || !user || !user.characterName) {
      return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Dữ liệu vào phòng không hợp lệ!");
    }

    if (!rooms[roomCode]) {
      return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Phòng không tồn tại hoặc đã bị giải tán!");
    }

    // Hủy bộ đếm dọn phòng trống nếu có người kết nối lại
    clearRoomEmptyTimer(roomCode);

    // Hủy grace timer disconnect của người chơi này nếu đang chạy
    if (clearPlayerGraceTimer(roomCode, user.characterName)) {
      console.log(`🔄 Khôi phục người chơi ${user.characterName} trong phòng ${roomCode}`);
    }

    const activeGame = roomGameData[roomCode];
    const existingPlayer = rooms[roomCode].find(
      (p) => p.characterName === user.characterName,
    );

    // Nếu ván đấu đang diễn ra mà người này không thuộc phòng từ trước
    if (activeGame && !existingPlayer) {
      return socket.emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        "Trận đấu trong phòng này đang diễn ra! Bạn không thể vào giữa ván.",
      );
    }

    if (!existingPlayer) {
      rooms[roomCode].push({ ...user, socketId: socket.id, isHost: false });
    } else {
      existingPlayer.socketId = socket.id;
    }

    socket.join(roomCode);
    socket.emit(SOCKET_EVENTS.SERVER.ROOM_JOINED, roomCode);
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.UPDATE_PLAYERS, rooms[roomCode]);

    // HỖ TRỢ PHỤC HỒI KHI F5 / RỚT MẠNG VÀO LẠI TRẬN ĐẤU ĐANG CHẠY
    if (activeGame) {
      // Quản trò kết nối lại
      if (activeGame.moderator && activeGame.moderator.characterName === user.characterName) {
        activeGame.moderator.socketId = socket.id;
        socket.emit(SOCKET_EVENTS.SERVER.RECEIVE_ROLE, {
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
        // Người chơi thường kết nối lại
        const inGamePlayer = activeGame.players.find(
          (p) => p.characterName === user.characterName,
        );
        if (inGamePlayer) {
          inGamePlayer.socketId = socket.id;
          const cleanRole = sanitizeCard(inGamePlayer.role);
          socket.emit(SOCKET_EVENTS.SERVER.RECEIVE_ROLE, {
            ...cleanRole,
            isAlive: inGamePlayer.isAlive !== undefined ? inGamePlayer.isAlive : true,
            isModerator: false,
            roomCode,
            moderatorName: activeGame.moderator ? activeGame.moderator.characterName : null,
          });

          // Cập nhật lại danh sách người chơi cho Quản trò
          if (activeGame.moderator) {
            io.to(activeGame.moderator.socketId).emit(
              SOCKET_EVENTS.SERVER.MODERATOR_PLAYERS_UPDATED,
              activeGame.players,
            );
          }
        }
      }
    }
  });

  // 3. RỜI PHÒNG CHỦ ĐỘNG
  socket.on(SOCKET_EVENTS.CLIENT.LEAVE_ROOM, (roomCode) => {
    if (rooms[roomCode]) {
      const playerIndex = rooms[roomCode].findIndex((p) => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const leftPlayer = rooms[roomCode].splice(playerIndex, 1)[0];
        clearPlayerGraceTimer(roomCode, leftPlayer.characterName);
        socket.leave(roomCode);

        if (rooms[roomCode].length === 0) {
          deleteRoom(roomCode);
          console.log(`🗑️ Phòng ${roomCode} đã bị giải tán.`);
        } else {
          if (leftPlayer.isHost) rooms[roomCode][0].isHost = true;
          io.to(roomCode).emit(SOCKET_EVENTS.SERVER.UPDATE_PLAYERS, rooms[roomCode]);
        }
      }
    }
  });

  // 4. CHƠI VÁN MỚI
  socket.on(SOCKET_EVENTS.CLIENT.PLAY_AGAIN, (roomCode) => {
    const roomPlayers = rooms[roomCode];
    if (!roomPlayers) return;
    const hostPlayer = roomPlayers.find((p) => p.isHost);
    const g = roomGameData[roomCode];
    const isModerator = g?.moderator?.socketId === socket.id;
    const isHost = hostPlayer?.socketId === socket.id;

    if (!isHost && !isModerator) {
      return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Chỉ Chủ phòng hoặc Quản trò mới có thể bắt đầu lại!");
    }

    delete roomGameData[roomCode];
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.BACK_TO_ROOM);
  });

  // 5. NGẮT KẾT NỐI (DISCONNECT VỚI GRACE PERIOD)
  socket.on("disconnect", () => {
    console.log(`❌ Thiết bị ngắt kết nối: ${socket.id}`);
    for (const roomCode in rooms) {
      const roomPlayers = rooms[roomCode];
      const playerIndex = roomPlayers.findIndex((p) => p.socketId === socket.id);

      if (playerIndex !== -1) {
        const leftPlayer = roomPlayers[playerIndex];

        // Trường hợp 1: Game chưa bắt đầu -> Grace period 8s để F5 reconnect
        if (!roomGameData[roomCode]) {
          const graceKey = `${roomCode}_${leftPlayer.characterName}`;
          if (disconnectGraceTimers.has(graceKey)) {
            clearTimeout(disconnectGraceTimers.get(graceKey));
          }

          const timer = setTimeout(() => {
            disconnectGraceTimers.delete(graceKey);
            const currentRoom = rooms[roomCode];
            if (!currentRoom) return;

            const idx = currentRoom.findIndex(
              (p) => p.characterName === leftPlayer.characterName && p.socketId === socket.id,
            );
            if (idx !== -1) {
              const removed = currentRoom.splice(idx, 1)[0];
              console.log(`⏱️ Hết thời gian chờ: ${removed.characterName} đã rời phòng ${roomCode}`);
              if (currentRoom.length === 0) {
                deleteRoom(roomCode);
                console.log(`🗑️ Phòng ${roomCode} đã bị giải tán do không còn ai.`);
              } else {
                if (removed.isHost) {
                  currentRoom[0].isHost = true;
                }
                io.to(roomCode).emit(SOCKET_EVENTS.SERVER.UPDATE_PLAYERS, currentRoom);
              }
            }
          }, 8000);

          disconnectGraceTimers.set(graceKey, timer);
        } else {
          // Trường hợp 2: Game đang chạy -> Kiểm tra cả phòng có bỏ trống không
          const socketsInRoom = io.sockets.adapter.rooms.get(roomCode);
          const activeConnectionsCount = socketsInRoom ? socketsInRoom.size : 0;

          if (activeConnectionsCount === 0) {
            console.log(`⚠️ Phòng ${roomCode} đang trống, bắt đầu đếm 60s trước khi dọn RAM...`);
            if (roomEmptyCleanupTimers.has(roomCode)) {
              clearTimeout(roomEmptyCleanupTimers.get(roomCode));
            }
            const cleanupTimer = setTimeout(() => {
              const recheckSockets = io.sockets.adapter.rooms.get(roomCode);
              if (!recheckSockets || recheckSockets.size === 0) {
                deleteRoom(roomCode);
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
}

module.exports = { registerRoomHandlers };
