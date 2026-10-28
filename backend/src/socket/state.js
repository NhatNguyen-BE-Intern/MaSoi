/**
 * QUẢN LÝ TRẠNG THÁI IN-MEMORY TOÀN BỘ PHÒNG VÀ GAME
 * - rooms: { [roomCode]: [{ characterName, socketId, isHost, ... }] }
 * - roomGameData: { [roomCode]: { moderator, players, cardsInGame, nightOrder } }
 * - disconnectGraceTimers: Key `${roomCode}_${characterName}` -> setTimeout id (Grace period khi F5)
 * - roomEmptyCleanupTimers: Key `roomCode` -> setTimeout id (Dọn phòng bỏ hoang)
 */

const rooms = {};
const roomMetadata = {};
const roomGameData = {};
const roomOnlineState = {};
const roomChatHistory = {};
const lastChatTimeMap = new Map();
const disconnectGraceTimers = new Map();
const roomEmptyCleanupTimers = new Map();

/**
 * Cài đặt mặc định của một phòng chơi Online
 */
const DEFAULT_ONLINE_SETTINGS = {
  deckMode: "auto", // 'auto' (Máy tự cân bằng) | 'custom' (Quản trò tự chọn)
  customDeck: [], // Danh sách lá bài được chọn nếu deckMode = 'custom'
  roleRevealOnDeath: "open", // 'open' (Công khai bài khi chết) | 'hidden' (Giấu bài)
  discussionTime: 90, // Thời gian thảo luận ban ngày (giây)
  nightPhaseTime: 20, // Thời gian gọi đêm mỗi vai (giây)
  defenseTime: 20, // Thời gian biện hộ (giây)
  votingTime: 30, // Thời gian bỏ phiếu (giây)
};

/**
 * Gán số ghế (#1 đến #N) thấp nhất còn trống cho người chơi mới
 */
function assignLowestSeatNumber(playersList) {
  const occupiedSeats = new Set(playersList.map((p) => p.seatNumber).filter(Boolean));
  let seat = 1;
  while (occupiedSeats.has(seat)) {
    seat++;
  }
  return seat;
}

/**
 * Lấy danh sách các phòng Online công khai đang chờ ở sảnh
 */
function getPublicRooms() {
  const list = [];
  for (const roomCode in rooms) {
    const meta = roomMetadata[roomCode];
    // Chỉ lấy phòng Online, công khai, chưa bắt đầu ván (gameState !== 'playing')
    if (meta && meta.gameMode === "online" && meta.isPublic && !roomGameData[roomCode]) {
      const players = rooms[roomCode] || [];
      const host = players.find((p) => p.isHost);
      list.push({
        roomCode,
        roomName: meta.roomName || `Phòng của ${host?.characterName || "Ẩn danh"}`,
        playerCount: players.length,
        maxPlayers: meta.maxPlayers || 18,
        hasPin: !!meta.pinCode,
        hostName: host?.characterName || "",
        settings: meta.settings || DEFAULT_ONLINE_SETTINGS,
        createdAt: meta.createdAt,
      });
    }
  }
  // Sắp xếp ưu tiên phòng có người đông nhất (Greedy)
  list.sort((a, b) => b.playerCount - a.playerCount);
  return list;
}

/**
 * Xóa phòng và dữ liệu game khỏi bộ nhớ RAM
 */
function deleteRoom(roomCode) {
  // Clear any active game loop timers for online rooms
  if (roomOnlineState[roomCode]?.timerId) {
    clearTimeout(roomOnlineState[roomCode].timerId);
  }

  delete rooms[roomCode];
  delete roomMetadata[roomCode];
  delete roomGameData[roomCode];
  delete roomOnlineState[roomCode];
  delete roomChatHistory[roomCode];

  // Xóa rate-limit chat timers liên quan đến phòng
  for (const key of lastChatTimeMap.keys()) {
    if (key.startsWith(`${roomCode}_`)) {
      lastChatTimeMap.delete(key);
    }
  }

  if (roomEmptyCleanupTimers.has(roomCode)) {
    clearTimeout(roomEmptyCleanupTimers.get(roomCode));
    roomEmptyCleanupTimers.delete(roomCode);
  }

  // Xóa sạch toàn bộ disconnect grace timers của phòng để tránh rò rỉ bộ nhớ RAM
  for (const [key, timerId] of disconnectGraceTimers.entries()) {
    if (key.startsWith(`${roomCode}_`)) {
      clearTimeout(timerId);
      disconnectGraceTimers.delete(key);
    }
  }
}

/**
 * Hủy timer ngắt kết nối tạm thời của 1 người chơi
 */
function clearPlayerGraceTimer(roomCode, characterName) {
  const graceKey = `${roomCode}_${characterName}`;
  if (disconnectGraceTimers.has(graceKey)) {
    clearTimeout(disconnectGraceTimers.get(graceKey));
    disconnectGraceTimers.delete(graceKey);
    return true;
  }
  return false;
}

/**
 * Hủy timer dọn phòng trống
 */
function clearRoomEmptyTimer(roomCode) {
  if (roomEmptyCleanupTimers.has(roomCode)) {
    clearTimeout(roomEmptyCleanupTimers.get(roomCode));
    roomEmptyCleanupTimers.delete(roomCode);
    return true;
  }
  return false;
}

module.exports = {
  rooms,
  roomMetadata,
  roomGameData,
  roomOnlineState,
  roomChatHistory,
  lastChatTimeMap,
  disconnectGraceTimers,
  roomEmptyCleanupTimers,
  DEFAULT_ONLINE_SETTINGS,
  assignLowestSeatNumber,
  getPublicRooms,
  deleteRoom,
  clearPlayerGraceTimer,
  clearRoomEmptyTimer,
};
