/**
 * TEST EXPANSION 5 (THE FINAL 4 ROLES) INTEGRATION TEST
 * Kiểm thử tự động logic của:
 * 1. Beholder (Người Quan Sát - Thức đêm 1 nhận diện Tiên Tri thật)
 * 2. Apprentice Seer (Tiên Tri Tập Sự - Kế thừa quả cầu khi Tiên Tri chính tử nạn)
 * 3. Drunk (Kẻ Say - Tỉnh rượu ở Đêm 3 nhận vai trò thật)
 * 4. Shadow Hunter (Thợ Săn Bóng Đêm - Bắn hạ kẻ Phe Thứ 3, vô hại với Dân và Sói)
 * 5. Danh mục 34 lá bài hoàn chỉnh 100%
 */

const { DEFAULT_ROLES } = require('../src/constants/roles');
const SOCKET_EVENTS = require('../src/constants/socketEvents');
const {
  roomMetadata,
  roomGameData,
  roomOnlineState,
} = require('../src/socket/state');
const {
  initOnlineGame,
  startNightPhase,
  handleNightAction,
} = require('../src/socket/online/nightEngine');
const {
  resolveDeathQueue,
} = require('../src/socket/online/dayEngine');

console.log('🧪 ========================================================');
console.log('🔮 BẮT ĐẦU KIỂM THỬ ĐỢT 6: EXPANSION 5 - THE FINAL ROLES (34 LÁ BÀI)');
console.log('🧪 ========================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
  }
}

// Mock socket.io
const emittedEvents = [];
const joinedRooms = {};
const mockSocketHandlers = {};

const createMockSocket = (id) => ({
  id,
  join: (room) => {
    joinedRooms[id] = joinedRooms[id] || [];
    joinedRooms[id].push(room);
  },
  emit: (ev, d) => {
    emittedEvents.push({ target: id, event: ev, data: d });
  },
  on: (ev, fn) => {
    mockSocketHandlers[id] = mockSocketHandlers[id] || {};
    mockSocketHandlers[id][ev] = fn;
  },
});

const ioMock = {
  to: (room) => ({
    emit: (event, data) => {
      emittedEvents.push({ target: room, event, data });
    },
  }),
  sockets: {
    sockets: new Map([
      ['s_beholder', createMockSocket('s_beholder')],
      ['s_seer', createMockSocket('s_seer')],
      ['s_apprentice', createMockSocket('s_apprentice')],
      ['s_drunk', createMockSocket('s_drunk')],
      ['s_shadow_hunter', createMockSocket('s_shadow_hunter')],
      ['s_serial_killer', createMockSocket('s_serial_killer')],
      ['s_wolf', createMockSocket('s_wolf')],
      ['s_villager', createMockSocket('s_villager')],
    ]),
  },
};

const ROOM = 'ROOM_TEST_EXP5';

// Setup Mock Data
roomMetadata[ROOM] = { settings: { nightPhaseTime: 10, roleRevealOnDeath: 'open' } };
roomGameData[ROOM] = {
  players: [
    { socketId: 's_beholder', characterName: 'BeholderPlayer', seatNumber: 1, role: DEFAULT_ROLES.BEHOLDER },
    { socketId: 's_seer', characterName: 'SeerPlayer', seatNumber: 2, role: DEFAULT_ROLES.SEER },
    { socketId: 's_apprentice', characterName: 'ApprenticePlayer', seatNumber: 3, role: DEFAULT_ROLES.APPRENTICE_SEER },
    { socketId: 's_drunk', characterName: 'DrunkPlayer', seatNumber: 4, role: DEFAULT_ROLES.DRUNK },
    { socketId: 's_shadow_hunter', characterName: 'ShadowHunterPlayer', seatNumber: 5, role: DEFAULT_ROLES.SHADOW_HUNTER },
    { socketId: 's_serial_killer', characterName: 'SerialKillerPlayer', seatNumber: 6, role: DEFAULT_ROLES.SERIAL_KILLER },
    { socketId: 's_wolf', characterName: 'WolfPlayer', seatNumber: 7, role: DEFAULT_ROLES.WOLF },
    { socketId: 's_villager', characterName: 'VillagerPlayer', seatNumber: 8, role: DEFAULT_ROLES.VILLAGER },
  ],
};

// ========================================================
// TEST 1: Người Quan Sát (Beholder) nhìn thấy đúng Tiên Tri thật ở Đêm 1
// ========================================================
console.log('--- TEST 1: Người Quan Sát (Beholder) nhận diện Tiên Tri thật Đêm 1 ---');
initOnlineGame(ioMock, ROOM);

const beholderEvent = emittedEvents.find(
  (e) => e.target === 's_beholder' && e.event === SOCKET_EVENTS.SERVER.BEHOLDER_REVEAL
);

assert(!!beholderEvent, 'Người Quan Sát nhận được sự kiện beholder_reveal từ Server');
assert(beholderEvent?.data?.found === true, 'Trạng thái found = true khi trong làng có Tiên Tri thật');
assert(beholderEvent?.data?.seerName === 'SeerPlayer', 'Nhìn thấy đúng tên SeerPlayer');
assert(beholderEvent?.data?.seerSeat === 2, 'Nhìn thấy đúng số ghế #2 của Tiên Tri');

// ========================================================
// TEST 2: Tiên Tri Tập Sự (Apprentice Seer) kế thừa quả cầu khi Tiên Tri chính tử nạn
// ========================================================
console.log('\n--- TEST 2: Tiên Tri Tập Sự kế thừa quả cầu pha lê khi Tiên Tri chính tử nạn ---');
const state = roomOnlineState[ROOM];

// Giả lập Tiên Tri chính tử nạn trong hàng đợi deathQueue
state.deathQueue = [
  {
    characterName: 'SeerPlayer',
    cause: 'Bị Ma Sói cắn',
    role: DEFAULT_ROLES.SEER,
  },
];

resolveDeathQueue(ioMock, ROOM, () => {});

assert(state.apprenticeAwakened === true, 'Cờ state.apprenticeAwakened được kích hoạt thành true');
assert(
  state.roles['ApprenticePlayer']?.name?.includes('Tập Sự Thức Tỉnh'),
  'Vai trò của ApprenticePlayer đã được nâng cấp thành Tiên Tri (Tập Sự Thức Tỉnh)'
);

const apprenticeEvent = emittedEvents.find(
  (e) => e.target === 's_apprentice' && e.event === SOCKET_EVENTS.SERVER.APPRENTICE_AWAKENED
);
assert(!!apprenticeEvent, 'ApprenticePlayer nhận được sự kiện APPRENTICE_AWAKENED');

// ========================================================
// TEST 3: Kẻ Say (Drunk) tỉnh rượu ở Đêm 3
// ========================================================
console.log('\n--- TEST 3: Kẻ Say (Drunk) tỉnh rượu ở Đêm 3 và nhận vai trò thật ---');
// Gán trước vai trò tiềm ẩn cho Drunk là Bảo Vệ
state.drunkRealRoles['DrunkPlayer'] = DEFAULT_ROLES.GUARD;
state.drunkSobered['DrunkPlayer'] = false;
state.nightNumber = 2; // Sắp sang đêm 3

// Bắt đầu đêm 3
startNightPhase(ioMock, ROOM);

assert(state.nightNumber === 3, 'Trận đấu bước sang Đêm 3');
assert(state.drunkSobered['DrunkPlayer'] === true, 'Kẻ Say đã chính thức tỉnh rượu (drunkSobered = true)');
assert(
  state.roles['DrunkPlayer']?.name === 'Bảo Vệ',
  'Vai trò của DrunkPlayer đã được cập nhật thành Bảo Vệ'
);

const drunkSoberEvent = emittedEvents.find(
  (e) => e.target === 's_drunk' && e.event === SOCKET_EVENTS.SERVER.DRUNK_SOBERED
);
assert(!!drunkSoberEvent, 'DrunkPlayer nhận được sự kiện DRUNK_SOBERED');
assert(drunkSoberEvent?.data?.newRole?.name === 'Bảo Vệ', 'Nội dung sự kiện mang đúng vai trò thật mới');

// ========================================================
// TEST 4: Thợ Săn Bóng Đêm (Shadow Hunter) bắn trúng kẻ Phe Thứ 3 (Sát Thủ)
// ========================================================
console.log('\n--- TEST 4: Thợ Săn Bóng Đêm bắn trúng kẻ Phe Thứ 3 (Sát Thủ) ---');
state.shadowHunterBulletUsed = false;
state.shadowHunterTarget = null;

const shadowSocket = ioMock.sockets.sockets.get('s_shadow_hunter');
handleNightAction(ioMock, shadowSocket, {
  roomCode: ROOM,
  actionType: 'SHADOW_HUNTER_SHOOT',
  targetCharacterName: 'SerialKillerPlayer',
});

assert(state.shadowHunterBulletUsed === true, 'Viên đạn của Thợ Săn Bóng Đêm đã được sử dụng (bulletUsed = true)');
assert(
  state.shadowHunterTarget === 'SerialKillerPlayer',
  'Mục tiêu Phe Thứ 3 (SerialKillerPlayer) được ghi nhận vào state.shadowHunterTarget'
);

const shootHitEvent = emittedEvents.find(
  (e) => e.target === 's_shadow_hunter' && e.event === SOCKET_EVENTS.SERVER.SHADOW_HUNTER_RESULT && e.data?.success === true
);
assert(!!shootHitEvent, 'Nhận được sự kiện SHADOW_HUNTER_RESULT thành công');
assert(shootHitEvent?.data?.isThirdParty === true, 'Hệ thống xác nhận mục tiêu thuộc Phe Thứ 3');

// ========================================================
// TEST 5: Thợ Săn Bóng Đêm (Shadow Hunter) bắn nhầm Dân Làng / Sói -> Trượt vô hại
// ========================================================
console.log('\n--- TEST 5: Thợ Săn Bóng Đêm bắn nhầm Dân Làng -> Phát đạn trượt vô hại ---');
state.shadowHunterBulletUsed = false;
state.shadowHunterTarget = null;

handleNightAction(ioMock, shadowSocket, {
  roomCode: ROOM,
  actionType: 'SHADOW_HUNTER_SHOOT',
  targetCharacterName: 'VillagerPlayer',
});

assert(state.shadowHunterBulletUsed === true, 'Phát đạn đã tiêu hao');
assert(
  state.shadowHunterTarget === null,
  'Mục tiêu Dân Làng KHÔNG bị ghi nhận vào tử nạn (state.shadowHunterTarget vẫn là null)'
);

const shootMissEvent = emittedEvents.find(
  (e) => e.target === 's_shadow_hunter' && e.event === SOCKET_EVENTS.SERVER.SHADOW_HUNTER_RESULT && e.data?.success === false
);
assert(!!shootMissEvent, 'Nhận được sự kiện SHADOW_HUNTER_RESULT báo trượt');
assert(shootMissEvent?.data?.isThirdParty === false, 'Xác nhận mục tiêu không thuộc Phe Thứ 3');

// ========================================================
// TEST 6: Toàn bộ danh mục 34 lá bài hoàn chỉnh 100%
// ========================================================
console.log('\n--- TEST 6: Kiểm tra danh mục 34 thẻ bài hoàn chỉnh trong hệ thống ---');
const totalRolesCount = Object.keys(DEFAULT_ROLES).length;
assert(totalRolesCount === 34, `Tổng số thẻ bài trong DEFAULT_ROLES là đúng 34 lá (Hiện tại: ${totalRolesCount})`);

const allRolesValid = Object.values(DEFAULT_ROLES).every(
  (r) => r.name && r.team && r.description && r._id
);
assert(allRolesValid, '100% thẻ bài đều có đầy đủ định danh _id, name, team và description');

// ========================================================
// TỔNG KẾT
// ========================================================
console.log('\n========================================================');
console.log(`🏆 KẾT QUẢ KIỂM THỬ EXPANSION 5: ${passedTests}/${totalTests} TESTS PASS (100%)`);
console.log('========================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
