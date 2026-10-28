const SOCKET_EVENTS = require("../../constants/socketEvents");
const {
  rooms,
  roomMetadata,
  roomGameData,
  roomOnlineState,
} = require("../state");
const { isRoleWolf, isRoleThirdParty } = require("../../utils/cardHelper");

/**
 * MODULE ĐIỀU PHỐI MÁY TRẠNG THÁI TỰ ĐỘNG PHA ĐÊM (NIGHT ENGINE)
 * Quản lý tuần tự các lượt gọi đêm, tự động hóa 100% không cần Quản trò con người.
 */

/**
 * Khởi tạo trận đấu Online và bắt đầu Đêm 1
 * @param {Server} io
 * @param {string} roomCode
 */
function initOnlineGame(io, roomCode) {
  const g = roomGameData[roomCode];
  const meta = roomMetadata[roomCode];
  if (!g || !meta) return;

  const players = g.players || [];
  const alivePlayers = players.map((p) => p.characterName);
  const roles = {};
  players.forEach((p) => {
    roles[p.characterName] = p.role;
  });

  // Khởi tạo state độc quyền cho trận Online
  roomOnlineState[roomCode] = {
    roomCode,
    dayNumber: 0,
    nightNumber: 0,
    currentPhase: "NIGHT_START",
    phaseEndsAt: 0,
    timerId: null,
    alivePlayers,
    roles,
    lovers: [],
    mayor: null,
    // Night tracking
    lastProtected: null,
    protectedThisNight: null,
    wolfVotes: {},
    wolfTarget: null,
    wolfTarget2: null,
    wolfTieExtended: false,
    wolfCubExtraKill: false,
    activeDoubleKill: false,
    alphaWolfInfectUsed: false,
    alphaWolfInfectTarget: null,
    whiteWolfTarget: null,
    witchHealUsed: false,
    witchPoisonUsed: false,
    witchSaved: false,
    witchPoisonTarget: null,
    seerTarget: null,
    pendingNightDeaths: [],
    // Expansion 2: Tương tác phức tạp & Phe Thứ 3
    centerCards: [
      { name: "Dân Làng", team: "Dân", description: "Dân làng lương thiện." },
      { name: "Ma Sói (Thường)", team: "Sói", description: "Ma Sói khát máu." },
    ],
    doppelgangerTarget: null,
    doppelgangerInherited: false,
    elderLives: {},
    villageStripped: false,
    serialKillerTarget: null,
    // Expansion 3: Vai trò phụ trợ & Phe Trung Lập mở rộng (Đợt 4)
    darkCupidLovers: null,
    darkCupidPlayer: null,
    manipulatedPlayer: null,
    manipulatorPlayer: null,
    traitorPlayer: null,
    traitorAwakened: false,
    fortuneTellerTarget: null,
    // Expansion 4: Bảo vệ thần thánh, phản kích & phóng hỏa (Đợt 5)
    dousedPlayers: [], // Người bị tẩm xăng
    arsonistIgnited: false, // Châm lửa đêm nay
    priestBlessed: null, // Người được Thầy Tu ban phước
    judgePardonUsed: false, // Thẩm Phán đã phủ quyết chưa
    // Expansion 5: 4 Lá Bài Cuối Cùng (Hoàn thiện 34 lá bài)
    shadowHunterBulletUsed: false,
    shadowHunterTarget: null,
    drunkRealRoles: {},
    drunkSobered: {},
    apprenticeAwakened: false,
  };

  // Khởi tạo vai trò ẩn cho Kẻ Say (Drunk)
  const potentialDrunkRoles = [
    { _id: "guard_default", name: "Bảo Vệ", team: "Dân", description: "Bảo vệ 1 người mỗi đêm." },
    { _id: "hunter_default", name: "Thợ Săn", team: "Dân", description: "Nổ súng khi tử nạn." },
    { _id: "seer_default", name: "Tiên Tri", team: "Dân", description: "Soi bài mỗi đêm." },
    { _id: "witch_default", name: "Phù Thủy", team: "Dân", description: "2 bình thuốc cứu và độc." },
    { _id: "knight_default", name: "Hiệp Sĩ Ánh Sáng", team: "Dân", description: "Phản đòn khi bị Sói cắn." },
    { _id: "priest_default", name: "Thầy Tu", team: "Dân", description: "Ban phước giải tà và dầu xăng." },
    { _id: "wolf_default", name: "Ma Sói (Thường)", team: "Sói", description: "Thức dậy cùng bầy cắn người." },
  ];

  players.forEach((p) => {
    const isDrunk =
      p.role?.name?.toLowerCase().includes("say") ||
      p.role?.name?.toLowerCase().includes("drunk");
    if (isDrunk) {
      const assignedRole =
        potentialDrunkRoles[Math.floor(Math.random() * potentialDrunkRoles.length)];
      roomOnlineState[roomCode].drunkRealRoles[p.characterName] = assignedRole;
    }
  });

  // Khởi tạo 2 mạng cho Già Làng
  players.forEach((p) => {
    const isElder =
      p.role?.name?.toLowerCase().includes("già làng") ||
      p.role?.name?.toLowerCase().includes("elder");
    if (isElder) {
      roomOnlineState[roomCode].elderLives[p.characterName] = 2;
    }

    const isTraitor =
      p.role?.name?.toLowerCase().includes("phản bội") ||
      p.role?.name?.toLowerCase().includes("traitor");
    if (isTraitor) {
      roomOnlineState[roomCode].traitorPlayer = p.characterName;
    }
  });

  // Tìm danh sách bầy Sói nguyên bản
  const currentOnlineState = roomOnlineState[roomCode];
  const wolfNames = players
    .filter((p) => isRoleWolf(p.role, currentOnlineState))
    .map((p) => p.characterName);

  // Đưa tất cả người chơi vào các socket room tương ứng
  players.forEach((p) => {
    const s = io.sockets.sockets.get(p.socketId);
    if (!s) return;
    // Dọn dẹp phòng cũ nếu có từ ván trước
    if (typeof s.leave === "function") {
      s.leave(`room_${roomCode}_wolf`);
      s.leave(`room_${roomCode}_town`);
    }

    // Vào Town Room chung
    s.join(`room_${roomCode}_town`);

    const isTraitor =
      p.role?.name?.toLowerCase().includes("phản bội") ||
      p.role?.name?.toLowerCase().includes("traitor");

    // Nếu là Sói nguyên bản, vào Wolf Room
    const isWolf = isRoleWolf(p.role, currentOnlineState);

    if (isWolf && !isTraitor) {
      s.join(`room_${roomCode}_wolf`);
    }

    // Nếu là Cô Bé, lén vào xem phòng chat của bầy Sói
    const isLittleGirl =
      p.role?.name?.toLowerCase().includes("cô bé") ||
      p.role?.name?.toLowerCase().includes("little girl");
    if (isLittleGirl) {
      s.join(`room_${roomCode}_wolf`);
      s.emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        "👧 Bạn là Cô Bé! Ban đêm bạn được lén nhìn trộm phòng chat của bầy Ma Sói để nắm bắt manh mối!",
      );
    }

    // Nếu là Kẻ Phản Bội, thông báo danh tính bầy Sói
    if (isTraitor) {
      s.emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        wolfNames.length > 0
          ? `🐺 Bạn là Kẻ Phản Bội! Đồng minh Ma Sói của bạn gồm: [${wolfNames.join(", ")}]. Hãy hỗ trợ họ tiêu diệt dân làng!`
          : "🐺 Bạn là Kẻ Phản Bội! Hãy âm thầm giúp đỡ loài Sói giành chiến thắng!",
      );
    }

    // Nếu là Người Quan Sát (Beholder), cho biết ai là Tiên Tri thật ngay từ đầu
    const isBeholder =
      p.role?.name?.toLowerCase().includes("quan sát") ||
      p.role?.name?.toLowerCase().includes("beholder") ||
      p.role?.name?.toLowerCase().includes("nhìn trộm");
    if (isBeholder) {
      const seerPlayer = players.find((pl) => {
        const r = pl.role;
        return (
          (r?.name?.toLowerCase().includes("tiên tri") || r?.name?.toLowerCase().includes("seer")) &&
          !r?.name?.toLowerCase().includes("tập sự") &&
          !r?.name?.toLowerCase().includes("apprentice")
        );
      });
      s.emit(SOCKET_EVENTS.SERVER.BEHOLDER_REVEAL, {
        seerName: seerPlayer ? seerPlayer.characterName : null,
        seerSeat: seerPlayer?.seatNumber !== undefined ? seerPlayer.seatNumber : null,
        found: !!seerPlayer,
        message: seerPlayer
          ? `🌟 Bạn nhìn thấy linh ảnh báo mộng: Người chơi ${seerPlayer.characterName} (Ghế #${seerPlayer.seatNumber !== undefined ? seerPlayer.seatNumber : 1}) chính là Tiên Tri thật sự của ngôi làng!`
          : "🌟 Linh ảnh tối tăm, ngôi làng này không có Tiên Tri thật sự!",
      });
    }
  });

  // Bắt đầu chu kỳ Đêm 1
  startNightPhase(io, roomCode);
}

/**
 * Bắt đầu một đêm mới
 */
function startNightPhase(io, roomCode) {
  const state = roomOnlineState[roomCode];
  const meta = roomMetadata[roomCode];
  if (!state || !meta) return;

  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }

  state.nightNumber += 1;
  state.currentPhase = "NIGHT_START";

  // Reset biến tạm thời trong đêm
  state.protectedThisNight = null;
  state.wolfVotes = {};
  state.wolfTarget = null;
  state.wolfTarget2 = null;
  state.alphaWolfInfectTarget = null;
  state.whiteWolfTarget = null;
  state.serialKillerTarget = null;
  state.manipulatedPlayer = null;
  state.fortuneTellerTarget = null;
  state.wolfTieExtended = false;
  state.witchSaved = false;
  state.witchPoisonTarget = null;
  state.seerTarget = null;
  state.arsonistIgnited = false;
  state.priestBlessed = null;
  state.shadowHunterTarget = null;

  // Expansion 5: Kẻ Say (Drunk) tỉnh rượu ở Đêm 3
  if (state.nightNumber >= 3 && state.drunkRealRoles) {
    Object.keys(state.drunkRealRoles).forEach((drunkName) => {
      if (state.alivePlayers.includes(drunkName) && !state.drunkSobered[drunkName]) {
        state.drunkSobered[drunkName] = true;
        const realRole = state.drunkRealRoles[drunkName];
        state.roles[drunkName] = realRole;
        const g = roomGameData[roomCode];
        const pRecord = g?.players.find((p) => p.characterName === drunkName);
        if (pRecord) {
          pRecord.role = realRole;
          const s = io.sockets.sockets.get(pRecord.socketId);
          if (s) {
            if (realRole.team === "Sói" || realRole.name?.includes("Sói")) {
              s.join(`room_${roomCode}_wolf`);
            }
            s.emit(SOCKET_EVENTS.SERVER.RECEIVE_ROLE, {
              ...realRole,
              isAlive: true,
            });
            s.emit(SOCKET_EVENTS.SERVER.DRUNK_SOBERED, {
              newRole: realRole,
              message: `🍷 Rượu nồng đã tan! Bạn đã tỉnh rượu và phát hiện vai trò thật của mình là: ${realRole.name}!`,
            });
          }
        }
        io.to(roomCode).emit(
          SOCKET_EVENTS.SERVER.ERROR_MSG,
          `🍷 Kẻ Say của làng sau 3 ngày say mèm đã chính thức tỉnh rượu!`
        );
      }
    });
  }

  // Nếu Sói Con chết đêm trước hoặc ngày trước -> kích hoạt 2 lượt cắn đêm nay
  if (state.wolfCubExtraKill) {
    state.activeDoubleKill = true;
    state.wolfCubExtraKill = false;
    io.to(`room_${roomCode}_wolf`).emit(
      SOCKET_EVENTS.SERVER.ERROR_MSG,
      "🐺 Tiếng gầm thù hận của Sói Con vang lên! Bầy Ma Sói cuồng nộ được cắn 2 nạn nhân đêm nay!"
    );
  } else {
    state.activeDoubleKill = false;
  }

  // Phát tiếng sói hú rùng rợn mở màn đêm
  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.SOUND_TRIGGERED, "wolf");

  // Thông báo bắt đầu đêm
  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.PHASE_CHANGED, {
    phase: "NIGHT_START",
    title: `🌙 Đêm Thứ ${state.nightNumber} Buông Xuống`,
    instruction: "Cả làng hãy nhắm mắt đi ngủ, bóng tối đang bao trùm lấy ngôi làng...",
    duration: 5,
    nightNumber: state.nightNumber,
  });

  // Sau 5s mở màn, bắt đầu kịch bản gọi các vai trò ban đêm
  state.timerId = setTimeout(() => {
    buildAndRunNightSteps(io, roomCode);
  }, 5000);
}

/**
 * Tạo danh sách các bước đêm dựa trên các lá bài trong ván
 */
function getNightSteps(state) {
  const steps = [];

  // BƯỚC THIẾT LẬP (CHỈ DUY NHẤT ĐÊM 1)
  if (state.nightNumber === 1) {
    if (hasRoleInGame(state, ["hóa sói", "doppelganger"])) {
      steps.push({ type: "DOPPELGANGER", roleKeyword: "hóa sói", duration: 18 });
    }
    if (hasRoleInGame(state, ["kẻ trộm", "thief", "trộm"])) {
      steps.push({ type: "THIEF", roleKeyword: "trộm", duration: 20 });
    }
    if (hasRoleInGame(state, ["đánh tráo", "troublemaker"])) {
      steps.push({ type: "TROUBLEMAKER", roleKeyword: "đánh tráo", duration: 20 });
    }
    // 1. Thần Tình Yêu Thường & Cupid Nâng Cao (Dark Cupid)
    if (hasRoleInGame(state, ["dark cupid", "cupid nâng cao", "bóng tối"])) {
      steps.push({ type: "DARK_CUPID", roleKeyword: "dark cupid", duration: 22 });
    } else if (hasRoleInGame(state, ["cupid", "tình yêu"])) {
      steps.push({ type: "CUPID", roleKeyword: "tình yêu", duration: 22 });
    }
    // 1.1. Người Quan Sát (Beholder) - Chỉ Đêm 1
    if (hasRoleInGame(state, ["quan sát", "beholder", "nhìn trộm"])) {
      steps.push({ type: "BEHOLDER", roleKeyword: "beholder", duration: 15 });
    }
  }

  // 1.5. Phù Thủy Thao Túng (Manipulator Witch) - Thao túng tâm trí
  if (hasRoleInGame(state, ["thao túng", "manipulator"])) {
    steps.push({ type: "MANIPULATOR_WITCH", roleKeyword: "thao túng", duration: 20 });
  }

  // 1.8. Thầy Tu (Priest) - Ban phước hóa giải
  if (hasRoleInGame(state, ["thầy tu", "priest"]) && !state.villageStripped) {
    steps.push({ type: "PRIEST", roleKeyword: "thầy tu", duration: 20 });
  }

  // 2. Bảo Vệ (Guard) - vô hiệu nếu làng bị tước phép
  if (hasRoleInGame(state, ["bảo vệ", "guard"]) && !state.villageStripped) {
    steps.push({ type: "GUARD", roleKeyword: "bảo vệ", duration: 20 });
  }

  // 3. Bầy Ma Sói (Werewolves)
  steps.push({ type: "WOLF", roleKeyword: "sói", duration: 25 });

  // 3.5. Sói Trắng (White Wolf) - Cứ mỗi 2 đêm (Đêm 2, 4...) thức riêng cắn 1 con sói khác
  if (state.nightNumber % 2 === 0 && hasRoleInGame(state, ["sói trắng", "white wolf"])) {
    steps.push({ type: "WHITE_WOLF", roleKeyword: "sói trắng", duration: 20 });
  }

  // 3.6. Sát Thủ (Serial Killer) - Mỗi đêm đâm 1 người xuyên khiên
  if (hasRoleInGame(state, ["sát thủ", "serial killer"])) {
    steps.push({ type: "SERIAL_KILLER", roleKeyword: "sát thủ", duration: 18 });
  }

  // 3.65. Thợ Săn Bóng Đêm (Shadow Hunter) - 1 phát đạn duy nhất săn Phe Thứ 3
  if (hasRoleInGame(state, ["thợ săn bóng đêm", "shadow hunter", "bóng đêm"]) && !state.shadowHunterBulletUsed) {
    steps.push({ type: "SHADOW_HUNTER", roleKeyword: "bóng đêm", duration: 20 });
  }

  // 3.7. Kẻ Độc Hành (Arsonist) - Tẩm xăng hoặc Châm Lửa
  if (hasRoleInGame(state, ["kẻ độc hành", "arsonist", "phóng hỏa"])) {
    steps.push({ type: "ARSONIST", roleKeyword: "độc hành", duration: 20 });
  }

  // 4. Tiên Tri (Seer) - vô hiệu nếu làng bị tước phép
  if (hasRoleInGame(state, ["tiên tri", "seer"]) && !state.villageStripped) {
    steps.push({ type: "SEER", roleKeyword: "tiên tri", duration: 20 });
  }

  // 4.5. Thầy Bói (Fortune Teller) - Soi chi tiết vai trò
  if (hasRoleInGame(state, ["thầy bói", "fortune teller"]) && !state.villageStripped) {
    steps.push({ type: "FORTUNE_TELLER", roleKeyword: "thầy bói", duration: 20 });
  }

  // 5. Phù Thủy (Witch) - vô hiệu nếu làng bị tước phép
  if (hasRoleInGame(state, ["phù thủy", "witch"]) && !state.villageStripped) {
    steps.push({ type: "WITCH", roleKeyword: "phù thủy", duration: 22 });
  }

  return steps;
}

/**
 * Tạo danh sách các bước đêm dựa trên các lá bài trong ván
 */
function buildAndRunNightSteps(io, roomCode) {
  const state = roomOnlineState[roomCode];
  if (!state) return;

  const steps = getNightSteps(state);
  runNightStep(io, roomCode, 0, steps);
}

/**
 * Thực thi một bước trong chuỗi hành động ban đêm
 */
function runNightStep(io, roomCode, stepIndex, steps) {
  const state = roomOnlineState[roomCode];
  const meta = roomMetadata[roomCode];
  if (!state || !meta) return;

  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }

  // Lưu lại bước hiện tại để skipCurrentStep luôn trỏ chính xác bước tiếp theo
  state.currentStepIndex = stepIndex;
  state.nightSteps = steps;

  // Nếu đã duyệt hết tất cả các bước đêm -> Chuyển sang kết thúc đêm
  if (stepIndex >= steps.length) {
    return resolveNightPhase(io, roomCode);
  }

  const step = steps[stepIndex];
  const duration = (meta.settings && meta.settings.nightPhaseTime) || step.duration || 20;

  // Tìm người chơi giữ vai trò này
  const activePlayers = getAlivePlayersWithRole(state, step.roleKeyword);
  const isRoleAlive = activePlayers.length > 0;
  const isHiddenDeath = meta.settings?.roleRevealOnDeath === "hidden";

  // Nếu vai trò đã chết hoặc không có ai sống
  if (!isRoleAlive) {
    // Nếu phòng bật Giấu bài khi chết: Chạy Fake Phase (6s - 8s) để không bị đếm giây đoán bài!
    if (isHiddenDeath) {
      const fakeDuration = Math.floor(Math.random() * 3) + 6; // 6s - 8s
      state.currentPhase = `NIGHT_${step.type}`;
      state.phaseEndsAt = Date.now() + fakeDuration * 1000;

      io.to(roomCode).emit(SOCKET_EVENTS.SERVER.PHASE_CHANGED, {
        phase: `NIGHT_${step.type}`,
        title: getPhaseTitle(step.type),
        instruction: "Người chơi có chức năng đang cân nhắc hành động...",
        duration: fakeDuration,
        nightNumber: state.nightNumber,
      });

      state.timerId = setTimeout(() => {
        runNightStep(io, roomCode, stepIndex + 1, steps);
      }, fakeDuration * 1000);
      return;
    } else {
      // Nếu phòng Công khai bài khi chết: Bỏ qua bước này ngay lập tức
      return runNightStep(io, roomCode, stepIndex + 1, steps);
    }
  }

  // Vai trò còn sống -> Kích hoạt lượt hành động thật
  state.currentPhase = `NIGHT_${step.type}`;
  state.phaseEndsAt = Date.now() + duration * 1000;

  // Thông báo Phase Changed cho toàn phòng
  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.PHASE_CHANGED, {
    phase: `NIGHT_${step.type}`,
    title: getPhaseTitle(step.type),
    instruction: getPhaseInstruction(step.type),
    duration,
    nightNumber: state.nightNumber,
  });

  // Gửi prompt hành động tới đúng người chơi
  if (step.type === "WOLF") {
    // Bầy Sói: Gửi prompt cho toàn bộ Sói còn sống
    const livingNonWolves = state.alivePlayers.filter((charName) => {
      const r = state.roles[charName];
      return !isRoleWolf(r, state);
    });

    activePlayers.forEach((wolf) => {
      // Nếu Sói nằm trong Lovers, không được vote cắn người yêu của mình
      const forbiddenTargets = [];
      if (Array.isArray(state.lovers) && state.lovers.includes(wolf.characterName)) {
        const partner = state.lovers.find((name) => name !== wolf.characterName);
        if (partner) forbiddenTargets.push(partner);
      }

      const availableTargets = livingNonWolves.filter((t) => !forbiddenTargets.includes(t));
      const isAlpha =
        wolf.role?.name?.toLowerCase().includes("sói đầu đàn") ||
        wolf.role?.name?.toLowerCase().includes("alpha wolf");

      const s = io.sockets.sockets.get(wolf.socketId);
      if (s) {
        s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
          actionType: "WOLF_KILL",
          title: state.activeDoubleKill
            ? "🐺 CƠN CUỒNG NỘ: Bầy Sói hãy chọn 2 con mồi!"
            : "🐺 Bầy Sói hãy chọn con mồi",
          availableTargets,
          currentVotes: state.wolfVotes,
          forbiddenTargets,
          doubleKill: Boolean(state.activeDoubleKill),
          canInfect: isAlpha && !state.alphaWolfInfectUsed,
        });
      }
    });
  } else if (step.type === "WHITE_WOLF") {
    const whiteWolf = activePlayers[0];
    const s = io.sockets.sockets.get(whiteWolf.socketId);
    if (s) {
      // Sói Trắng có thể chọn 1 con sói khác còn sống
      const otherWolves = state.alivePlayers.filter((charName) => {
        const r = state.roles[charName];
        const isW = r?.team === "Sói" || r?.name?.toLowerCase().includes("sói");
        return isW && charName !== whiteWolf.characterName;
      });
      s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
        actionType: "WHITE_WOLF_KILL",
        title: "🐺 Sói Trắng hãy chọn 1 con Sói khác để xé xác",
        availableTargets: otherWolves,
      });
    }
  } else if (step.type === "SERIAL_KILLER") {
    const killer = activePlayers[0];
    const s = io.sockets.sockets.get(killer.socketId);
    if (s) {
      const availableTargets = state.alivePlayers.filter((n) => n !== killer.characterName);
      s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
        actionType: "SERIAL_KILLER_STAB",
        title: "🔪 Sát Thủ hãy chọn 1 mục tiêu để đâm chết đêm nay (xuyên khiên)",
        availableTargets,
      });
    }
  } else if (step.type === "SHADOW_HUNTER") {
    const shadowHunter = activePlayers[0];
    const s = io.sockets.sockets.get(shadowHunter.socketId);
    if (s) {
      const availableTargets = state.alivePlayers.filter((n) => n !== shadowHunter.characterName);
      s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
        actionType: "SHADOW_HUNTER_SHOOT",
        title: "🏹 Thợ Săn Bóng Đêm: Hãy chọn 1 mục tiêu (chỉ tiêu diệt nếu là Phe Thứ 3):",
        availableTargets,
      });
    }
  } else if (step.type === "BEHOLDER") {
    const beholder = activePlayers[0];
    const s = io.sockets.sockets.get(beholder.socketId);
    if (s) {
      const g = roomGameData[roomCode];
      const seerPlayer = g?.players.find((p) => {
        const r = state.roles[p.characterName];
        return (
          (r?.name?.toLowerCase().includes("tiên tri") || r?.name?.toLowerCase().includes("seer")) &&
          !r?.name?.toLowerCase().includes("tập sự") &&
          !r?.name?.toLowerCase().includes("apprentice")
        );
      });
      s.emit(SOCKET_EVENTS.SERVER.BEHOLDER_REVEAL, {
        seerName: seerPlayer ? seerPlayer.characterName : null,
        seerSeat: seerPlayer?.seatNumber !== undefined ? seerPlayer.seatNumber : null,
        found: !!seerPlayer,
        message: seerPlayer
          ? `🌟 Bạn nhìn thấy linh ảnh báo mộng: Người chơi ${seerPlayer.characterName} (Ghế #${seerPlayer.seatNumber !== undefined ? seerPlayer.seatNumber : 1}) chính là Tiên Tri thật sự của ngôi làng!`
          : "🌟 Linh ảnh tối tăm, ngôi làng này không có Tiên Tri thật sự!",
      });
      s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
        actionType: "BEHOLDER_DONE",
        title: "🌟 Người Quan Sát đã nhận diện Tiên Tri thật sự của ngôi làng!",
        availableTargets: [],
      });
    }
  } else if (step.type === "ARSONIST") {
    const arsonist = activePlayers[0];
    const s = io.sockets.sockets.get(arsonist.socketId);
    if (s) {
      const nonDoused = state.alivePlayers.filter(
        (n) => !state.dousedPlayers.includes(n) && n !== arsonist.characterName,
      );
      s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
        actionType: "ARSONIST_ACTION",
        title: "🔥 Kẻ Độc Hành: Hãy chọn tẩm xăng 1-2 người HOẶC bấm Châm Lửa thiêu rụi toàn bộ!",
        availableTargets: nonDoused,
        dousedPlayers: state.dousedPlayers,
        canIgnite: state.dousedPlayers.length > 0,
        maxSelect: 2,
      });
    }
  } else if (step.type === "PRIEST") {
    const priest = activePlayers[0];
    const s = io.sockets.sockets.get(priest.socketId);
    if (s) {
      s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
        actionType: "PRIEST_BLESS",
        title: "✝️ Thầy Tu hãy chọn 1 người để ban phước lành đêm nay (giải trừ dầu xăng & cứu sống vết cắn)",
        availableTargets: state.alivePlayers,
      });
    }
  } else if (step.type === "DOPPELGANGER") {
    const doppel = activePlayers[0];
    const s = io.sockets.sockets.get(doppel.socketId);
    if (s) {
      const availableTargets = state.alivePlayers.filter((n) => n !== doppel.characterName);
      s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
        actionType: "DOPPELGANGER_CHOOSE",
        title: "🎭 Hãy chọn 1 người sống làm hình mẫu thừa kế khi họ qua đời",
        availableTargets,
      });
    }
  } else if (step.type === "THIEF") {
    const thief = activePlayers[0];
    const s = io.sockets.sockets.get(thief.socketId);
    if (s) {
      s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
        actionType: "THIEF_SWAP",
        title: "🎴 Hãy xem 2 lá bài thừa ngoài rìa và chọn đổi thân phận:",
        centerCards: state.centerCards,
      });
    }
  } else if (step.type === "TROUBLEMAKER") {
    const troublemaker = activePlayers[0];
    const s = io.sockets.sockets.get(troublemaker.socketId);
    if (s) {
      const availableTargets = state.alivePlayers.filter((n) => n !== troublemaker.characterName);
      s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
        actionType: "TROUBLEMAKER_SWAP",
        title: "🎭 Hãy chọn 2 người chơi khác để bí mật hoán đổi vai trò",
        availableTargets,
        maxSelect: 2,
      });
    }
  } else if (step.type === "DARK_CUPID") {
    const darkCupid = activePlayers[0];
    const s = io.sockets.sockets.get(darkCupid.socketId);
    if (s) {
      s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
        actionType: "DARK_CUPID_PAIR",
        title: "💘 Cupid Nâng Cao hãy chọn 2 người để kết đôi định mệnh (có thể tự chọn bản thân)",
        availableTargets: state.alivePlayers,
        maxSelect: 2,
      });
    }
  } else if (step.type === "MANIPULATOR_WITCH") {
    const manipulator = activePlayers[0];
    const s = io.sockets.sockets.get(manipulator.socketId);
    if (s) {
      const availableTargets = state.alivePlayers.filter((n) => n !== manipulator.characterName);
      s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
        actionType: "MANIPULATOR_TARGET",
        title: "🕸️ Phù Thủy Thao Túng hãy chọn 1 người để khống chế tâm trí ban ngày",
        availableTargets,
      });
    }
  } else if (step.type === "CUPID") {
    const cupid = activePlayers[0];
    const s = io.sockets.sockets.get(cupid.socketId);
    if (s) {
      s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
        actionType: "CUPID_PAIR",
        title: "💘 Hãy chọn 2 người để ghép đôi yêu nhau",
        availableTargets: state.alivePlayers,
        maxSelect: 2,
      });
    }
  } else if (step.type === "GUARD") {
    const guard = activePlayers[0];
    const s = io.sockets.sockets.get(guard.socketId);
    if (s) {
      // Bảo vệ không được chọn người vừa bảo vệ đêm trước
      const availableTargets = state.alivePlayers.filter(
        (charName) => charName !== state.lastProtected,
      );
      s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
        actionType: "GUARD_PROTECT",
        title: "🛡️ Chọn 1 người để bảo vệ đêm nay",
        availableTargets,
        lastProtected: state.lastProtected,
      });
    }
  } else if (step.type === "SEER") {
    const seer = activePlayers[0];
    const s = io.sockets.sockets.get(seer.socketId);
    if (s) {
      // Tiên Tri chọn 1 người sống khác bản thân
      const availableTargets = state.alivePlayers.filter(
        (charName) => charName !== seer.characterName,
      );
      s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
        actionType: "SEER_INSPECT",
        title: "🔮 Chọn 1 người để soi thân phận",
        availableTargets,
      });
    }
  } else if (step.type === "FORTUNE_TELLER") {
    const teller = activePlayers[0];
    const s = io.sockets.sockets.get(teller.socketId);
    if (s) {
      const availableTargets = state.alivePlayers.filter(
        (charName) => charName !== teller.characterName,
      );
      s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
        actionType: "FORTUNE_TELLER_INSPECT",
        title: "🔮 Thầy Bói hãy chọn 1 người để soi thấu chân tướng vai trò chi tiết",
        availableTargets,
      });
    }
  } else if (step.type === "WITCH") {
    const witch = activePlayers[0];
    const s = io.sockets.sockets.get(witch.socketId);
    if (s) {
      // Phù thủy vẫn thấy nạn nhân bị Sói cắn nếu còn bình cứu
      const victim = !state.witchHealUsed ? state.wolfTarget : null;
      const availableTargets = state.alivePlayers.filter(
        (charName) => charName !== witch.characterName,
      );

      s.emit(SOCKET_EVENTS.SERVER.WITCH_PROMPT, {
        victim,
        canHeal: !state.witchHealUsed && !!victim,
        canPoison: !state.witchPoisonUsed,
        availableTargets,
      });
    }
  }

  // Đặt hẹn giờ kết thúc lượt nếu người chơi không thao tác (hoặc AFK)
  state.timerId = setTimeout(() => {
    onStepTimeout(io, roomCode, stepIndex, steps);
  }, duration * 1000);
}

/**
 * Xử lý khi hết giờ của một bước đêm
 */
function onStepTimeout(io, roomCode, stepIndex, steps) {
  const state = roomOnlineState[roomCode];
  if (!state) return;

  const step = steps[stepIndex];

  // Nếu là bầy Sói và bị hòa phiếu: Xử lý quy tắc Gia Hạn 5s
  if (step.type === "WOLF") {
    const votes = Object.values(state.wolfVotes);
    if (votes.length > 0) {
      const tally = {};
      votes.forEach((target) => {
        tally[target] = (tally[target] || 0) + 1;
      });

      const maxVotes = Math.max(...Object.values(tally));
      const topTargets = Object.keys(tally).filter((k) => tally[k] === maxVotes);

      // Nếu hòa phiếu giữa 2 người trở lên
      if (topTargets.length > 1 && !state.wolfTieExtended) {
        state.wolfTieExtended = true;
        // Báo cho bầy sói gia hạn 5s
        io.to(`room_${roomCode}_wolf`).emit(
          SOCKET_EVENTS.SERVER.WOLF_VOTE_TIE_WARNING,
          "⚠️ Bầy Sói đang bị hòa phiếu! Gia hạn thêm 5 giây để đồng nhất mục tiêu!",
        );

        state.timerId = setTimeout(() => {
          finalizeWolfVotes(state);
          runNightStep(io, roomCode, stepIndex + 1, steps);
        }, 5000);
        return;
      }

      // Đã gia hạn hoặc không hòa: Chốt mục tiêu cắn
      finalizeWolfVotes(state);
    }
  }

  // Chuyển sang bước tiếp theo
  runNightStep(io, roomCode, stepIndex + 1, steps);
}

/**
 * Chốt mục tiêu cắn của Bầy Sói
 */
function finalizeWolfVotes(state) {
  const votes = Object.values(state.wolfVotes);
  if (votes.length === 0) {
    state.wolfTarget = null;
    state.wolfTarget2 = null;
    return;
  }
  const tally = {};
  votes.forEach((target) => {
    tally[target] = (tally[target] || 0) + 1;
  });

  const sortedTargets = Object.keys(tally).sort((a, b) => tally[b] - tally[a]);

  if (state.activeDoubleKill) {
    state.wolfTarget = sortedTargets[0] || null;
    state.wolfTarget2 = sortedTargets[1] || null;
  } else {
    const maxVotes = tally[sortedTargets[0]];
    const topTargets = sortedTargets.filter((k) => tally[k] === maxVotes);
    // Nếu sau gia hạn vẫn hòa phiếu -> Sói mất lượt cắn đêm đó!
    if (topTargets.length > 1) {
      state.wolfTarget = null;
    } else {
      state.wolfTarget = topTargets[0];
    }
    state.wolfTarget2 = null;
  }
}

/**
 * Xử lý khi người chơi submit hành động đêm
 */
function handleNightAction(io, socket, data) {
  const { roomCode, actionType, targetCharacterName, targetPair, witchAction } = data || {};
  const state = roomOnlineState[roomCode];
  const g = roomGameData[roomCode];
  if (!state || !g) return;

  const player = g.players.find((p) => p.socketId === socket.id);
  if (!player) return;

  const charName = player.characterName;
  if (!state.alivePlayers.includes(charName)) return;

  // 0.1. Doppelganger chọn hình mẫu
  if (actionType === "DOPPELGANGER_CHOOSE" && targetCharacterName) {
    state.doppelgangerTarget = targetCharacterName;
    socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
      success: true,
      message: `Bạn đã chọn ${targetCharacterName} làm hình mẫu. Khi người này tử nạn, bạn sẽ kế thừa toàn bộ năng lực!`,
    });
    if (state.timerId) clearTimeout(state.timerId);
    state.timerId = null;
    skipCurrentStep(io, roomCode);
    return;
  }

  // 0.2. Kẻ Trộm đổi bài thừa
  if (actionType === "THIEF_SWAP") {
    const { chosenCardIndex } = data || {};
    if (chosenCardIndex !== undefined && state.centerCards[chosenCardIndex]) {
      const chosen = state.centerCards[chosenCardIndex];
      state.roles[charName] = chosen;
      player.role = chosen;

      if (chosen.team === "Sói" || chosen.name?.toLowerCase().includes("sói")) {
        socket.join(`room_${roomCode}_wolf`);
      }

      socket.emit(SOCKET_EVENTS.SERVER.RECEIVE_ROLE, {
        ...chosen,
        isAlive: true,
      });

      socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
        success: true,
        message: `Bạn đã đổi thân phận thành: ${chosen.name}!`,
      });
    } else {
      socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
        success: true,
        message: "Bạn quyết định giữ nguyên vai trò làm Dân Làng.",
      });
    }

    if (state.timerId) clearTimeout(state.timerId);
    state.timerId = null;
    skipCurrentStep(io, roomCode);
    return;
  }

  // 0.3. Kẻ Đánh Tráo hoán đổi 2 người
  if (actionType === "TROUBLEMAKER_SWAP" && Array.isArray(targetPair) && targetPair.length === 2) {
    const [p1, p2] = targetPair;
    const r1 = state.roles[p1];
    const r2 = state.roles[p2];

    state.roles[p1] = r2;
    state.roles[p2] = r1;

    const player1Rec = g.players.find((p) => p.characterName === p1);
    const player2Rec = g.players.find((p) => p.characterName === p2);
    if (player1Rec) player1Rec.role = r2;
    if (player2Rec) player2Rec.role = r1;

    // Gửi thông báo bí mật cho 2 người (bị giấu role mới chống metagaming)
    if (player1Rec) {
      const s1 = io.sockets.sockets.get(player1Rec.socketId);
      if (s1) s1.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "🎭 Thân phận của bạn đã bị Kẻ Đánh Tráo hoán đổi trong đêm!");
    }
    if (player2Rec) {
      const s2 = io.sockets.sockets.get(player2Rec.socketId);
      if (s2) s2.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "🎭 Thân phận của bạn đã bị Kẻ Đánh Tráo hoán đổi trong đêm!");
    }

    socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
      success: true,
      message: `Đã bí mật hoán đổi vai trò giữa ${p1} và ${p2}!`,
    });

    if (state.timerId) clearTimeout(state.timerId);
    state.timerId = null;
    skipCurrentStep(io, roomCode);
    return;
  }

  // 1. Thần Tình Yêu chọn đôi
  if (actionType === "CUPID_PAIR" && Array.isArray(targetPair) && targetPair.length === 2) {
    state.lovers = [...targetPair];
    if (g) g.lovers = [...targetPair];

    // Gán 2 người vào room lovers
    g.players.forEach((p) => {
      if (state.lovers.includes(p.characterName)) {
        const s = io.sockets.sockets.get(p.socketId);
        if (s) {
          s.join(`room_${roomCode}_lovers`);
          const otherLover = state.lovers.find((name) => name !== p.characterName);
          s.emit(SOCKET_EVENTS.SERVER.RECEIVE_ROLE, {
            ...p.role,
            isAlive: true,
            loverPartner: otherLover,
          });
        }
      }
    });

    socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
      success: true,
      message: `Đã kết nối tình yêu giữa ${targetPair[0]} và ${targetPair[1]}!`,
    });

    // Skip timer, sang bước tiếp theo
    if (state.timerId) clearTimeout(state.timerId);
    state.timerId = null;
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.TIMER_STOPPED);
    // Nhảy tới bước tiếp theo
    skipCurrentStep(io, roomCode);
    return;
  }

  // 1.1. Cupid Nâng Cao (Dark Cupid) chọn cặp đôi định mệnh
  if (actionType === "DARK_CUPID_PAIR" && Array.isArray(targetPair) && targetPair.length === 2) {
    state.darkCupidLovers = [...targetPair];
    state.lovers = [...targetPair];
    if (g) g.lovers = [...targetPair];
    state.darkCupidPlayer = charName;

    // Gán 2 người vào room lovers
    g.players.forEach((p) => {
      if (state.lovers.includes(p.characterName)) {
        const s = io.sockets.sockets.get(p.socketId);
        if (s) {
          s.join(`room_${roomCode}_lovers`);
          const otherLover = state.lovers.find((name) => name !== p.characterName);
          s.emit(SOCKET_EVENTS.SERVER.RECEIVE_ROLE, {
            ...p.role,
            isAlive: true,
            loverPartner: otherLover,
          });
          s.emit(
            SOCKET_EVENTS.SERVER.ERROR_MSG,
            `💘 Bạn đã bị Cupid Bóng Tối trói buộc định mệnh với ${otherLover}! Nếu một người chết, người kia sẽ chết theo!`,
          );
        }
      }
    });

    socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
      success: true,
      message: `Đã kết nối cặp đôi định mệnh giữa ${targetPair[0]} và ${targetPair[1]}! Hãy bảo vệ họ để cùng chiến thắng!`,
    });

    if (state.timerId) clearTimeout(state.timerId);
    state.timerId = null;
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.TIMER_STOPPED);
    skipCurrentStep(io, roomCode);
    return;
  }

  // 1.2. Phù Thủy Thao Túng khống chế tâm trí
  if (actionType === "MANIPULATOR_TARGET" && targetCharacterName) {
    state.manipulatedPlayer = targetCharacterName;
    state.manipulatorPlayer = charName;

    socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
      success: true,
      message: `Bạn đã gieo mầm thao túng tâm trí vào ${targetCharacterName}. Ban ngày lá phiếu của họ sẽ bị bạn cưỡng chế!`,
    });

    const victim = g.players.find((p) => p.characterName === targetCharacterName);
    if (victim) {
      const vs = io.sockets.sockets.get(victim.socketId);
      if (vs) {
        vs.emit(SOCKET_EVENTS.SERVER.MANIPULATED_NOTICE, {
          message: "🕸️ Tâm trí của bạn đã bị Phù Thủy Thao Túng khống chế trong đêm! Ban ngày lá phiếu của bạn sẽ bị thao túng!",
        });
      }
    }

    if (state.timerId) clearTimeout(state.timerId);
    state.timerId = null;
    skipCurrentStep(io, roomCode);
    return;
  }

  // 2. Bảo Vệ chọn bảo vệ
  if (actionType === "GUARD_PROTECT" && targetCharacterName) {
    if (targetCharacterName === state.lastProtected) {
      return socket.emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        "Không được bảo vệ cùng 1 người 2 đêm liên tiếp!",
      );
    }
    state.protectedThisNight = targetCharacterName;

    socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
      success: true,
      message: `Bạn đã giương khiên bảo vệ ${targetCharacterName} đêm nay.`,
    });

    if (state.timerId) clearTimeout(state.timerId);
    state.timerId = null;
    skipCurrentStep(io, roomCode);
    return;
  }

  // 3. Tiên Tri soi bài (Sói Ẩn, Sói Nguyền, Bán Sói & Kẻ Phản Bội)
  if (actionType === "SEER_INSPECT" && targetCharacterName) {
    const targetRole = state.roles[targetCharacterName];
    const isHiddenWolf =
      targetRole?.name?.toLowerCase().includes("sói ẩn") ||
      targetRole?.name?.toLowerCase().includes("hidden wolf");
    const isCursedWolf =
      targetRole?.name?.toLowerCase().includes("sói nguyền") ||
      targetRole?.name?.toLowerCase().includes("cursed wolf");
    const isLycan =
      targetRole?.name?.toLowerCase().includes("bán sói") ||
      targetRole?.name?.toLowerCase().includes("lycan");
    const isTraitor =
      targetRole?.name?.toLowerCase().includes("phản bội") ||
      targetRole?.name?.toLowerCase().includes("traitor");

    // Bán Sói soi ra Sói; Sói Ẩn, Sói Nguyền chưa thức tỉnh, và Kẻ Phản Bội soi ra Dân!
    const isWolf =
      isLycan ||
      (!isHiddenWolf &&
        !isCursedWolf &&
        !isTraitor &&
        (targetRole?.team === "Sói" || targetRole?.name?.toLowerCase().includes("sói")));
    const revealedTeam = isLycan ? "Sói" : isHiddenWolf || isCursedWolf || isTraitor ? "Dân" : targetRole ? targetRole.team : "Dân";
    const revealedRoleName =
      isLycan ? "Ma Sói (Nhiễm Máu)" : isHiddenWolf || isCursedWolf || isTraitor ? "Dân Làng" : targetRole ? targetRole.name : "Dân Làng";

    socket.emit(SOCKET_EVENTS.SERVER.SEER_REVEAL, {
      targetCharacterName,
      isWolf: !!isWolf,
      team: revealedTeam,
      roleName: revealedRoleName,
    });

    socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
      success: true,
      message: `Đã soi thân phận của ${targetCharacterName}.`,
    });

    if (state.timerId) clearTimeout(state.timerId);
    state.timerId = null;
    skipCurrentStep(io, roomCode);
    return;
  }

  // 3.1. Thầy Bói soi thấu chi tiết chân tướng
  if (actionType === "FORTUNE_TELLER_INSPECT" && targetCharacterName) {
    const targetRole = state.roles[targetCharacterName];
    socket.emit(SOCKET_EVENTS.SERVER.FORTUNE_TELLER_REVEAL, {
      targetCharacterName,
      roleId: targetRole?.id || "villager",
      roleName: targetRole?.name || "Dân Làng",
      team: targetRole?.team || "Dân",
      description: targetRole?.description || "Không có mô tả",
    });

    socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
      success: true,
      message: `Đã soi thấu chân tướng của ${targetCharacterName}: ${targetRole?.name || "Dân Làng"} (${targetRole?.team || "Dân"}).`,
    });

    if (state.timerId) clearTimeout(state.timerId);
    state.timerId = null;
    skipCurrentStep(io, roomCode);
    return;
  }

  // 3.5. Sói Trắng xé xác đồng loại
  if (actionType === "WHITE_WOLF_KILL") {
    state.whiteWolfTarget = targetCharacterName || null;
    socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
      success: true,
      message: targetCharacterName
        ? `Bạn đã chọn xé xác ${targetCharacterName} đêm nay.`
        : "Bạn quyết định không tấn công đồng loại đêm nay.",
    });
    if (state.timerId) clearTimeout(state.timerId);
    state.timerId = null;
    skipCurrentStep(io, roomCode);
    return;
  }

  // 3.55. Sát Thủ đâm xuyên khiên
  if (actionType === "SERIAL_KILLER_STAB" && targetCharacterName) {
    state.serialKillerTarget = targetCharacterName;
    socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
      success: true,
      message: `Bạn đã chọn hạ sát ${targetCharacterName} đêm nay (xuyên khiên).`,
    });
    if (state.timerId) clearTimeout(state.timerId);
    state.timerId = null;
    skipCurrentStep(io, roomCode);
    return;
  }

  // 3.6. Sói Đầu Đàn kích hoạt Lây Nhiễm
  if (actionType === "ALPHA_WOLF_INFECT" && !state.alphaWolfInfectUsed && targetCharacterName) {
    state.alphaWolfInfectTarget = targetCharacterName;
    state.alphaWolfInfectUsed = true;
    socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
      success: true,
      message: `Đã kích hoạt Lây Nhiễm lên ${targetCharacterName}! Nạn nhân sẽ biến đổi thành Ma Sói.`,
    });
    io.to(`room_${roomCode}_wolf`).emit(
      SOCKET_EVENTS.SERVER.ERROR_MSG,
      `🐺 Sói Đầu Đàn đã kích hoạt Lây Nhiễm lên ${targetCharacterName}!`
    );
    return;
  }

  // 4. Phù Thủy dùng bình
  if (actionType === "WITCH_ACTION") {
    const isHeal = witchAction === "HEAL" || data?.useHeal === true;
    const poisonTarget = targetCharacterName || data?.poisonTarget;
    const isPoison = witchAction === "POISON" || Boolean(poisonTarget && !isHeal);

    if (isHeal && !state.witchHealUsed && state.wolfTarget) {
      state.witchSaved = true;
      state.witchHealUsed = true;
      socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
        success: true,
        message: `Đã dùng bình Cứu giải cứu ${state.wolfTarget}!`,
      });
    } else if (isPoison && !state.witchPoisonUsed && poisonTarget) {
      state.witchPoisonTarget = poisonTarget;
      state.witchPoisonUsed = true;
      socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
        success: true,
        message: `Đã dùng bình Độc hạ sát ${poisonTarget}!`,
      });
    } else {
      socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
        success: true,
        message: "Bạn quyết định không dùng bình thuốc đêm nay.",
      });
    }

    if (state.timerId) clearTimeout(state.timerId);
    state.timerId = null;
    skipCurrentStep(io, roomCode);
    return;
  }

  // 4.5. Thầy Tu ban phước
  if (actionType === "PRIEST_BLESS" && targetCharacterName) {
    state.priestBlessed = targetCharacterName;
    if (state.dousedPlayers && state.dousedPlayers.includes(targetCharacterName)) {
      state.dousedPlayers = state.dousedPlayers.filter((n) => n !== targetCharacterName);
    }
    socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
      success: true,
      message: `Bạn đã ban phước lành cho ${targetCharacterName}. Vết dầu xăng (nếu có) đã được thanh tẩy và người này sẽ được che chở khỏi nanh vuốt Sói đêm nay!`,
    });

    const victim = g.players.find((p) => p.characterName === targetCharacterName);
    if (victim) {
      const vs = io.sockets.sockets.get(victim.socketId);
      if (vs) {
        vs.emit(
          SOCKET_EVENTS.SERVER.ERROR_MSG,
          "✝️ Bạn cảm nhận được ánh sáng thánh thiện của Thầy Tu đang ban phước lành cho tâm hồn bạn đêm nay!"
        );
      }
    }

    if (state.timerId) clearTimeout(state.timerId);
    state.timerId = null;
    skipCurrentStep(io, roomCode);
    return;
  }

  // 4.6. Kẻ Độc Hành (Arsonist) tẩm xăng hoặc châm lửa
  if (actionType === "ARSONIST_ACTION") {
    const { subAction, targetCharacterNames, ignite } = data || {};
    if (subAction === "IGNITE" || ignite) {
      state.arsonistIgnited = true;
      socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
        success: true,
        message: "🔥 Bạn đã châm mồi lửa! Toàn bộ những ai đã dính xăng sẽ bùng cháy đêm nay!",
      });
    } else {
      const targets = Array.isArray(targetCharacterNames)
        ? targetCharacterNames
        : targetCharacterName
        ? [targetCharacterName]
        : [];

      targets.forEach((t) => {
        if (!state.dousedPlayers.includes(t)) {
          state.dousedPlayers.push(t);
        }
      });

      socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
        success: true,
        message:
          targets.length > 0
            ? `Bạn đã âm thầm tẩm xăng vào: ${targets.join(", ")}.`
            : "Bạn quyết định không tẩm xăng ai đêm nay.",
      });

      targets.forEach((t) => {
        const victim = g.players.find((p) => p.characterName === t);
        if (victim) {
          const vs = io.sockets.sockets.get(victim.socketId);
          if (vs) {
            vs.emit(
              SOCKET_EVENTS.SERVER.ERROR_MSG,
              "🛢️ Bạn ngửi thấy mùi dầu xăng thoang thoảng nồng nặc quanh ngôi nhà của mình trong bóng tối..."
            );
          }
        }
      });
    }

    if (state.timerId) clearTimeout(state.timerId);
    state.timerId = null;
    skipCurrentStep(io, roomCode);
    return;
  }

  // 4.7. Thợ Săn Bóng Đêm (Shadow Hunter) nổ súng săn Phe Thứ 3
  if (actionType === "SHADOW_HUNTER_SHOOT" && targetCharacterName) {
    state.shadowHunterBulletUsed = true;
    const targetRole = state.roles[targetCharacterName];
    const isThirdParty = isThirdPartyRole(targetRole);

    if (isThirdParty) {
      state.shadowHunterTarget = targetCharacterName;
      socket.emit(SOCKET_EVENTS.SERVER.SHADOW_HUNTER_RESULT, {
        success: true,
        isThirdParty: true,
        message: `🎯 Phát đạn xuyên màn đêm trúng đích! ${targetCharacterName} thuộc Phe Thứ 3 và đã bị tiêu diệt!`,
      });
    } else {
      socket.emit(SOCKET_EVENTS.SERVER.SHADOW_HUNTER_RESULT, {
        success: false,
        isThirdParty: false,
        message: `💨 Phát đạn trượt! ${targetCharacterName} không thuộc Phe Thứ 3 nên viên đạn vô hiệu hóa!`,
      });
    }

    socket.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_RESULT, {
      success: true,
      message: "Bạn đã nổ súng xong lượt.",
    });

    if (state.timerId) clearTimeout(state.timerId);
    state.timerId = null;
    skipCurrentStep(io, roomCode);
    return;
  }

  // 4.8. Người Quan Sát (Beholder) xác nhận xong
  if (actionType === "BEHOLDER_DONE") {
    if (state.timerId) clearTimeout(state.timerId);
    state.timerId = null;
    skipCurrentStep(io, roomCode);
    return;
  }
}

/**
 * Xử lý Ma Sói bỏ phiếu cắn
 */
function handleWolfVote(io, socket, data) {
  const { roomCode, targetCharacterName } = data || {};
  const state = roomOnlineState[roomCode];
  const g = roomGameData[roomCode];
  if (!state || !g) return;

  if (state.currentPhase !== "NIGHT_WOLF") return;

  const player = g.players.find((p) => p.socketId === socket.id);
  if (!player || !state.alivePlayers.includes(player.characterName)) return;

  const livingWolves = getAlivePlayersWithRole(state, "sói");
  if (!livingWolves.some((w) => w.characterName === player.characterName)) {
    return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Bạn không thể tham gia bỏ phiếu của bầy Sói!");
  }

  // Kiểm tra nếu người chơi là Lovers và target là người yêu thì cấm!
  if (Array.isArray(state.lovers) && state.lovers.includes(player.characterName)) {
    const partner = state.lovers.find((n) => n !== player.characterName);
    if (partner === targetCharacterName) {
      return socket.emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        "Bạn không thể vote cắn người yêu của mình!",
      );
    }
  }

  state.wolfVotes[player.characterName] = targetCharacterName;

  // Đồng bộ phiếu vote tức thì cho toàn bộ bầy Sói trong Wolf Room
  io.to(`room_${roomCode}_wolf`).emit(SOCKET_EVENTS.SERVER.WOLF_VOTES_UPDATED, {
    votes: state.wolfVotes,
  });

  // Nếu tất cả sói còn sống đều đã vote cho cùng 1 mục tiêu -> Có thể chốt sớm
  const votes = Object.values(state.wolfVotes);
  if (
    livingWolves.length > 0 &&
    votes.length === livingWolves.length &&
    votes.every((v) => v === targetCharacterName)
  ) {
    state.wolfTarget = targetCharacterName;
    if (state.timerId) clearTimeout(state.timerId);
    state.timerId = null;
    skipCurrentStep(io, roomCode);
  }
}

/**
 * Bỏ qua lượt hiện tại sớm (khi người chơi thao tác xong)
 */
function skipCurrentStep(io, roomCode, socketId = null) {
  const state = roomOnlineState[roomCode];
  if (!state) return;

  if (socketId) {
    const g = roomGameData[roomCode];
    const player = g?.players.find((p) => p.socketId === socketId);
    if (!player || !state.alivePlayers.includes(player.characterName)) return;

    // Chỉ người chơi có lượt trong bước này mới có quyền bấm bỏ qua / đi ngủ sớm
    const steps = state.nightSteps || getNightSteps(state);
    let currentIndex =
      typeof state.currentStepIndex === "number" ? state.currentStepIndex : -1;
    if (currentIndex === -1) {
      const currentType = (state.currentPhase || "").replace("NIGHT_", "");
      currentIndex = steps.findIndex((s) => s.type === currentType);
    }

    if (currentIndex !== -1 && steps[currentIndex]) {
      const activePlayers = getAlivePlayersWithRole(state, steps[currentIndex].roleKeyword);
      const isMyTurn = activePlayers.some((p) => p.characterName === player.characterName);
      if (!isMyTurn) return;
    }
  }

  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }

  const steps = state.nightSteps || getNightSteps(state);
  let currentIndex =
    typeof state.currentStepIndex === "number" ? state.currentStepIndex : -1;

  if (currentIndex === -1) {
    const currentType = (state.currentPhase || "").replace("NIGHT_", "");
    currentIndex = steps.findIndex((s) => s.type === currentType);
  }

  if (currentIndex !== -1 && currentIndex < steps.length - 1) {
    runNightStep(io, roomCode, currentIndex + 1, steps);
  } else {
    resolveNightPhase(io, roomCode);
  }
}

/**
 * Tổng hợp kết quả ban đêm và chuẩn bị chuyển sang Bình Minh
 */
function resolveNightPhase(io, roomCode) {
  const state = roomOnlineState[roomCode];
  if (!state) return;

  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }

  state.currentPhase = "NIGHT_END";

  // Tính toán người tử nạn trong đêm
  const nightFatalities = [];

  // 1. Nạn nhân bị Sói cắn (Hỗ trợ 2 mục tiêu nếu Sói Con kích hoạt Cơn Cuồng Nộ)
  const wolfVictims = [state.wolfTarget, state.wolfTarget2].filter(Boolean);

  wolfVictims.forEach((target) => {
    // Được Bảo Vệ che chắn hoặc Phù Thủy cứu?
    const isProtected = state.protectedThisNight === target;
    const isSavedByWitch = state.witchSaved && state.wolfTarget === target;
    const isBlessedByPriest = state.priestBlessed === target;

    // Thầy Tu ban phước cứu sống vết cắn Sói & hóa giải lây nhiễm
    if (isBlessedByPriest) {
      io.to(roomCode).emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        `✝️ Ánh sáng ban phước của Thầy Tu đã bảo vệ ${target} thoát khỏi nanh vuốt tàn bạo của bầy Ma Sói đêm nay!`
      );
      return;
    }

    if (!isProtected && !isSavedByWitch) {
      // 1.1 Kiểm tra Sói Đầu Đàn lây nhiễm
      if (state.alphaWolfInfectTarget === target) {
        state.roles[target] = {
          ...state.roles[target],
          name: "Ma Sói (Bị Lây Nhiễm)",
          team: "Sói",
        };
        const g = roomGameData[roomCode];
        const pRecord = g?.players.find((p) => p.characterName === target);
        if (pRecord) {
          pRecord.role = state.roles[target];
          const s = io.sockets.sockets.get(pRecord.socketId);
          if (s) {
            s.join(`room_${roomCode}_wolf`);
            s.emit(SOCKET_EVENTS.SERVER.RECEIVE_ROLE, {
              ...pRecord.role,
              isAlive: true,
            });
          }
        }
        io.to(`room_${roomCode}_wolf`).emit(
          SOCKET_EVENTS.SERVER.ERROR_MSG,
          `🐺 ${target} đã bị Sói Đầu Đàn lây nhiễm thành công và gia nhập bầy Sói!`
        );
        return;
      }

      // 1.2 Kiểm tra Sói Nguyền (Cursed Wolf) bị cắn
      const targetRole = state.roles[target];
      const isCursed =
        targetRole?.name?.toLowerCase().includes("sói nguyền") ||
        targetRole?.name?.toLowerCase().includes("cursed wolf");

      if (isCursed) {
        state.roles[target] = {
          ...targetRole,
          name: "Ma Sói (Đã Thức Tỉnh)",
          team: "Sói",
        };
        const g = roomGameData[roomCode];
        const pRecord = g?.players.find((p) => p.characterName === target);
        if (pRecord) {
          pRecord.role = state.roles[target];
          const s = io.sockets.sockets.get(pRecord.socketId);
          if (s) {
            s.join(`room_${roomCode}_wolf`);
            s.emit(SOCKET_EVENTS.SERVER.RECEIVE_ROLE, {
              ...pRecord.role,
              isAlive: true,
            });
          }
        }
        io.to(`room_${roomCode}_wolf`).emit(
          SOCKET_EVENTS.SERVER.ERROR_MSG,
          `🐺 Lời nguyền trỗi dậy! ${target} đã thức tỉnh thành Ma Sói!`
        );
        return;
      }

      // 1.25 Kiểm tra Già Làng (Elder) có 2 mạng trước Sói
      if (state.elderLives && state.elderLives[target] === 2) {
        state.elderLives[target] = 1;
        io.to(roomCode).emit(
          SOCKET_EVENTS.SERVER.ERROR_MSG,
          `🛡️ Già Làng ${target} kiên cường chống chọi móng vuốt Sói và đã thoát chết đêm nay! (Còn 1 mạng)`
        );
        return;
      }

      nightFatalities.push({
        characterName: target,
        cause: "Bị Ma Sói cắn",
        role: state.roles[target],
      });
    }
  });

  // 1.5. Phản đòn của Hiệp Sĩ Ánh Sáng (Knight)
  const knightFatality = nightFatalities.find((f) => {
    const r = f.role;
    return (
      r?.code === "KNIGHT" ||
      r?.name?.toLowerCase().includes("hiệp sĩ") ||
      r?.name?.toLowerCase().includes("knight")
    );
  });

  if (knightFatality && knightFatality.cause === "Bị Ma Sói cắn") {
    const g = roomGameData[roomCode];
    const knightPlayer = g?.players.find((p) => p.characterName === knightFatality.characterName);
    const knightSeat =
      knightPlayer?.seatNumber !== undefined ? knightPlayer.seatNumber : g?.players.indexOf(knightPlayer);

    // Tìm các con Sói còn sống (không tính Kẻ Phản Bội chưa thức tỉnh)
    const livingWolves =
      g?.players.filter((p) => {
        if (!state.alivePlayers.includes(p.characterName)) return false;
        const r = state.roles[p.characterName];
        const isUnawakenedTraitor =
          !state.traitorAwakened &&
          (r?.code === "TRAITOR" ||
            r?.name?.toLowerCase().includes("phản bội") ||
            r?.name?.toLowerCase().includes("traitor"));
        return r && !isUnawakenedTraitor && (r.team === "Sói" || r.name?.includes("Sói"));
      }) || [];

    if (livingWolves.length > 0 && knightSeat !== undefined && knightSeat !== -1) {
      const totalPlayers = g.players.length || 1;
      let closestWolf = null;
      let minDistance = 999;

      livingWolves.forEach((w) => {
        const wSeat = w.seatNumber !== undefined ? w.seatNumber : g.players.indexOf(w);
        const rawDist = Math.abs(wSeat - knightSeat);
        const circularDist = Math.min(rawDist, totalPlayers - rawDist);
        if (circularDist < minDistance) {
          minDistance = circularDist;
          closestWolf = w;
        }
      });

      if (closestWolf) {
        const targetWolfName = closestWolf.characterName;
        if (!nightFatalities.some((f) => f.characterName === targetWolfName)) {
          nightFatalities.push({
            characterName: targetWolfName,
            cause: "Bị Hiệp Sĩ Ánh Sáng phản đòn chém chết",
            role: state.roles[targetWolfName],
          });
          io.to(roomCode).emit(
            SOCKET_EVENTS.SERVER.ERROR_MSG,
            `⚔️ Kiếm khí vang dội trong đêm! Hiệp Sĩ ${knightFatality.characterName} trước khi ngã xuống đã chém đứt đầu Ma Sói ${targetWolfName}!`
          );
        }
      }
    }
  }

  // 2. Nạn nhân bị Sói Trắng xé xác (Đêm 2, 4...)
  if (state.whiteWolfTarget && state.alivePlayers.includes(state.whiteWolfTarget)) {
    if (!nightFatalities.some((f) => f.characterName === state.whiteWolfTarget)) {
      nightFatalities.push({
        characterName: state.whiteWolfTarget,
        cause: "Bị Sói Trắng xé xác",
        role: state.roles[state.whiteWolfTarget],
      });
    }
  }

  // 3. Nạn nhân bị Phù Thủy đầu độc (Sói Già kháng độc)
  if (state.witchPoisonTarget) {
    const poisonRole = state.roles[state.witchPoisonTarget];
    const isOldWolf =
      poisonRole?.name?.toLowerCase().includes("sói già") ||
      poisonRole?.name?.toLowerCase().includes("old wolf");

    if (!isOldWolf) {
      if (!nightFatalities.some((f) => f.characterName === state.witchPoisonTarget)) {
        nightFatalities.push({
          characterName: state.witchPoisonTarget,
          cause: "Bị trúng độc Phù Thủy",
          role: poisonRole,
        });
      }
    } else {
      console.log(`🛡️ Sói Già (${state.witchPoisonTarget}) đã kháng lại thuốc độc của Phù Thủy!`);
    }
  }

  // 4. Nạn nhân bị Sát Thủ đâm chết (xuyên khiên Bảo Vệ)
  if (state.serialKillerTarget && state.alivePlayers.includes(state.serialKillerTarget)) {
    const victim = state.serialKillerTarget;
    if (state.elderLives && state.elderLives[victim] === 2) {
      state.elderLives[victim] = 1;
      io.to(roomCode).emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        `🛡️ Già Làng ${victim} đã bị Sát Thủ đâm lén nhưng kiên cường sống sót! (Còn 1 mạng)`
      );
    } else {
      if (!nightFatalities.some((f) => f.characterName === victim)) {
        nightFatalities.push({
          characterName: victim,
          cause: "Bị Sát Thủ đâm chết",
          role: state.roles[victim],
        });
      }
    }
  }

  // 4.5. Nạn nhân bị Kẻ Độc Hành thiêu rụi (xuyên khiên Bảo Vệ)
  if (state.arsonistIgnited && Array.isArray(state.dousedPlayers)) {
    state.dousedPlayers.forEach((victim) => {
      if (state.alivePlayers.includes(victim)) {
        if (!nightFatalities.some((f) => f.characterName === victim)) {
          nightFatalities.push({
            characterName: victim,
            cause: "Bị Kẻ Độc Hành thiêu rụi",
            role: state.roles[victim],
          });
        }
      }
    });
    state.dousedPlayers = [];
    io.to(roomCode).emit(
      SOCKET_EVENTS.SERVER.ERROR_MSG,
      "🔥 Biển lửa đỏ rực bùng lên khắp thôn xóm! Kẻ Độc Hành đã thiêu rụi toàn bộ những ngôi nhà dính xăng!"
    );
  }

  // 4.7. Nạn nhân bị Thợ Săn Bóng Đêm tiêu diệt (chỉ hạ Phe Thứ 3)
  if (state.shadowHunterTarget && state.alivePlayers.includes(state.shadowHunterTarget)) {
    if (!nightFatalities.some((f) => f.characterName === state.shadowHunterTarget)) {
      nightFatalities.push({
        characterName: state.shadowHunterTarget,
        cause: "Bị Thợ Săn Bóng Đêm tiêu diệt",
        role: state.roles[state.shadowHunterTarget],
      });
      io.to(roomCode).emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        `🏹 Phát đạn trừng phạt bóng đêm vang lên! Thợ Săn Bóng Đêm đã bắn hạ kẻ tà đạo ${state.shadowHunterTarget}!`
      );
    }
  }

  // Cập nhật người được bảo vệ đêm qua
  state.lastProtected = state.protectedThisNight;
  state.pendingNightDeaths = nightFatalities;

  // Phát tiếng chuông nhà thờ hoặc âm thanh kết thúc đêm
  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.SOUND_TRIGGERED, "bell");

  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.PHASE_CHANGED, {
    phase: "NIGHT_END",
    title: "✨ Màn Đêm Đang Dần Khép Lại",
    instruction: "Bình minh sắp ló rạng trên đỉnh đồi, cả làng hãy chuẩn bị thức giấc...",
    duration: 3,
    nightNumber: state.nightNumber,
  });

  // Sau 3s, chuyển giao cho Day Engine (Sprint 4)
  state.timerId = setTimeout(() => {
    try {
      const dayEngine = require("./dayEngine");
      if (dayEngine && typeof dayEngine.startDayPhase === "function") {
        dayEngine.startDayPhase(io, roomCode, nightFatalities);
      }
    } catch (err) {
      console.log("DayEngine chưa nạp hoặc đang trong quá trình tích hợp:", err.message);
    }
  }, 3000);
}

// ============ HELPER FUNCTIONS ============

function hasRoleInGame(state, keywords) {
  if (!state || !state.roles) return false;
  return Object.values(state.roles).some((r) => {
    const n = (r?.name || "").toLowerCase();
    return keywords.some((kw) => n.includes(kw.toLowerCase()));
  });
}

function getAlivePlayersWithRole(state, roleKeyword) {
  const g = roomGameData[state.roomCode];
  if (!g) return [];

  return g.players.filter((p) => {
    if (!state.alivePlayers.includes(p.characterName)) return false;
    const r = state.roles[p.characterName] || p.role;
    const kw = roleKeyword.toLowerCase();
    if (kw === "sói") {
      return isRoleWolf(r, state);
    }
    const rName = (r?.name || "").toLowerCase();
    return rName.includes(kw);
  });
}

function getPhaseTitle(type) {
  switch (type) {
    case "DOPPELGANGER":
      return "🎭 Người Hóa Sói Chọn Hình Mẫu";
    case "THIEF":
      return "🎴 Kẻ Trộm Soi Bài Thừa";
    case "TROUBLEMAKER":
      return "🃏 Kẻ Đánh Tráo Hoán Đổi";
    case "CUPID":
      return "💘 Thần Tình Yêu Se Duyên";
    case "DARK_CUPID":
      return "💘 Cupid Bóng Tối Se Duyên Định Mệnh";
    case "MANIPULATOR_WITCH":
      return "🕸️ Phù Thủy Thao Túng Thức Giấc";
    case "GUARD":
      return "🛡️ Bảo Vệ Thức Giấc";
    case "WOLF":
      return "🐺 Bầy Ma Sói Săn Mồi";
    case "WHITE_WOLF":
      return "🐺 Sói Trắng Thức Giấc";
    case "SERIAL_KILLER":
      return "🔪 Sát Thủ Ra Tay";
    case "SEER":
      return "🔮 Tiên Tri Soi Bài";
    case "FORTUNE_TELLER":
      return "🔮 Thầy Bói Soi Chân Tướng";
    case "WITCH":
      return "🧙 Phù Thủy Dùng Thuốc";
    case "PRIEST":
      return "✝️ Thầy Tu Ban Phước";
    case "ARSONIST":
      return "🔥 Kẻ Độc Hành Phóng Hỏa";
    case "BEHOLDER":
      return "👁️ Người Quan Sát Thức Giấc";
    case "SHADOW_HUNTER":
      return "🏹 Thợ Săn Bóng Đêm Xuất Kích";
    default:
      return "🌙 Màn Đêm";
  }
}

function getPhaseInstruction(type) {
  switch (type) {
    case "DOPPELGANGER":
      return "Người Hóa Sói hãy chọn 1 người sống làm hình mẫu để thừa kế...";
    case "THIEF":
      return "Kẻ Trộm hãy xem 2 lá bài rìa thừa và quyết định đổi thân phận...";
    case "TROUBLEMAKER":
      return "Kẻ Đánh Tráo hãy chọn 2 người chơi để bí mật hoán đổi vai trò...";
    case "CUPID":
      return "Thần Tình Yêu hãy chọn 2 người để kết duyên yêu nhau trọn kiếp...";
    case "DARK_CUPID":
      return "Cupid Bóng Tối hãy chọn 2 người để trói buộc số phận (có thể tự chọn bản thân)...";
    case "BEHOLDER":
      return "Người Quan Sát đang nhìn thấu danh tính Tiên Tri thật của ngôi làng...";
    case "MANIPULATOR_WITCH":
      return "Phù Thủy Thao Túng hãy chọn 1 mục tiêu để khống chế tâm trí ban ngày...";
    case "GUARD":
      return "Bảo Vệ hãy chọn 1 người để che chắn khỏi nanh vuốt hiểm nguy...";
    case "WOLF":
      return "Bầy Sói hãy bàn luận trong kênh bí mật và thống nhất con mồi...";
    case "WHITE_WOLF":
      return "Sói Trắng đang âm thầm chọn một con Sói khác trong bầy để tiêu diệt...";
    case "SERIAL_KILLER":
      return "Sát Thủ hãy chọn 1 nạn nhân để đâm chết trong đêm (xuyên khiên)...";
    case "SHADOW_HUNTER":
      return "Thợ Săn Bóng Đêm đang giương cung nhắm vào những kẻ thuộc Phe Thứ 3...";
    case "PRIEST":
      return "Thầy Tu hãy chọn 1 người để ban phước lành (giải trừ dầu xăng & cứu sống khỏi nanh vuốt Sói)...";
    case "ARSONIST":
      return "Kẻ Độc Hành hãy chọn tẩm xăng 1-2 người hoặc châm lửa thiêu rụi toàn bộ nạn nhân dính xăng...";
    case "SEER":
      return "Tiên Tri hãy mở mắt và soi tìm chân tướng của 1 người dân...";
    case "FORTUNE_TELLER":
      return "Thầy Bói hãy soi thấu chân tướng vai trò chi tiết của 1 người dân...";
    case "WITCH":
      return "Phù Thủy hãy cân nhắc xem có cứu người hoặc gieo rắc độc dược...";
    default:
      return "Cả làng đang say ngủ trong đêm tối...";
  }
}

/**
 * Kiểm tra xem một vai trò có thuộc Phe Thứ 3 / Phe Trung Lập hay không
 */
function isThirdPartyRole(role) {
  return isRoleThirdParty(role);
}

function registerNightHandlers(io, socket) {
  socket.on(SOCKET_EVENTS.CLIENT.SUBMIT_NIGHT_ACTION, (data) => {
    handleNightAction(io, socket, data);
  });

  socket.on(SOCKET_EVENTS.CLIENT.VOTE_WOLF_KILL, (data) => {
    handleWolfVote(io, socket, data);
  });

  socket.on(SOCKET_EVENTS.CLIENT.SKIP_NIGHT_TURN, (data) => {
    const { roomCode } = data || {};
    skipCurrentStep(io, roomCode, socket.id);
  });
}

module.exports = {
  initOnlineGame,
  startNightPhase,
  runNightStep,
  getNightSteps,
  handleNightAction,
  handleWolfVote,
  skipCurrentStep,
  registerNightHandlers,
};
