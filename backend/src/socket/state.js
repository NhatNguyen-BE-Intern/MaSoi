/**
 * QUẢN LÝ TRẠNG THÁI IN-MEMORY TOÀN BỘ PHÒNG VÀ GAME
 * - rooms: { [roomCode]: [{ characterName, socketId, isHost, ... }] }
 * - roomGameData: { [roomCode]: { moderator, players, cardsInGame, nightOrder } }
 * - disconnectGraceTimers: Key `${roomCode}_${characterName}` -> setTimeout id (Grace period khi F5)
 * - roomEmptyCleanupTimers: Key `roomCode` -> setTimeout id (Dọn phòng bỏ hoang)
 */

const rooms = {};
const roomGameData = {};
const disconnectGraceTimers = new Map();
const roomEmptyCleanupTimers = new Map();

/**
 * Xóa phòng và dữ liệu game khỏi bộ nhớ RAM
 */
function deleteRoom(roomCode) {
  delete rooms[roomCode];
  delete roomGameData[roomCode];

  if (roomEmptyCleanupTimers.has(roomCode)) {
    clearTimeout(roomEmptyCleanupTimers.get(roomCode));
    roomEmptyCleanupTimers.delete(roomCode);
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
  roomGameData,
  disconnectGraceTimers,
  roomEmptyCleanupTimers,
  deleteRoom,
  clearPlayerGraceTimer,
  clearRoomEmptyTimer,
};
