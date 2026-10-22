const Card = require("../../models/Card");
const { rooms, roomGameData } = require("../state");
const { sanitizeCard } = require("../../utils/cardHelper");
const { generateNightOrder } = require("../../utils/nightOrder");
const { DEFAULT_ROLES } = require("../../constants/roles");

const SOCKET_EVENTS = {
  CLIENT: {
    START_GAME: "start_game",
    MODERATOR_TOGGLE_STATUS: "moderator_toggle_status",
    PLAY_SOUND_EFFECT: "play_sound_effect",
    START_DISCUSSION_TIMER: "start_discussion_timer",
    STOP_DISCUSSION_TIMER: "stop_discussion_timer",
  },
  SERVER: {
    RECEIVE_ROLE: "receive_role",
    GAME_STARTED: "game_started",
    MODERATOR_PLAYERS_UPDATED: "moderator_players_updated",
    PLAYER_STATUS_CHANGED: "player_status_changed",
    SOUND_TRIGGERED: "sound_triggered",
    TIMER_STARTED: "timer_started",
    TIMER_STOPPED: "timer_stopped",
    ERROR_MSG: "error_msg",
  },
};

/**
 * Đăng ký các sự kiện tiến trình trận đấu (Game Lifecycle & Moderation)
 * @param {Server} io
 * @param {Socket} socket
 */
function registerGameHandlers(io, socket) {
  // 1. BẮT ĐẦU GAME VÀ PHÁT BÀI / QUẢN TRÒ
  socket.on(SOCKET_EVENTS.CLIENT.START_GAME, async (data) => {
    const { roomCode, mode, customDeck, moderatorMode, moderatorSocketId } = data || {};
    const roomPlayers = rooms[roomCode];

    if (!roomPlayers || roomPlayers.length === 0) return;

    // BẢO VỆ: Chỉ Chủ phòng mới có quyền bắt đầu ván game
    const hostPlayer = roomPlayers.find((p) => p.isHost);
    if (!hostPlayer || hostPlayer.socketId !== socket.id) {
      return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Chỉ có Chủ phòng mới có quyền bắt đầu ván game!");
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
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        "Cần ít nhất 1 người chơi nhận bài!",
      );
    }

    const playerCount = playersToDeal.length;
    let deck = [];
    let allCards = [];
    try {
      allCards = await Card.find({}).lean();
    } catch (err) {
      console.error("Lỗi lấy danh sách bài từ DB:", err);
    }

    // Thẻ mặc định fallback
    const foundWolf =
      allCards.find((c) => c.name === "Ma Sói (Thường)") ||
      allCards.find((c) => c.team === "Sói");
    const defaultWolf = sanitizeCard(foundWolf) || DEFAULT_ROLES.WOLF;

    const foundVillager = allCards.find((c) => c.name === "Dân Làng");
    const defaultVillager = sanitizeCard(foundVillager) || DEFAULT_ROLES.VILLAGER;

    const foundSeer = allCards.find((c) => c.name === "Tiên Tri");
    const defaultSeer = sanitizeCard(foundSeer) || DEFAULT_ROLES.SEER;

    const foundGuard = allCards.find((c) => c.name === "Bảo Vệ");
    const defaultGuard = sanitizeCard(foundGuard) || DEFAULT_ROLES.GUARD;

    if (mode === "custom" && customDeck && typeof customDeck === "object") {
      let totalSelected = 0;
      for (const [cardId, count] of Object.entries(customDeck)) {
        const num = Math.max(0, Math.min(50, Math.floor(Number(count) || 0)));
        if (num > 0) {
          const cardInfo = allCards.find(
            (c) => c._id && c._id.toString() === cardId.toString(),
          );
          if (cardInfo) {
            const clean = sanitizeCard(cardInfo);
            for (let i = 0; i < num; i++) {
              deck.push(clean);
              totalSelected++;
            }
          }
        }
      }
      if (totalSelected !== playerCount) {
        return socket.emit(
          SOCKET_EVENTS.SERVER.ERROR_MSG,
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
      role: sanitizeCard(deck[index]),
      isAlive: true,
    }));

    // Lọc danh sách thẻ bài duy nhất trong ván
    const uniqueCardsMap = new Map();
    deck.forEach((c) => {
      if (c && c.name && !uniqueCardsMap.has(c.name)) {
        uniqueCardsMap.set(c.name, sanitizeCard(c));
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
      io.to(player.socketId).emit(SOCKET_EVENTS.SERVER.RECEIVE_ROLE, {
        ...player.role,
        isAlive: true,
        isModerator: false,
        roomCode,
        moderatorName: moderator ? moderator.characterName : null,
      });
    });

    // 2. Gửi dữ liệu Dashboard đầy đủ cho Quản trò
    if (moderator) {
      io.to(moderator.socketId).emit(SOCKET_EVENTS.SERVER.RECEIVE_ROLE, {
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
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.GAME_STARTED, {
      hasModerator: !!moderator,
      moderatorName: moderator ? moderator.characterName : null,
      totalPlayers: playerCount,
    });
  });

  // 2. QUẢN TRÒ CẬP NHẬT TRẠNG THÁI SỐNG / CHẾT CỦA NGƯỜI CHƠI
  socket.on(SOCKET_EVENTS.CLIENT.MODERATOR_TOGGLE_STATUS, (data) => {
    const { roomCode, targetCharacterName, targetSocketId } = data || {};
    const g = roomGameData[roomCode];
    if (!g) return;

    // BẢO VỆ: Chỉ Quản trò hoặc Host mới có quyền
    if (g.moderator) {
      if (g.moderator.socketId !== socket.id) {
        return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Chỉ Quản trò mới có quyền thay đổi trạng thái người chơi!");
      }
    } else {
      const roomPlayers = rooms[roomCode];
      const isHost = roomPlayers?.some((p) => p.socketId === socket.id && p.isHost);
      if (!isHost) {
        return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Chỉ Chủ phòng mới có quyền điều chỉnh trạng thái!");
      }
    }

    const p = g.players.find(
      (x) =>
        (targetCharacterName && x.characterName === targetCharacterName) ||
        (targetSocketId && x.socketId === targetSocketId),
    );

    if (p) {
      p.isAlive = !p.isAlive;
      socket.emit(SOCKET_EVENTS.SERVER.MODERATOR_PLAYERS_UPDATED, g.players);
      io.to(roomCode).emit(SOCKET_EVENTS.SERVER.PLAYER_STATUS_CHANGED, {
        characterName: p.characterName,
        isAlive: p.isAlive,
      });
    }
  });

  // 3. PHÁT HIỆU ỨNG ÂM THANH CHO CẢ PHÒNG (SOUNDBOARD)
  socket.on(SOCKET_EVENTS.CLIENT.PLAY_SOUND_EFFECT, (data) => {
    const { roomCode, soundType } = data || {};
    const g = roomGameData[roomCode];
    const roomPlayers = rooms[roomCode];
    if (!roomPlayers) return;

    const isModerator = g?.moderator?.socketId === socket.id;
    const isHost = roomPlayers.some((p) => p.socketId === socket.id && p.isHost);
    if (isModerator || isHost) {
      io.to(roomCode).emit(SOCKET_EVENTS.SERVER.SOUND_TRIGGERED, soundType);
    }
  });

  // 4. ĐỒNG BỘ ĐỒNG HỒ ĐẾM NGƯỢC THẢO LUẬN
  socket.on(SOCKET_EVENTS.CLIENT.START_DISCUSSION_TIMER, (data) => {
    const { roomCode, seconds, label } = data || {};
    const g = roomGameData[roomCode];
    const roomPlayers = rooms[roomCode];
    if (!roomPlayers) return;

    const isModerator = g?.moderator?.socketId === socket.id;
    const isHost = roomPlayers.some((p) => p.socketId === socket.id && p.isHost);
    if (isModerator || isHost) {
      io.to(roomCode).emit(SOCKET_EVENTS.SERVER.TIMER_STARTED, {
        seconds: Number(seconds) || 60,
        label,
      });
    }
  });

  socket.on(SOCKET_EVENTS.CLIENT.STOP_DISCUSSION_TIMER, (data) => {
    const roomCode = typeof data === "object" ? data?.roomCode : data;
    if (roomCode) {
      io.to(roomCode).emit(SOCKET_EVENTS.SERVER.TIMER_STOPPED);
    }
  });
}

module.exports = { registerGameHandlers };
