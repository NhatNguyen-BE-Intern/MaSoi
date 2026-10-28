const mongoose = require("mongoose");
const Card = require("../../models/Card");
const { rooms, roomMetadata, roomGameData, roomOnlineState } = require("../state");
const {
  sanitizeCard,
  isRoleWolf,
  isRoleThirdParty,
  isRoleVillager,
} = require("../../utils/cardHelper");
const { generateNightOrder } = require("../../utils/nightOrder");
const { DEFAULT_ROLES } = require("../../constants/roles");
const { initOnlineGame } = require("../online/nightEngine");

const SOCKET_EVENTS = require("../../constants/socketEvents");

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
    if (mongoose.connection.readyState === 1) {
      try {
        allCards = await Card.find({}).lean().maxTimeMS(2500);
      } catch (err) {
        console.error("Lỗi lấy danh sách bài từ DB:", err.message);
      }
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
          let cardInfo = allCards.find(
            (c) => c._id && c._id.toString() === cardId.toString(),
          );
          if (!cardInfo) {
            const defaultMatch = Object.values(DEFAULT_ROLES).find(
              (r) => r._id === cardId || r.name === cardId,
            );
            if (defaultMatch) cardInfo = defaultMatch;
          }
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

    // Lưu dữ liệu ván đấu (lưu kèm token và seatNumber để bảo vệ chống mạo danh và tính toán khoảng cách)
    const dealtPlayers = playersToDeal.map((p, index) => ({
      characterName: p.characterName,
      socketId: p.socketId,
      token: p.token,
      seatNumber: p.seatNumber !== undefined ? p.seatNumber : index + 1,
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
        ? {
            socketId: moderator.socketId,
            characterName: moderator.characterName,
            token: moderator.token,
          }
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
            .filter((p) => p.role && isRoleWolf(p.role))
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

    // NẾU LÀ PHÒNG ONLINE: KÍCH HOẠT NIGHT ENGINE TỰ ĐỘNG
    if (roomMetadata[roomCode]?.gameMode === "online") {
      if (roomOnlineState[roomCode]?.timerId) {
        clearTimeout(roomOnlineState[roomCode].timerId);
        roomOnlineState[roomCode].timerId = null;
      }
      initOnlineGame(io, roomCode);
    }
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
        (targetCharacterName &&
          x.characterName?.trim().toLowerCase() ===
            targetCharacterName.trim().toLowerCase()) ||
        (targetSocketId && x.socketId === targetSocketId),
    );

    if (p) {
      p.isAlive = !p.isAlive;
      socket.emit(SOCKET_EVENTS.SERVER.MODERATOR_PLAYERS_UPDATED, g.players);
      io.to(roomCode).emit(SOCKET_EVENTS.SERVER.PLAYER_STATUS_CHANGED, {
        characterName: p.characterName,
        isAlive: p.isAlive,
      });

      // TỰ ĐỘNG KIỂM TRA ĐIỀU KIỆN THẮNG / THUA (WIN CONDITION)
      const alivePlayers = g.players.filter((x) => x.isAlive);
      const initialWolves = g.players.filter(
        (x) => x.role && isRoleWolf(x.role),
      );
      const aliveWolves = alivePlayers.filter(
        (x) => x.role && isRoleWolf(x.role),
      );
      const aliveSolo = alivePlayers.filter(
        (x) => x.role && isRoleThirdParty(x.role),
      );
      const aliveVillagers = alivePlayers.filter(
        (x) => x.role && isRoleVillager(x.role),
      );

      // Nếu ván này có Ma Sói tham gia
      if (initialWolves.length > 0) {
        // Trường hợp 0: Không còn ai sống sót -> Cả làng cùng diệt vong!
        if (alivePlayers.length === 0) {
          io.to(roomCode).emit(SOCKET_EVENTS.SERVER.GAME_OVER, {
            winner: "Hòa",
            title: "💀 Cả Làng Cùng Diệt Vong!",
            message: "Không còn một ai sống sót sau đêm kinh hoàng! Cả bầy Ma Sói lẫn Dân Làng đều đã tử nạn.",
          });
        }
        // Trường hợp 1: Toàn bộ Sói đã chết
        else if (aliveWolves.length === 0) {
          const livingHostileSolo = aliveSolo.filter((p) => {
            const n = (p.role?.name || "").toLowerCase();
            const code = p.role?.code || "";
            return (
              n.includes("sát thủ") ||
              code === "SERIAL_KILLER" ||
              n.includes("độc hành") ||
              n.includes("arsonist") ||
              code === "ARSONIST"
            );
          });

          if (livingHostileSolo.length > 0 && aliveVillagers.length > 0) {
            // Còn kẻ thù thứ 3 sát nhân và dân làng -> tiếp tục trận đấu
          } else if (aliveSolo.length > 0 && aliveVillagers.length === 0) {
            const winnerName =
              livingHostileSolo.length > 0
                ? livingHostileSolo[0].role?.name || "Phe Thứ 3"
                : "Phe Thứ 3";
            io.to(roomCode).emit(SOCKET_EVENTS.SERVER.GAME_OVER, {
              winner: winnerName,
              title: `🎭 ${winnerName} Chiến Thắng!`,
              message: "Phe Độc lập / Thứ 3 đã sống sót ngoạn mục sau khi bầy Sói và Dân Làng ngã xuống!",
            });
          } else {
            io.to(roomCode).emit(SOCKET_EVENTS.SERVER.GAME_OVER, {
              winner: "Dân Làng",
              title: "🎉 Phe Dân Làng Chiến Thắng!",
              message: "Toàn bộ bầy Ma Sói và các hiểm họa bóng đêm đã bị tiêu diệt! Bình yên và ánh sáng đã trở lại với ngôi làng.",
            });
          }
        }
        // Trường hợp 2: Số Sói >= Số Dân (và Solo) còn sống -> Ma Sói thắng!
        else if (aliveWolves.length >= (aliveVillagers.length + aliveSolo.length)) {
          io.to(roomCode).emit(SOCKET_EVENTS.SERVER.GAME_OVER, {
            winner: "Ma Sói",
            title: "🐺 Phe Ma Sói Chiến Thắng!",
            message: "Số lượng Ma Sói đã áp đảo hoàn toàn dân làng còn sống! Ngôi làng chìm trong bóng tối vĩnh hằng.",
          });
        }
      }
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
    if (!roomCode) return;
    const g = roomGameData[roomCode];
    const roomPlayers = rooms[roomCode];
    if (!roomPlayers) return;

    const isModerator = g?.moderator?.socketId === socket.id;
    const isHost = roomPlayers.some((p) => p.socketId === socket.id && p.isHost);
    if (isModerator || isHost) {
      io.to(roomCode).emit(SOCKET_EVENTS.SERVER.TIMER_STOPPED);
    }
  });
}

module.exports = { registerGameHandlers };
