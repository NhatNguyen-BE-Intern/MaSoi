/**
 * TEST EXPANSION 3 (ĐỢT 4) ROLES INTEGRATION TEST
 * Kiểm thử tự động logic của:
 * 1. Dark Cupid (Cupid Nâng Cao)
 * 2. Manipulator Witch (Phù Thủy Thao Túng)
 * 3. Fortune Teller (Thầy Bói)
 * 4. Traitor (Kẻ Phản Bội)
 */

const { DEFAULT_ROLES } = require('../src/constants/roles');
const { SOCKET_EVENTS } = require('../src/constants/socketEvents');
const {
  roomMetadata,
  roomGameData,
  roomOnlineState,
} = require('../src/socket/state');
const {
  handleNightAction,
  registerNightHandlers,
} = require('../src/socket/online/nightEngine');
const {
  finalizeVotingRound1,
  checkOnlineWinCondition,
} = require('../src/socket/online/dayEngine');

console.log('🧪 ========================================================');
console.log('🔮 BẮT ĐẦU KIỂM THỬ ĐỢT 4: EXPANSION 3 - VAI TRÒ MỞ RỘNG');
console.log('🧪 ========================================================\n');

// Mock socket.io
const emittedEvents = [];
const ioMock = {
  to: (room) => ({
    emit: (event, data) => {
      emittedEvents.push({ target: room, event, data });
    },
  }),
  sockets: {
    sockets: new Map([
      ['s_host', { id: 's_host', join: () => {}, emit: (ev, d) => emittedEvents.push({ target: 's_host', event: ev, data: d }) }],
      ['s_cupid', { id: 's_cupid', join: () => {}, emit: (ev, d) => emittedEvents.push({ target: 's_cupid', event: ev, data: d }) }],
      ['s_witch', { id: 's_witch', join: () => {}, emit: (ev, d) => emittedEvents.push({ target: 's_witch', event: ev, data: d }) }],
      ['s_teller', { id: 's_teller', join: () => {}, emit: (ev, d) => emittedEvents.push({ target: 's_teller', event: ev, data: d }) }],
      ['s_traitor', { id: 's_traitor', join: () => {}, emit: (ev, d) => emittedEvents.push({ target: 's_traitor', event: ev, data: d }) }],
      ['s_wolf', { id: 's_wolf', join: () => {}, emit: (ev, d) => emittedEvents.push({ target: 's_wolf', event: ev, data: d }) }],
      ['s_seer', { id: 's_seer', join: () => {}, emit: (ev, d) => emittedEvents.push({ target: 's_seer', event: ev, data: d }) }],
      ['s_villager', { id: 's_villager', join: () => {}, emit: (ev, d) => emittedEvents.push({ target: 's_villager', event: ev, data: d }) }],
    ]),
  },
};

const ROOM = 'ROOM_TEST_EXP3';

// Setup Mock Room Data
roomMetadata[ROOM] = { settings: { nightPhaseTime: 10, discussionTime: 10, votingTime: 10 } };
roomGameData[ROOM] = {
  players: [
    { socketId: 's_cupid', characterName: 'DarkCupidPlayer', seatNumber: 1, role: DEFAULT_ROLES.DARK_CUPID },
    { socketId: 's_witch', characterName: 'ManipulatorPlayer', seatNumber: 2, role: DEFAULT_ROLES.MANIPULATOR_WITCH },
    { socketId: 's_teller', characterName: 'FortuneTellerPlayer', seatNumber: 3, role: DEFAULT_ROLES.FORTUNE_TELLER },
    { socketId: 's_traitor', characterName: 'TraitorPlayer', seatNumber: 4, role: DEFAULT_ROLES.TRAITOR },
    { socketId: 's_wolf', characterName: 'WolfPlayer', seatNumber: 5, role: DEFAULT_ROLES.WOLF },
    { socketId: 's_seer', characterName: 'SeerPlayer', seatNumber: 6, role: DEFAULT_ROLES.SEER },
    { socketId: 's_villager', characterName: 'VillagerPlayer', seatNumber: 7, role: DEFAULT_ROLES.VILLAGER },
  ],
};

roomOnlineState[ROOM] = {
  roomCode: ROOM,
  nightNumber: 1,
  alivePlayers: [
    'DarkCupidPlayer',
    'ManipulatorPlayer',
    'FortuneTellerPlayer',
    'TraitorPlayer',
    'WolfPlayer',
    'SeerPlayer',
    'VillagerPlayer',
  ],
  roles: {
    DarkCupidPlayer: DEFAULT_ROLES.DARK_CUPID,
    ManipulatorPlayer: DEFAULT_ROLES.MANIPULATOR_WITCH,
    FortuneTellerPlayer: DEFAULT_ROLES.FORTUNE_TELLER,
    TraitorPlayer: DEFAULT_ROLES.TRAITOR,
    WolfPlayer: DEFAULT_ROLES.WOLF,
    SeerPlayer: DEFAULT_ROLES.SEER,
    VillagerPlayer: DEFAULT_ROLES.VILLAGER,
  },
  lovers: [],
  darkCupidLovers: null,
  darkCupidPlayer: 'DarkCupidPlayer',
  manipulatedPlayer: null,
  manipulatorPlayer: null,
  traitorPlayer: 'TraitorPlayer',
  traitorAwakened: false,
  wolfVotes: {},
  dayVotes: {},
  mayor: null,
};

let passCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    passCount++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// ==========================================
// TEST 1: THẦY BÓI SOI CHI TIẾT VAI TRÒ
// ==========================================
console.log('\n--- 1. KIỂM THỬ THẦY BÓI (FORTUNE TELLER) ---');
const socketTeller = ioMock.sockets.sockets.get('s_teller');

// Thầy bói soi DarkCupidPlayer
handleNightAction(ioMock, socketTeller, {
  roomCode: ROOM,
  actionType: 'FORTUNE_TELLER_INSPECT',
  targetCharacterName: 'DarkCupidPlayer',
});

const fortuneReveal = emittedEvents.find((e) => e.event === 'fortune_teller_reveal');
assert(fortuneReveal !== undefined, 'Thầy bói nhận được event fortune_teller_reveal');
assert(fortuneReveal?.data?.roleName === 'Cupid Nâng Cao (Dark Cupid)', 'Thầy bói thấy đúng tên vai trò Cupid Nâng Cao');
assert(fortuneReveal?.data?.team === 'Thứ 3', 'Thầy bói thấy đúng phe Thứ 3');

// ==========================================
// TEST 2: TIÊN TRI SOI KẺ PHẢN BỘI RA PHE DÂN
// ==========================================
console.log('\n--- 2. KIỂM THỬ TIÊN TRI SOI KẺ PHẢN BỘI (TRAITOR) ---');
const socketSeer = ioMock.sockets.sockets.get('s_seer');

// Tiên Tri soi TraitorPlayer
handleNightAction(ioMock, socketSeer, {
  roomCode: ROOM,
  actionType: 'SEER_INSPECT',
  targetCharacterName: 'TraitorPlayer',
});

const seerReveal = emittedEvents.find((e) => e.event === 'seer_reveal');
assert(seerReveal !== undefined, 'Tiên tri nhận được seer_reveal');
assert(seerReveal?.data?.isWolf === false, 'Kẻ Phản Bội soi KHÔNG PHẢI là Sói (trà trộn vào Dân)');
assert(seerReveal?.data?.team === 'Dân', 'Tiên tri soi ra Phe Dân Làng');

// ==========================================
// TEST 3: PHÙ THỦY THAO TÚNG (MANIPULATOR WITCH)
// ==========================================
console.log('\n--- 3. KIỂM THỬ PHÙ THỦY THAO TÚNG (MANIPULATOR WITCH) ---');
const socketWitch = ioMock.sockets.sockets.get('s_witch');

// Đêm: Phù Thủy thao túng VillagerPlayer
handleNightAction(ioMock, socketWitch, {
  roomCode: ROOM,
  actionType: 'MANIPULATOR_TARGET',
  targetCharacterName: 'VillagerPlayer',
});

const state = roomOnlineState[ROOM];
assert(state.manipulatedPlayer === 'VillagerPlayer', 'State ghi nhận VillagerPlayer bị thao túng');
assert(state.manipulatorPlayer === 'ManipulatorPlayer', 'State ghi nhận ManipulatorPlayer là kẻ thao túng');

// Ngày: Phù Thủy vote SeerPlayer, nhưng VillagerPlayer tự vote WolfPlayer
state.dayVotes = {
  ManipulatorPlayer: 'SeerPlayer',
  VillagerPlayer: 'WolfPlayer', // Phiếu ban đầu
  SeerPlayer: 'WolfPlayer',
  WolfPlayer: 'SeerPlayer',
};

// Chốt vote ngày
finalizeVotingRound1(ioMock, ROOM);

assert(
  state.dayVotes['VillagerPlayer'] === 'SeerPlayer',
  'Lá phiếu của VillagerPlayer bị cưỡng chế đổi thành SeerPlayer theo ý Phù Thủy!',
);

// ==========================================
// TEST 4: THỨC TỈNH KẺ PHẢN BỘI KHI SÓI CHẾT HẾT
// ==========================================
console.log('\n--- 4. KIỂM THỬ KẺ PHẢN BỘI THỨC TỈNH (TRAITOR AWAKENING) ---');
// Sói duy nhất (WolfPlayer) chết
state.alivePlayers = state.alivePlayers.filter((p) => p !== 'WolfPlayer');

// Kiểm tra điều kiện thắng
const isGameOver1 = checkOnlineWinCondition(ioMock, ROOM);
assert(isGameOver1 === false, 'Game KHÔNG kết thúc khi Sói chết vì Kẻ Phản Bội còn sống!');
assert(state.traitorAwakened === true, 'Kẻ Phản Bội đã thức tỉnh (traitorAwakened = true)!');
assert(state.roles['TraitorPlayer'].team === 'Sói', 'Kẻ Phản Bội chuyển sang phe Sói chính thức!');
assert(state.roles['TraitorPlayer'].name === 'Ma Sói (Thức Tỉnh)', 'Tên vai trò đổi thành Ma Sói (Thức Tỉnh)!');

// ==========================================
// TEST 5: DARK CUPID & CẶP ĐÔI CHIẾN THẮNG PHE THỨ 3
// ==========================================
console.log('\n--- 5. KIỂM THỬ ĐIỀU KIỆN THẮNG DARK CUPID & CẶP ĐÔI ---');
state.darkCupidLovers = ['SeerPlayer', 'VillagerPlayer'];
// Giả sử tất cả mọi người khác đều đã chết, chỉ còn Cặp Đôi và Dark Cupid
state.alivePlayers = ['DarkCupidPlayer', 'SeerPlayer', 'VillagerPlayer'];

const isGameOver2 = checkOnlineWinCondition(ioMock, ROOM);
assert(isGameOver2 === true, 'Game kết thúc thắng lợi cho Phe Thứ 3 Dark Cupid!');
const gameOverEvent = emittedEvents.reverse().find((e) => e.event === 'game_over');
assert(gameOverEvent?.data?.winner === 'Cupid Bóng Tối & Cặp Đôi', 'Winner được xác nhận là Cupid Bóng Tối & Cặp Đôi!');

console.log('\n========================================================');
console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passCount}/${totalCount} BÀI TEST THÀNH CÔNG!`);
console.log('========================================================\n');

process.exit(passCount === totalCount ? 0 : 1);
