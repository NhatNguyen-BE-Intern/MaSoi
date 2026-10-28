const {
  rooms,
  roomGameData,
  roomOnlineState,
  roomChatHistory,
  lastChatTimeMap,
} = require("../state");
const SOCKET_EVENTS = require("../../constants/socketEvents");
const { isRoleWolf } = require("../../utils/cardHelper");

/**
 * Khởi tạo cấu trúc lưu trữ lịch sử chat cho 1 phòng nếu chưa có
 */
function ensureRoomChat(roomCode) {
  if (!roomChatHistory[roomCode]) {
    roomChatHistory[roomCode] = {
      town: [],
      wolf: [],
      lovers: [],
      ghost: [],
    };
  }
}

/**
 * Kiểm tra xem người chơi có phải là Ma Sói hay không
 */
function isPlayerWolf(player, activeGame, onlineState = null) {
  if (!activeGame || !activeGame.players) return false;
  const inGame = activeGame.players.find(
    (p) => p.characterName.toLowerCase() === player.characterName.toLowerCase(),
  );
  if (!inGame || !inGame.role) return false;
  return isRoleWolf(inGame.role, onlineState);
}

/**
 * Kiểm tra xem người chơi có thuộc Cặp Đôi (Lovers) hay không
 */
function isPlayerLover(player, activeGame, onlineState) {
  const lovers = (onlineState && onlineState.lovers) || (activeGame && activeGame.lovers);
  if (!lovers || !Array.isArray(lovers)) return false;
  return lovers.some(
    (name) => name.toLowerCase() === player.characterName.toLowerCase(),
  );
}

/**
 * Kiểm tra xem người chơi còn sống hay đã tử nạn
 */
function isPlayerAlive(player, activeGame) {
  if (!activeGame || !activeGame.players) return true; // Chưa bắt đầu thì ai cũng sống
  const inGame = activeGame.players.find(
    (p) => p.characterName.toLowerCase() === player.characterName.toLowerCase(),
  );
  return inGame ? inGame.isAlive !== false : true;
}

/**
 * Đăng ký các sự kiện Khung Chat 4 Kênh
 * @param {Server} io
 * @param {Socket} socket
 */
function registerChatHandlers(io, socket) {
  // 1. GỬI TIN NHẮN CHAT
  socket.on(SOCKET_EVENTS.CLIENT.SEND_CHAT_MESSAGE, (data) => {
    const { roomCode, channel = "town", message, quickPreset } = data || {};

    if (!roomCode || !message || typeof message !== "string" || !message.trim()) {
      return socket.emit(SOCKET_EVENTS.SERVER.CHAT_ERROR, "Nội dung tin nhắn không hợp lệ!");
    }

    const roomPlayers = rooms[roomCode];
    if (!roomPlayers) {
      return socket.emit(SOCKET_EVENTS.SERVER.CHAT_ERROR, "Phòng không tồn tại!");
    }

    const sender = roomPlayers.find((p) => p.socketId === socket.id);
    if (!sender) {
      return socket.emit(SOCKET_EVENTS.SERVER.CHAT_ERROR, "Bạn không thuộc phòng này!");
    }

    // Rate Limiting: Cooldown tối thiểu 1.5s/tin nhắn chống spam bot
    const rateLimitKey = `${roomCode}_${sender.characterName.toLowerCase()}`;
    const lastSent = lastChatTimeMap.get(rateLimitKey) || 0;
    const now = Date.now();
    if (now - lastSent < 1500) {
      return socket.emit(
        SOCKET_EVENTS.SERVER.CHAT_ERROR,
        "Bạn đang gửi tin nhắn quá nhanh! Vui lòng chờ 1.5 giây giữa các tin.",
      );
    }
    lastChatTimeMap.set(rateLimitKey, now);

    const activeGame = roomGameData[roomCode];
    const onlineState = roomOnlineState[roomCode];
    const isAlive = isPlayerAlive(sender, activeGame);
    ensureRoomChat(roomCode);

    // PHÂN QUYỀN VÀ BẢO MẬT THEO TỪNG KÊNH CHAT:
    if (channel === SOCKET_EVENTS.CHAT_CHANNELS.TOWN) {
      // Kênh Làng (TOWN):
      if (activeGame) {
        // Người chết không được chat vào kênh Làng
        if (!isAlive) {
          return socket.emit(
            SOCKET_EVENTS.SERVER.CHAT_ERROR,
            "Bạn đã tử nạn và chỉ có thể trò chuyện trong Kênh Hồn Ma!",
          );
        }

        // Ban đêm mute toàn bộ kênh Làng
        const onlineState = roomOnlineState[roomCode];
        if (activeGame.currentPhase === "night" || onlineState?.currentPhase?.startsWith("NIGHT_")) {
          return socket.emit(
            SOCKET_EVENTS.SERVER.CHAT_ERROR,
            "Trời đang tối, dân làng đang ngủ say không thể trò chuyện!",
          );
        }

        // Giai đoạn Biện Hộ: Chỉ nghi phạm trên bục mới được chat
        const isDefenseMode =
          activeGame.currentSubPhase === "defense" ||
          onlineState?.currentPhase === "DAY_DEFENSE";
        const spotlightSuspect =
          activeGame.accusedPlayer || onlineState?.accusedPlayer;

        if (
          isDefenseMode &&
          spotlightSuspect &&
          spotlightSuspect.toLowerCase() !== sender.characterName.toLowerCase()
        ) {
          return socket.emit(
            SOCKET_EVENTS.SERVER.CHAT_ERROR,
            `Đang trong thời gian biện hộ của ${spotlightSuspect}! Toàn bộ dân làng khác bị tạm khóa chat.`,
          );
        }
      }

      const chatMsg = {
        id: `${now}_${Math.random().toString(36).substring(2, 7)}`,
        senderName: sender.characterName,
        seatNumber: sender.seatNumber || null,
        channel: SOCKET_EVENTS.CHAT_CHANNELS.TOWN,
        text: message.trim(),
        quickPreset: quickPreset || null,
        timestamp: now,
      };

      roomChatHistory[roomCode].town.push(chatMsg);
      if (roomChatHistory[roomCode].town.length > 100) {
        roomChatHistory[roomCode].town.shift();
      }

      io.to(roomCode).emit(SOCKET_EVENTS.SERVER.RECEIVE_CHAT_MESSAGE, chatMsg);
    } else if (channel === SOCKET_EVENTS.CHAT_CHANNELS.WOLF) {
      // Kênh Bầy Sói (WOLF):
      if (!isPlayerWolf(sender, activeGame, onlineState)) {
        return socket.emit(
          SOCKET_EVENTS.SERVER.CHAT_ERROR,
          "Bạn không thuộc phe Ma Sói, không thể truy cập hang ổ bóng đêm!",
        );
      }

      const chatMsg = {
        id: `${now}_${Math.random().toString(36).substring(2, 7)}`,
        senderName: sender.characterName,
        seatNumber: sender.seatNumber || null,
        channel: SOCKET_EVENTS.CHAT_CHANNELS.WOLF,
        text: message.trim(),
        quickPreset: quickPreset || null,
        timestamp: now,
      };

      roomChatHistory[roomCode].wolf.push(chatMsg);
      if (roomChatHistory[roomCode].wolf.length > 100) {
        roomChatHistory[roomCode].wolf.shift();
      }

      // Gửi cho tất cả sockets trong room chat Bầy Sói (bao gồm Ma Sói, người bị lây nhiễm, Sói thức tỉnh và Cô Bé lén nhìn trộm)
      io.to(`room_${roomCode}_wolf`).emit(SOCKET_EVENTS.SERVER.RECEIVE_CHAT_MESSAGE, chatMsg);
    } else if (channel === SOCKET_EVENTS.CHAT_CHANNELS.LOVERS) {
      // Kênh Cặp Đôi (LOVERS):
      if (!isPlayerLover(sender, activeGame, onlineState)) {
        return socket.emit(
          SOCKET_EVENTS.SERVER.CHAT_ERROR,
          "Bạn không thuộc Cặp Đôi tình yêu định mệnh!",
        );
      }

      const chatMsg = {
        id: `${now}_${Math.random().toString(36).substring(2, 7)}`,
        senderName: sender.characterName,
        seatNumber: sender.seatNumber || null,
        channel: SOCKET_EVENTS.CHAT_CHANNELS.LOVERS,
        text: message.trim(),
        quickPreset: quickPreset || null,
        timestamp: now,
      };

      roomChatHistory[roomCode].lovers.push(chatMsg);
      if (roomChatHistory[roomCode].lovers.length > 100) {
        roomChatHistory[roomCode].lovers.shift();
      }

      // Phát cho toàn bộ người trong phòng bí mật của Cặp Đôi
      io.to(`room_${roomCode}_lovers`).emit(SOCKET_EVENTS.SERVER.RECEIVE_CHAT_MESSAGE, chatMsg);
    } else if (channel === SOCKET_EVENTS.CHAT_CHANNELS.GHOST) {
      // Kênh Hồn Ma (GHOST):
      if (isAlive && activeGame) {
        return socket.emit(
          SOCKET_EVENTS.SERVER.CHAT_ERROR,
          "Người còn sống không thể trò chuyện với cõi âm!",
        );
      }

      const chatMsg = {
        id: `${now}_${Math.random().toString(36).substring(2, 7)}`,
        senderName: sender.characterName,
        seatNumber: sender.seatNumber || null,
        channel: SOCKET_EVENTS.CHAT_CHANNELS.GHOST,
        text: message.trim(),
        quickPreset: quickPreset || null,
        timestamp: now,
      };

      roomChatHistory[roomCode].ghost.push(chatMsg);
      if (roomChatHistory[roomCode].ghost.length > 100) {
        roomChatHistory[roomCode].ghost.shift();
      }

      // Gửi riêng cho người đã chết
      if (activeGame && activeGame.players) {
        activeGame.players.forEach((p) => {
          if (p.isAlive === false) {
            io.to(p.socketId).emit(SOCKET_EVENTS.SERVER.RECEIVE_CHAT_MESSAGE, chatMsg);
          }
        });
      } else {
        socket.emit(SOCKET_EVENTS.SERVER.RECEIVE_CHAT_MESSAGE, chatMsg);
      }
    }
  });

  // 2. LẤY LỊCH SỬ CHAT KHI VÀO PHÒNG HOẶC RECONNECT
  socket.on(SOCKET_EVENTS.CLIENT.GET_CHAT_HISTORY, (data) => {
    const roomCode = typeof data === "object" ? data?.roomCode : data;
    if (!roomCode || !rooms[roomCode]) return;
    const sender = rooms[roomCode].find((p) => p.socketId === socket.id);
    if (!sender) return;

    ensureRoomChat(roomCode);
    const activeGame = roomGameData[roomCode];
    const onlineState = roomOnlineState[roomCode];
    const isAlive = isPlayerAlive(sender, activeGame);
    const isWolf = isPlayerWolf(sender, activeGame, onlineState);
    const isLover = isPlayerLover(sender, activeGame, onlineState);

    const isLittleGirl = activeGame?.players?.some((p) => {
      const match = p.characterName.toLowerCase() === sender.characterName.toLowerCase();
      const r = p.role?.name?.toLowerCase() || "";
      return match && (r.includes("cô bé") || r.includes("little girl"));
    });

    const history = {
      town: roomChatHistory[roomCode].town || [],
      wolf: isWolf || isLittleGirl ? roomChatHistory[roomCode].wolf || [] : [],
      lovers: isLover ? roomChatHistory[roomCode].lovers || [] : [],
      ghost: !isAlive ? roomChatHistory[roomCode].ghost || [] : [],
    };

    socket.emit(SOCKET_EVENTS.SERVER.CHAT_HISTORY, history);
  });
}

module.exports = { registerChatHandlers };
