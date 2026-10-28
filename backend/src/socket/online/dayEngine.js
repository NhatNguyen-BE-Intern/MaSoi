const SOCKET_EVENTS = require("../../constants/socketEvents");
const {
  rooms,
  roomMetadata,
  roomGameData,
  roomOnlineState,
} = require("../state");
const { isRoleWolf, isRoleThirdParty, isRoleVillager } = require("../../utils/cardHelper");

/**
 * MODULE ĐIỀU PHỐI MÁY TRẠNG THÁI BAN NGÀY (DAY ENGINE)
 * Tự động hóa toàn bộ: Cáo phó, Bầu Trưởng Làng, Thảo Luận,
 * Biểu Quyết 2 Vòng (Tie-breaker), Bục Biện Hộ Spotlight, Phán Quyết Treo Cổ & Hàng Đợi Tử Nạn FIFO.
 */

/**
 * Bắt đầu pha ban ngày mới
 * @param {Server} io
 * @param {string} roomCode
 * @param {Array} nightFatalities - Danh sách người tử nạn từ Night Engine
 */
function startDayPhase(io, roomCode, nightFatalities = []) {
  const state = roomOnlineState[roomCode];
  const meta = roomMetadata[roomCode];
  if (!state || !meta) return;

  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }

  state.dayNumber += 1;
  state.deathQueue = [...nightFatalities];
  state.currentPhase = "DAY_ANNOUNCE";
  state.accusedPlayer = null;
  state.dayVotes = {};
  state.judgementVotes = {};

  // Phát tiếng chuông bình minh
  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.SOUND_TRIGGERED, "morning");

  // Kiểm tra cài đặt phòng: Công khai hay Giấu bài khi chết
  const isHiddenDeath = meta.settings?.roleRevealOnDeath === "hidden";
  const announcedDeaths = state.deathQueue.map((d) => ({
    characterName: d.characterName,
    cause: d.cause,
    role: isHiddenDeath ? null : d.role,
  }));

  // Gửi thông báo Cáo Phó
  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.DAY_ANNOUNCEMENT, {
    dayNumber: state.dayNumber,
    deaths: announcedDeaths,
    roleReveal: isHiddenDeath ? "hidden" : "open",
    duration: 10,
  });

  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.PHASE_CHANGED, {
    phase: "DAY_ANNOUNCE",
    title: `☀️ Bình Minh Ngày Thứ ${state.dayNumber}`,
    instruction:
      announcedDeaths.length > 0
        ? `Đêm qua đã có ${announcedDeaths.length} người ngã xuống...`
        : "Đêm qua là một đêm bình yên kỳ lạ, không ai tử nạn!",
    duration: 10,
    dayNumber: state.dayNumber,
  });

  // Sau 10s xem Cáo Phó -> Xử lý hàng đợi tử nạn FIFO (Thợ Săn, Cặp Đôi)
  state.timerId = setTimeout(() => {
    resolveDeathQueue(io, roomCode, () => {
      afterMorningResolved(io, roomCode);
    });
  }, 10000);
}

/**
 * Kích hoạt quy trình kế thừa Trưởng Làng khi Trưởng Làng qua đời
 */
function triggerMayorSuccession(io, roomCode, mayorName, onComplete) {
  const state = roomOnlineState[roomCode];
  const g = roomGameData[roomCode];
  if (!state || !g) return;

  if (state.alivePlayers.length === 0) {
    return resolveDeathQueue(io, roomCode, onComplete);
  }

  state.currentPhase = "MAYOR_SUCCESSION";
  state.dyingMayor = mayorName;
  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.PHASE_CHANGED, {
    phase: "MAYOR_SUCCESSION",
    title: "👑 Di Chúc Kế Vị Trưởng Làng",
    instruction: `Trưởng Làng ${mayorName} đang chọn người kế thừa huy hiệu...`,
    duration: 10,
  });

  const mayorPlayer = g.players.find((p) => p.characterName === mayorName);
  if (mayorPlayer) {
    const s = io.sockets.sockets.get(mayorPlayer.socketId);
    if (s) {
      s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
        actionType: "TRANSFER_MAYOR",
        title: "👑 Hãy chỉ định người sống tiếp theo làm Trưởng Làng:",
        availableTargets: state.alivePlayers,
      });
    }
  }

  state.timerId = setTimeout(() => {
    state.dyingMayor = null;
    if (state.mayor === mayorName && state.alivePlayers.length > 0) {
      const rand =
        state.alivePlayers[Math.floor(Math.random() * state.alivePlayers.length)];
      state.mayor = rand;
      io.to(roomCode).emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        `👑 Trưởng Làng quá cố không để lại di chúc. Dân làng đã tôn vinh ${rand} làm Trưởng Làng mới!`,
      );
    }
    resolveDeathQueue(io, roomCode, onComplete);
  }, 10000);
}

/**
 * Giải quyết hàng đợi tử nạn FIFO (deathQueue)
 */
function resolveDeathQueue(io, roomCode, onComplete) {
  const state = roomOnlineState[roomCode];
  const g = roomGameData[roomCode];
  if (!state || !g) return;

  if (typeof onComplete === "function") {
    state.deathQueueCallback = onComplete;
  }

  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }

  // Nếu hàng đợi rỗng -> Kiểm tra Win Condition và tiếp tục
  if (!state.deathQueue || state.deathQueue.length === 0) {
    if (checkOnlineWinCondition(io, roomCode)) return;
    const cb = state.deathQueueCallback || onComplete;
    if (typeof cb === "function") return cb();
    return;
  }

  // Lấy nạn nhân tiếp theo
  const victim = state.deathQueue.shift();

  // Nếu đã bị đánh dấu chết từ trước -> Tiếp tục người sau
  if (!state.alivePlayers.includes(victim.characterName)) {
    return resolveDeathQueue(io, roomCode, onComplete);
  }

  // 1. Cập nhật trạng thái tử nạn
  state.alivePlayers = state.alivePlayers.filter((n) => n !== victim.characterName);
  const pRecord = g.players.find((p) => p.characterName === victim.characterName);
  if (pRecord) pRecord.isAlive = false;

  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.PLAYER_STATUS_CHANGED, {
    characterName: victim.characterName,
    isAlive: false,
  });

  // 2. Cascade Cặp Đôi (Lovers): Nếu 1 người chết, người kia đau đớn tự sát theo
  if (state.lovers && state.lovers.includes(victim.characterName)) {
    const partner = state.lovers.find((n) => n !== victim.characterName);
    if (partner && state.alivePlayers.includes(partner)) {
      state.deathQueue.push({
        characterName: partner,
        cause: "Tự sát vì tình nhân qua đời",
        role: state.roles[partner],
      });
      io.to(roomCode).emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        `💔 ${partner} đau đớn tự sát vì người thương ${victim.characterName} đã ra đi!`,
      );
    }
  }

  // 3. Cascade Thợ Săn (Hunter): Nếu chết (trừ khi chết do độc Phù Thủy), được nổ súng 15s!
  const isHunter =
    victim.role?.name?.toLowerCase().includes("thợ săn") ||
    victim.role?.name?.toLowerCase().includes("hunter");
  const isPoisoned = victim.cause === "Bị trúng độc Phù Thủy";

  if (isHunter && !isPoisoned && state.alivePlayers.length > 0) {
    if (victim.characterName === state.mayor) {
      state.pendingMayorTransferFrom = victim.characterName;
    }

    state.currentPhase = "HUNTER_REVENGE";
    state.hunterShooter = victim.characterName;

    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.PHASE_CHANGED, {
      phase: "HUNTER_REVENGE",
      title: "🎯 Thợ Săn Nổ Súng Kéo Theo",
      instruction: `Thợ Săn ${victim.characterName} trước khi nhắm mắt đang giương súng...`,
      duration: 15,
      shooter: victim.characterName,
    });

    // Gửi prompt riêng cho Thợ Săn
    const hunterPlayer = g.players.find((p) => p.characterName === victim.characterName);
    if (hunterPlayer) {
      const s = io.sockets.sockets.get(hunterPlayer.socketId);
      if (s) {
        s.emit(SOCKET_EVENTS.SERVER.NIGHT_ACTION_PROMPT, {
          actionType: "HUNTER_SHOOT",
          title: "🎯 Bạn có 15s để chọn 1 kẻ cùng ngã xuống!",
          availableTargets: state.alivePlayers,
        });
      }
    }

    state.timerId = setTimeout(() => {
      // Hết giờ mà Thợ Săn AFK không bắn -> Bỏ qua và tiếp tục
      state.hunterShooter = null;
      if (state.pendingMayorTransferFrom) {
        const deadMayor = state.pendingMayorTransferFrom;
        state.pendingMayorTransferFrom = null;
        triggerMayorSuccession(io, roomCode, deadMayor, onComplete);
        return;
      }
      resolveDeathQueue(io, roomCode, onComplete);
    }, 15000);
    return;
  }

  // 4. Cascade Trưởng Làng (Mayor): Khi chết có 10s truyền lại huy hiệu
  if (victim.characterName === state.mayor && state.alivePlayers.length > 0) {
    triggerMayorSuccession(io, roomCode, victim.characterName, onComplete);
    return;
  }

  // 5. Cascade Sói Con (Wolf Cub): Khi chết kích hoạt Cơn Cuồng Nộ cho bầy Sói ở đêm kế tiếp
  const isWolfCub =
    victim.role?.code === "WOLF_CUB" ||
    victim.role?.name?.toLowerCase().includes("sói con") ||
    victim.role?.name?.toLowerCase().includes("wolf cub");
  if (isWolfCub) {
    state.wolfCubExtraKill = true;
    io.to(roomCode).emit(
      SOCKET_EVENTS.SERVER.ERROR_MSG,
      `🐺 Tiếng hú ai oán xé toạc màn đêm! Sói Con ${victim.characterName} đã ngã xuống, bầy Ma Sói sẽ cuồng nộ cắn 2 người vào đêm tiếp theo!`,
    );
  }

  // 6. Cascade Doppelganger (Người Hóa Sói): Thừa kế toàn bộ role khi hình mẫu tử nạn
  if (state.doppelgangerTarget === victim.characterName && !state.doppelgangerInherited) {
    const doppelPlayer = g.players.find((p) => {
      const r = state.roles[p.characterName];
      return (
        r?.name?.toLowerCase().includes("hóa sói") ||
        r?.name?.toLowerCase().includes("doppelganger")
      );
    });

    if (doppelPlayer && state.alivePlayers.includes(doppelPlayer.characterName)) {
      state.doppelgangerInherited = true;
      state.roles[doppelPlayer.characterName] = victim.role;
      doppelPlayer.role = victim.role;

      const s = io.sockets.sockets.get(doppelPlayer.socketId);
      if (s) {
        if (victim.role?.team === "Sói" || victim.role?.name?.toLowerCase().includes("sói")) {
          s.join(`room_${roomCode}_wolf`);
        }
        s.emit(SOCKET_EVENTS.SERVER.RECEIVE_ROLE, {
          ...victim.role,
          isAlive: true,
        });
        s.emit(
          SOCKET_EVENTS.SERVER.ERROR_MSG,
          `🎭 Hình mẫu ${victim.characterName} đã ngã xuống! Bạn đã thừa kế toàn bộ sức mạnh của vai: ${victim.role?.name}!`,
        );
      }
      io.to(roomCode).emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        `🎭 Người Hóa Sói đã chính thức thừa kế linh hồn của người vừa ngã xuống!`,
      );
    }
  }

  // 7. Cascade Già Làng (Elder): Bị Treo Cổ hoặc Độc -> Dân Làng mất sạch chức năng đặc biệt
  const isElder =
    victim.role?.name?.toLowerCase().includes("già làng") ||
    victim.role?.name?.toLowerCase().includes("elder");
  const isLynchedOrPoisoned =
    victim.cause?.includes("treo cổ") || victim.cause?.includes("trúng độc");

  if (isElder && isLynchedOrPoisoned) {
    state.villageStripped = true;
    io.to(roomCode).emit(
      SOCKET_EVENTS.SERVER.ERROR_MSG,
      `⚡ TAI HỌA GIÁNG XUỐNG! Già Làng ${victim.characterName} đã bị xử oan! Toàn bộ phe Dân Làng bị tước đoạt toàn bộ quyền năng đặc biệt trong các đêm tiếp theo!`,
    );
  }

  // 8. Cascade Tiên Tri Tập Sự (Apprentice Seer): Kế thừa quả cầu khi Tiên Tri chính tử nạn
  const isOriginalSeer =
    (victim.role?.name?.toLowerCase().includes("tiên tri") ||
      victim.role?.name?.toLowerCase().includes("seer")) &&
    !victim.role?.name?.toLowerCase().includes("tập sự") &&
    !victim.role?.name?.toLowerCase().includes("apprentice");

  if (isOriginalSeer && !state.apprenticeAwakened) {
    const apprenticePlayer = g.players.find((p) => {
      if (!state.alivePlayers.includes(p.characterName)) return false;
      const r = state.roles[p.characterName];
      return (
        r?.name?.toLowerCase().includes("tập sự") ||
        r?.name?.toLowerCase().includes("apprentice")
      );
    });

    if (apprenticePlayer) {
      state.apprenticeAwakened = true;
      const newRole = {
        _id: "seer_apprentice_awakened",
        name: "Tiên Tri (Tập Sự Thức Tỉnh)",
        team: "Dân",
        description: "Bạn đã kế thừa quả cầu pha lê của Tiên Tri tiền nhiệm! Mỗi đêm bạn được thức dậy soi bài tìm Sói.",
        isSpecial: true,
      };
      state.roles[apprenticePlayer.characterName] = newRole;
      apprenticePlayer.role = newRole;

      const s = io.sockets.sockets.get(apprenticePlayer.socketId);
      if (s) {
        s.emit(SOCKET_EVENTS.SERVER.RECEIVE_ROLE, {
          ...newRole,
          isAlive: true,
        });
        s.emit(SOCKET_EVENTS.SERVER.APPRENTICE_AWAKENED, {
          message: "🔮 Tiên Tri tiền nhiệm đã ngã xuống! Bạn đã kế thừa quả cầu pha lê và chính thức trở thành Tiên Tri mới của ngôi làng!",
        });
      }
      io.to(roomCode).emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        `🔮 Một vầng hào quang ló rạng nơi góc làng! Tiên Tri Tập Sự đã kế thừa quả cầu pha lê của Tiên Tri quá cố!`
      );
    }
  }

  // Đệ quy xử lý nạn nhân tiếp theo
  resolveDeathQueue(io, roomCode, onComplete);
}

/**
 * Sau khi giải quyết xong cáo phó ban sáng
 */
function afterMorningResolved(io, roomCode) {
  const state = roomOnlineState[roomCode];
  if (!state) return;

  if (checkOnlineWinCondition(io, roomCode)) return;

  // Nếu là Ngày 1 (hoặc Ngày 2 mà Ngày 1 hòa phiếu Trưởng Làng) -> Bầu cử Trưởng Làng
  if (!state.mayor && (state.dayNumber === 1 || state.dayNumber === 2)) {
    return startMayorElection(io, roomCode);
  }

  // Các ngày khác -> Vào thẳng Thảo luận
  startDiscussionPhase(io, roomCode);
}

/**
 * Giai đoạn Bầu Cử Trưởng Làng (30s)
 */
function startMayorElection(io, roomCode) {
  const state = roomOnlineState[roomCode];
  if (!state) return;

  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }

  state.currentPhase = "DAY_MAYOR_ELECTION";
  state.mayorVotes = {};

  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.PHASE_CHANGED, {
    phase: "DAY_MAYOR_ELECTION",
    title: "👑 Bầu Cử Trưởng Làng",
    instruction: "Cả làng hãy bỏ phiếu bầu chọn 1 người uy tín giữ chức Trưởng Làng (Phiếu x2)...",
    duration: 30,
    dayNumber: state.dayNumber,
    candidates: state.alivePlayers,
  });

  state.timerId = setTimeout(() => {
    finalizeMayorElection(io, roomCode);
  }, 30000);
}

/**
 * Chốt kết quả Bầu Cử Trưởng Làng
 */
function finalizeMayorElection(io, roomCode) {
  const state = roomOnlineState[roomCode];
  if (!state) return;

  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }

  const votes = Object.values(state.mayorVotes);
  if (votes.length === 0) {
    io.to(roomCode).emit(
      SOCKET_EVENTS.SERVER.ERROR_MSG,
      "⚖️ Không có ai bỏ phiếu bầu Trưởng Làng! Ngày hôm nay không ai giữ chức Trưởng Làng.",
    );
    return startDiscussionPhase(io, roomCode);
  }

  const tally = {};
  votes.forEach((target) => {
    tally[target] = (tally[target] || 0) + 1;
  });

  const maxVotes = Math.max(...Object.values(tally));
  const topCandidates = Object.keys(tally).filter((k) => tally[k] === maxVotes);

  // Hòa phiếu bầu Trưởng Làng -> Ngày 1 không ai giữ chức; Ngày 2 bầu lại
  if (topCandidates.length > 1) {
    state.mayor = null;
    io.to(roomCode).emit(
      SOCKET_EVENTS.SERVER.ERROR_MSG,
      `⚖️ Hòa phiếu bầu Trưởng Làng (${topCandidates.join(", ")} đều đạt ${maxVotes} phiếu)! Tạm thời không có Trưởng Làng.`,
    );
  } else {
    state.mayor = topCandidates[0];
    io.to(roomCode).emit(
      SOCKET_EVENTS.SERVER.ERROR_MSG,
      `👑 ${state.mayor} đã đắc cử Trưởng Làng với ${maxVotes} phiếu biểu quyết!`,
    );
  }

  startDiscussionPhase(io, roomCode);
}

/**
 * Giai đoạn Thảo Luận Tự Do Ban Ngày
 */
function startDiscussionPhase(io, roomCode) {
  const state = roomOnlineState[roomCode];
  const meta = roomMetadata[roomCode];
  if (!state || !meta) return;

  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }

  const duration = (meta.settings && meta.settings.discussionTime) || 60;
  state.currentPhase = "DAY_DISCUSS";

  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.PHASE_CHANGED, {
    phase: "DAY_DISCUSS",
    title: `☀️ Ngày Thứ ${state.dayNumber} - Thảo Luận`,
    instruction: "Cả làng hãy tranh luận, chất vấn và tìm kiếm kẻ khả nghi trong cộng đồng...",
    duration,
    dayNumber: state.dayNumber,
  });

  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.TIMER_STARTED, {
    seconds: duration,
    label: "Thảo luận ban ngày",
  });

  state.timerId = setTimeout(() => {
    startVotingRound1(io, roomCode);
  }, duration * 1000);
}

/**
 * Vòng 1 Biểu Quyết Chỉ Định Nghi Phạm (30s)
 */
function startVotingRound1(io, roomCode) {
  const state = roomOnlineState[roomCode];
  const meta = roomMetadata[roomCode];
  if (!state) return;

  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }

  const duration = (meta && meta.settings && meta.settings.votingTime) || 30;

  state.currentPhase = "DAY_VOTE";
  state.dayVotes = {};

  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.PHASE_CHANGED, {
    phase: "DAY_VOTE",
    title: "🗳️ Bỏ Phiếu Chỉ Định Nghi Phạm (Vòng 1)",
    instruction:
      "Hãy bỏ phiếu chọn người lên bục biện hộ, hoặc bấm Bỏ Phiếu Trắng nếu tin làng vô tội...",
    duration,
    dayNumber: state.dayNumber,
    availableTargets: state.alivePlayers,
    mayor: state.mayor,
  });

  state.timerId = setTimeout(() => {
    finalizeVotingRound1(io, roomCode);
  }, duration * 1000);
}

/**
 * Chốt kết quả Vòng 1
 */
function finalizeVotingRound1(io, roomCode) {
  const state = roomOnlineState[roomCode];
  if (!state) return;

  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }

  // Áp dụng Thao Túng Tâm Trí (Manipulator Witch)
  if (
    state.manipulatedPlayer &&
    state.manipulatorPlayer &&
    state.alivePlayers.includes(state.manipulatedPlayer) &&
    state.alivePlayers.includes(state.manipulatorPlayer)
  ) {
    const forcedTarget = state.dayVotes[state.manipulatorPlayer];
    if (forcedTarget) {
      state.dayVotes[state.manipulatedPlayer] = forcedTarget;
      io.to(roomCode).emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        `🕸️ Tâm trí của ${state.manipulatedPlayer} đã bị Phù Thủy Thao Túng khống chế, lá phiếu bị cưỡng ép theo ý Phù Thủy!`,
      );
    }
  }

  // Tính phiếu (Trưởng Làng x2)
  const tally = {};
  let abstainWeight = 0;

  state.alivePlayers.forEach((charName) => {
    const target = state.dayVotes[charName];
    const weight = charName === state.mayor ? 2 : 1;

    if (!target || target === "ABSTAIN") {
      abstainWeight += weight;
    } else {
      tally[target] = (tally[target] || 0) + weight;
    }
  });

  const targets = Object.keys(tally);
  const maxPlayerVotes = targets.length > 0 ? Math.max(...Object.values(tally)) : 0;

  // 1. Nếu Phiếu Trắng chiếm đa số -> Tha bổng, trời tối ngay!
  if (abstainWeight > maxPlayerVotes || targets.length === 0) {
    io.to(roomCode).emit(
      SOCKET_EVENTS.SERVER.ERROR_MSG,
      `🕊️ Đa số dân làng chọn Bỏ Phiếu Trắng (${abstainWeight} phiếu)! Không ai bị đưa lên bục xét xử hôm nay.`,
    );
    return transitionToNight(io, roomCode);
  }

  const topSuspects = targets.filter((k) => tally[k] === maxPlayerVotes);

  // 2. Nếu hòa phiếu giữa 2 người trở lên -> Kích hoạt Vòng 2 Hiệp Phụ (Tie-breaker 15s)
  if (topSuspects.length > 1) {
    return startVotingTieBreaker(io, roomCode, topSuspects);
  }

  // 3. Có 1 nghi phạm duy nhất -> Lên Bục Biện Hộ Spotlight
  startDefensePhase(io, roomCode, topSuspects[0]);
}

/**
 * Vòng 2 Hiệp Phụ (Tie-Breaker 15s)
 */
function startVotingTieBreaker(io, roomCode, suspects) {
  const state = roomOnlineState[roomCode];
  if (!state) return;

  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }

  state.currentPhase = "DAY_VOTE_TIE_BREAKER";
  state.tieSuspects = suspects;
  state.dayVotes = {};

  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.PHASE_CHANGED, {
    phase: "DAY_VOTE_TIE_BREAKER",
    title: "⚡ Vòng 2 Hiệp Phụ (Tie-Breaker)",
    instruction: `Đang hòa phiếu giữa ${suspects.join(", ")}! Hãy chọn 1 trong số họ hoặc Bỏ Phiếu Trắng...`,
    duration: 15,
    suspects,
    mayor: state.mayor,
  });

  state.timerId = setTimeout(() => {
    finalizeTieBreaker(io, roomCode);
  }, 15000);
}

/**
 * Chốt kết quả Vòng 2 Hiệp Phụ
 */
function finalizeTieBreaker(io, roomCode) {
  const state = roomOnlineState[roomCode];
  if (!state) return;

  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }

  // Áp dụng Thao Túng Tâm Trí (Manipulator Witch)
  if (
    state.manipulatedPlayer &&
    state.manipulatorPlayer &&
    state.alivePlayers.includes(state.manipulatedPlayer) &&
    state.alivePlayers.includes(state.manipulatorPlayer)
  ) {
    const forcedTarget = state.dayVotes[state.manipulatorPlayer];
    if (forcedTarget) {
      state.dayVotes[state.manipulatedPlayer] = forcedTarget;
      io.to(roomCode).emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        `🕸️ Tâm trí của ${state.manipulatedPlayer} đã bị Phù Thủy Thao Túng khống chế trong vòng Hiệp Phụ!`,
      );
    }
  }

  const tally = {};
  let abstainWeight = 0;

  state.alivePlayers.forEach((charName) => {
    const target = state.dayVotes[charName];
    const weight = charName === state.mayor ? 2 : 1;

    if (!target || target === "ABSTAIN" || !state.tieSuspects.includes(target)) {
      abstainWeight += weight;
    } else {
      tally[target] = (tally[target] || 0) + weight;
    }
  });

  const targets = Object.keys(tally);
  const maxPlayerVotes = targets.length > 0 ? Math.max(...Object.values(tally)) : 0;

  // Nếu tiếp tục hòa hoặc Phiếu Trắng đa số -> Tha bổng cả làng!
  const topSuspects = targets.filter((k) => tally[k] === maxPlayerVotes);
  if (abstainWeight > maxPlayerVotes || topSuspects.length !== 1) {
    io.to(roomCode).emit(
      SOCKET_EVENTS.SERVER.ERROR_MSG,
      "⚖️ Sau Vòng Hiệp Phụ kết quả vẫn bất phân thắng bại! Cả làng được tha bổng hôm nay.",
    );
    return transitionToNight(io, roomCode);
  }

  // 1 người duy nhất -> Lên Bục Biện Hộ
  startDefensePhase(io, roomCode, topSuspects[0]);
}

/**
 * Bục Biện Hộ Spotlight (20s) - Chỉ nghi phạm được nói
 */
function startDefensePhase(io, roomCode, suspect) {
  const state = roomOnlineState[roomCode];
  const meta = roomMetadata[roomCode];
  if (!state) return;

  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }

  const duration = (meta && meta.settings && meta.settings.defenseTime) || 20;

  state.currentPhase = "DAY_DEFENSE";
  state.accusedPlayer = suspect;

  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.DEFENSE_SPOTLIGHT, {
    suspect,
    duration,
  });

  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.PHASE_CHANGED, {
    phase: "DAY_DEFENSE",
    title: "🎤 Bục Biện Hộ Spotlight",
    instruction: `Nghi phạm ${suspect} đang phát biểu biện hộ! Toàn bộ dân làng khác bị tạm khóa chat...`,
    duration,
    suspect,
  });

  state.timerId = setTimeout(() => {
    startJudgementPhase(io, roomCode, suspect);
  }, duration * 1000);
}

/**
 * Phán Quyết Treo Cổ (15s): [Có Tội 💀] vs [Vô Tội ✨]
 */
function startJudgementPhase(io, roomCode, suspect) {
  const state = roomOnlineState[roomCode];
  if (!state) return;

  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }

  state.currentPhase = "DAY_JUDGEMENT";
  state.accusedPlayer = suspect;
  state.judgementVotes = {};

  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.PHASE_CHANGED, {
    phase: "DAY_JUDGEMENT",
    title: "⚖️ Phán Quyết Treo Cổ",
    instruction: `Hãy bỏ phiếu phán quyết cho ${suspect}: Có Tội 💀 hay Vô Tội ✨? (Nghi phạm không được vote)`,
    duration: 15,
    suspect,
    mayor: state.mayor,
  });

  state.timerId = setTimeout(() => {
    finalizeJudgement(io, roomCode, suspect);
  }, 15000);
}

/**
 * Chốt kết quả Phán Quyết Treo Cổ
 */
function finalizeJudgement(io, roomCode, suspect) {
  const state = roomOnlineState[roomCode];
  if (!state) return;

  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }

  let guiltyCount = 0;
  let innocentCount = 0;

  state.alivePlayers.forEach((charName) => {
    // Nghi phạm bị KHÓA vote, không được tự biểu quyết cho bản thân
    if (charName === suspect) return;

    const vote = state.judgementVotes[charName];
    const weight = charName === state.mayor ? 2 : 1;

    if (vote === "GUILTY") {
      guiltyCount += weight;
    } else {
      innocentCount += weight;
    }
  });

  const isExecuted = guiltyCount > innocentCount;

  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.JUDGEMENT_RESULT, {
    executed: isExecuted,
    suspect,
    guiltyCount,
    innocentCount,
  });

  if (isExecuted) {
    // Tiếng chuông nhà thờ và thông báo treo cổ
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.SOUND_TRIGGERED, "bell");

    // Kiểm tra Tanner (Kẻ Chán Đời): Nếu bị treo cổ -> Thắng ngay lập tức!
    const role = state.roles[suspect];
    const isTanner =
      role?.name?.toLowerCase().includes("chán đời") ||
      role?.name?.toLowerCase().includes("tanner");

    if (isTanner) {
      state.tannerLynched = suspect;
      checkOnlineWinCondition(io, roomCode);
      return;
    }

    // Đưa vào hàng đợi tử nạn để giải quyết nổ súng và người yêu tự sát
    state.deathQueue = [
      {
        characterName: suspect,
        cause: "Bị dân làng kết án treo cổ",
        role: state.roles[suspect],
      },
    ];

    resolveDeathQueue(io, roomCode, () => {
      transitionToNight(io, roomCode);
    });
  } else {
    io.to(roomCode).emit(
      SOCKET_EVENTS.SERVER.ERROR_MSG,
      `✨ ${suspect} đã được tòa án dân làng tuyên bố Vô Tội (${innocentCount} vs ${guiltyCount})!`,
    );
    transitionToNight(io, roomCode);
  }
}

/**
 * Kết thúc ban ngày và chuyển sang Màn Đêm tiếp theo
 */
function transitionToNight(io, roomCode) {
  const state = roomOnlineState[roomCode];
  if (!state) return;

  if (checkOnlineWinCondition(io, roomCode)) return;

  // Gọi lại Night Engine
  const { startNightPhase } = require("./nightEngine");
  startNightPhase(io, roomCode);
}

/**
 * Kiểm tra điều kiện thắng thua tự động cho chế độ Online
 */
function checkOnlineWinCondition(io, roomCode) {
  const state = roomOnlineState[roomCode];
  const g = roomGameData[roomCode];
  if (!state || !g) return false;

  const alivePlayers = state.alivePlayers;

  // Lập danh sách đầy đủ danh tính của mọi người chơi sau trận đấu
  const allRoles = g.players.map((p) => ({
    characterName: p.characterName,
    seatNumber: p.seatNumber,
    role: p.role,
    isAlive: state.alivePlayers.includes(p.characterName),
  }));

  // 1. Không còn ai sống sót -> Hòa diệt vong
  if (alivePlayers.length === 0) {
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.GAME_OVER, {
      winner: "Hòa",
      title: "💀 Cả Làng Cùng Diệt Vong!",
      message: "Không còn một ai sống sót sau trận quyết chiến! Cả bầy Ma Sói lẫn Dân Làng đều đã tử nạn.",
      allRoles,
    });
    state.currentPhase = "GAME_OVER";
    return true;
  }

  // 2. Kẻ Chán Đời (Tanner) bị treo cổ
  if (state.tannerLynched) {
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.GAME_OVER, {
      winner: "Chán Đời (Tanner)",
      title: "🎭 Kẻ Chán Đời Chiến Thắng Tuyệt Đối!",
      message: `${state.tannerLynched} đã bị dân làng treo cổ đúng như tâm nguyện và giành thắng lợi duy nhất!`,
      allRoles,
    });
    state.currentPhase = "GAME_OVER";
    return true;
  }

  // 3. Cặp Đôi (Lovers) khác phe là 2 người sống sót cuối cùng
  if (alivePlayers.length === 2 && state.lovers && state.lovers.length === 2) {
    const [l1, l2] = state.lovers;
    if (alivePlayers.includes(l1) && alivePlayers.includes(l2)) {
      const r1 = state.roles[l1];
      const r2 = state.roles[l2];
      const isWolf1 = isRoleWolf(r1, state);
      const isWolf2 = isRoleWolf(r2, state);
      if ((isWolf1 && !isWolf2) || (!isWolf1 && isWolf2)) {
        io.to(roomCode).emit(SOCKET_EVENTS.SERVER.GAME_OVER, {
          winner: "Cặp Đôi (Lovers)",
          title: "💘 Cặp Đôi Tình Cảm Chiến Thắng!",
          message: `Tình yêu vượt qua ranh giới giữa ${l1} và ${l2} đã sống sót sau tất cả! Cặp đôi giành chiến thắng vinh quang.`,
          allRoles,
        });
        state.currentPhase = "GAME_OVER";
        return true;
      }
    }
  }

  // 3.1. Cupid Bóng Tối (Dark Cupid) & Cặp Đôi chiến thắng
  if (state.darkCupidLovers && state.darkCupidLovers.length === 2) {
    const [d1, d2] = state.darkCupidLovers;
    const isBothLoversAlive = alivePlayers.includes(d1) && alivePlayers.includes(d2);
    const isDarkCupidAlive = state.darkCupidPlayer && alivePlayers.includes(state.darkCupidPlayer);

    const isSoloCoupleSurvival =
      isBothLoversAlive &&
      (alivePlayers.length === 2 || (alivePlayers.length === 3 && isDarkCupidAlive));

    if (isSoloCoupleSurvival) {
      io.to(roomCode).emit(SOCKET_EVENTS.SERVER.GAME_OVER, {
        winner: "Cupid Bóng Tối & Cặp Đôi",
        title: "💘 Cupid Bóng Tối & Cặp Đôi Thắng Lợi!",
        message: `Tình yêu định mệnh do Cupid Bóng Tối sắp đặt giữa ${d1} và ${d2} đã vượt qua mọi hiểm họa và trở thành những kẻ sống sót cuối cùng!`,
        allRoles,
      });
      state.currentPhase = "GAME_OVER";
      return true;
    }
  }

  // 4. HỒI KẾT TAY ĐÔI 1V1 (1v1 CLIMAX)
  if (alivePlayers.length === 2) {
    const [p1, p2] = alivePlayers;
    const r1 = state.roles[p1];
    const r2 = state.roles[p2];
    const isWolf1 = isRoleWolf(r1, state);
    const isWolf2 = isRoleWolf(r2, state);

    if ((isWolf1 && !isWolf2) || (!isWolf1 && isWolf2)) {
      const wolfName = isWolf1 ? p1 : p2;
      const humanName = isWolf1 ? p2 : p1;
      const humanRole = isWolf1 ? r2 : r1;
      const isHunter = humanRole?.name?.toLowerCase().includes("thợ săn");
      const isSoloKiller =
        humanRole?.code === "SERIAL_KILLER" ||
        humanRole?.name?.toLowerCase().includes("sát thủ") ||
        humanRole?.code === "ARSONIST" ||
        humanRole?.name?.toLowerCase().includes("độc hành");

      if (isHunter || isSoloKiller) {
        // 1 Sói vs 1 Thợ Săn / Sát Thủ / Kẻ Độc Hành: Cả 2 cùng hạ sát nhau -> Hòa diệt vong
        io.to(roomCode).emit(SOCKET_EVENTS.SERVER.GAME_OVER, {
          winner: "Hòa",
          title: "💀 Hòa - Cả Làng Cùng Diệt Vong!",
          message: isHunter
            ? `Trận quyết đấu nghẹt thở giữa Ma Sói (${wolfName}) và Thợ Săn (${humanName})! Thợ Săn trước khi bị cắn đã nổ súng kết liễu Sói, đôi bên cùng tử trận!`
            : `Trận thư hùng nghẹt thở giữa Ma Sói (${wolfName}) và Sát Thủ / Kẻ Độc Hành (${humanName})! Nanh vuốt và vũ khí chí mạng đã khiến cả hai cùng gục ngã trong đêm tối!`,
          allRoles,
        });
        state.currentPhase = "GAME_OVER";
        return true;
      } else {
        // 1 Sói vs 1 Dân thường -> Sói thắng ngay lập tức
        io.to(roomCode).emit(SOCKET_EVENTS.SERVER.GAME_OVER, {
          winner: "Ma Sói",
          title: "🐺 Phe Ma Sói Chiến Thắng!",
          message: `Chỉ còn lại 1 Dân Làng (${humanName}) trước nanh vuốt của Ma Sói (${wolfName})! Ma Sói giành chiến thắng áp đảo.`,
          allRoles,
        });
        state.currentPhase = "GAME_OVER";
        return true;
      }
    }
  }

  const aliveWolves = alivePlayers.filter((name) => {
    return isRoleWolf(state.roles[name], state);
  });

  const aliveWhiteWolves = aliveWolves.filter((name) => {
    const r = state.roles[name];
    return (
      r?.code === "WHITE_WOLF" ||
      r?.name?.toLowerCase().includes("sói trắng") ||
      r?.name?.toLowerCase().includes("white wolf")
    );
  });

  const aliveSolo = alivePlayers.filter((name) => {
    return isRoleThirdParty(state.roles[name]);
  });

  const aliveVillagers = alivePlayers.filter((name) => {
    return isRoleVillager(state.roles[name], state);
  });

  // 5. Sói Trắng là người sống sót duy nhất trên toàn làng -> Thắng Solo!
  if (alivePlayers.length === 1 && aliveWhiteWolves.length === 1) {
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.GAME_OVER, {
      winner: "Sói Trắng",
      title: "🐺 Sói Trắng Độc Tôn Chiến Thắng!",
      message: `${aliveWhiteWolves[0]} (Sói Trắng) là kẻ duy nhất sống sót sau khi thanh trừng cả bầy Sói lẫn toàn bộ dân làng!`,
      allRoles,
    });
    state.currentPhase = "GAME_OVER";
    return true;
  }

  // 5.1 Sát Thủ (Serial Killer) là người sống sót duy nhất -> Thắng Solo!
  const aliveSerialKiller = aliveSolo.filter((name) => {
    const r = state.roles[name];
    return r?.name?.toLowerCase().includes("sát thủ") || r?.code === "SERIAL_KILLER";
  });
  if (alivePlayers.length === 1 && aliveSerialKiller.length === 1) {
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.GAME_OVER, {
      winner: "Sát Thủ (Serial Killer)",
      title: "🔪 Sát Thủ Độc Tôn Chiến Thắng!",
      message: `${aliveSerialKiller[0]} (Sát Thủ) là kẻ duy nhất sống sót sau khi đâm chết toàn bộ dân làng lẫn bầy Ma Sói!`,
      allRoles,
    });
    state.currentPhase = "GAME_OVER";
    return true;
  }

  // 5.2 Kẻ Độc Hành (Arsonist) là người sống sót duy nhất -> Thắng Solo!
  const aliveArsonist = aliveSolo.filter((name) => {
    const r = state.roles[name];
    return (
      r?.name?.toLowerCase().includes("độc hành") ||
      r?.name?.toLowerCase().includes("arsonist") ||
      r?.code === "ARSONIST"
    );
  });
  if (alivePlayers.length === 1 && aliveArsonist.length === 1) {
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.GAME_OVER, {
      winner: "Kẻ Độc Hành (Arsonist)",
      title: "🔥 Kẻ Độc Hành Phóng Hỏa Chiến Thắng!",
      message: `${aliveArsonist[0]} (Kẻ Độc Hành) là kẻ duy nhất sống sót sau khi thiêu rụi toàn bộ ngôi làng!`,
      allRoles,
    });
    state.currentPhase = "GAME_OVER";
    return true;
  }

  // 6. Toàn bộ Sói đã chết (kiểm tra Kẻ Phản Bội thức tỉnh trước)
  if (aliveWolves.length === 0) {
    const traitorPlayer = alivePlayers.find((name) => {
      const r = state.roles[name];
      return (
        r?.code === "TRAITOR" ||
        r?.name?.toLowerCase().includes("phản bội") ||
        r?.name?.toLowerCase().includes("traitor")
      );
    });

    if (traitorPlayer && !state.traitorAwakened) {
      state.traitorAwakened = true;
      const r = state.roles[traitorPlayer];
      if (r) {
        r.team = "Sói";
        r.name = "Ma Sói (Thức Tỉnh)";
      }
      const pRecord = g.players.find((p) => p.characterName === traitorPlayer);
      if (pRecord) {
        pRecord.role = { ...r, team: "Sói", name: "Ma Sói (Thức Tỉnh)" };
        const s = io.sockets.sockets.get(pRecord.socketId);
        if (s) {
          s.join(`room_${roomCode}_wolf`);
          s.emit(SOCKET_EVENTS.SERVER.RECEIVE_ROLE, {
            ...pRecord.role,
            isAlive: true,
          });
          s.emit(
            SOCKET_EVENTS.SERVER.ERROR_MSG,
            "🐺 Bầy Sói đã hy sinh hết! Bản năng Ma Sói trong bạn đã bùng cháy! Bạn đã thức tỉnh thành Ma Sói mới!",
          );
        }
      }
      io.to(roomCode).emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        "⚡ Một tiếng gầm kinh hoàng vang vọng trong đêm tối! Kẻ Phản Bội đã thức tỉnh thành Ma Sói mới!",
      );
      return false;
    }

    // Kiểm tra các vai giết người Phe Thứ 3 (Sát Thủ, Kẻ Độc Hành) còn sống
    const livingHostileSolo = aliveSolo.filter((name) => {
      const r = state.roles[name];
      const n = (r?.name || "").toLowerCase();
      const code = r?.code || "";
      return (
        n.includes("sát thủ") ||
        code === "SERIAL_KILLER" ||
        n.includes("độc hành") ||
        n.includes("arsonist") ||
        code === "ARSONIST"
      );
    });

    // Nếu bầy Sói đã chết nhưng vẫn còn Kẻ Giết Người Phe Thứ 3 và Dân Làng còn sống:
    if (livingHostileSolo.length > 0 && aliveVillagers.length > 0) {
      // Trận đấu tiếp diễn để Dân Làng và Kẻ Giết Người Phe Thứ 3 quyết đấu đến cùng!
      return false;
    }

    if (aliveSolo.length > 0 && aliveVillagers.length === 0) {
      const winnerName =
        livingHostileSolo.length > 0
          ? state.roles[livingHostileSolo[0]]?.name || "Phe Thứ 3"
          : "Phe Thứ 3";
      io.to(roomCode).emit(SOCKET_EVENTS.SERVER.GAME_OVER, {
        winner: winnerName,
        title: `🎭 ${winnerName} Chiến Thắng!`,
        message: "Phe Độc lập / Thứ 3 đã sống sót ngoạn mục sau khi bầy Sói và Dân Làng ngã xuống!",
        allRoles,
      });
    } else {
      io.to(roomCode).emit(SOCKET_EVENTS.SERVER.GAME_OVER, {
        winner: "Dân Làng",
        title: "🎉 Phe Dân Làng Chiến Thắng!",
        message: "Toàn bộ bầy Ma Sói và các hiểm họa bóng đêm đã bị tiêu diệt! Bình yên và ánh sáng đã trở lại với ngôi làng.",
        allRoles,
      });
    }
    state.currentPhase = "GAME_OVER";
    return true;
  }

  // 7. Số Sói >= Số Dân (kèm Solo) -> Sói thắng (hoặc tiếp tục nếu Sói Trắng cần xé xác Sói khác)
  if (aliveWolves.length >= aliveVillagers.length + aliveSolo.length) {
    // Nếu toàn bộ dân làng và phe thứ 3 đã chết, nhưng trong bầy Sói có Sói Trắng và các Sói khác:
    // Game vẫn tiếp tục để Sói Trắng có cơ hội thanh trừng các Sói còn lại và thắng solo
    if (
      aliveVillagers.length === 0 &&
      aliveSolo.length === 0 &&
      aliveWhiteWolves.length > 0 &&
      aliveWolves.length > 1
    ) {
      return false;
    }

    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.GAME_OVER, {
      winner: "Ma Sói",
      title: "🐺 Phe Ma Sói Chiến Thắng!",
      message: "Số lượng Ma Sói đã áp đảo hoàn toàn dân làng còn sống! Ngôi làng chìm trong bóng tối vĩnh hằng.",
      allRoles,
    });
    state.currentPhase = "GAME_OVER";
    return true;
  }

  return false;
}

/**
 * Đăng ký các sự kiện hành động Ban Ngày từ Client
 */
function registerDayHandlers(io, socket) {
  // 1. Bỏ phiếu Ban Ngày (Bầu Trưởng Làng, Bỏ phiếu Vòng 1, Vòng 2)
  socket.on(SOCKET_EVENTS.CLIENT.CAST_DAY_VOTE, (data) => {
    const { roomCode, targetCharacterName } = data || {};
    const state = roomOnlineState[roomCode];
    const g = roomGameData[roomCode];
    if (!state || !g) return;

    const player = g.players.find((p) => p.socketId === socket.id);
    if (!player || !state.alivePlayers.includes(player.characterName)) return;

    if (state.currentPhase === "DAY_MAYOR_ELECTION") {
      state.mayorVotes[player.characterName] = targetCharacterName;
      io.to(roomCode).emit(SOCKET_EVENTS.SERVER.DAY_VOTES_UPDATED, {
        votes: state.mayorVotes,
      });
    } else if (
      state.currentPhase === "DAY_VOTE" ||
      state.currentPhase === "DAY_VOTE_TIE_BREAKER"
    ) {
      state.dayVotes[player.characterName] = targetCharacterName;
      io.to(roomCode).emit(SOCKET_EVENTS.SERVER.DAY_VOTES_UPDATED, {
        votes: state.dayVotes,
      });
    }
  });

  // 2. Biểu Quyết Phán Quyết Treo Cổ (Có Tội / Vô Tội)
  socket.on(SOCKET_EVENTS.CLIENT.CAST_JUDGEMENT_VOTE, (data) => {
    const roomCode = data?.roomCode;
    const vote = data?.vote || data?.verdict;
    const state = roomOnlineState[roomCode];
    const g = roomGameData[roomCode];
    if (!state || !g) return;

    const player = g.players.find((p) => p.socketId === socket.id);
    if (!player || !state.alivePlayers.includes(player.characterName)) return;

    // Nghi phạm bị KHÓA vote
    if (player.characterName === state.accusedPlayer) {
      return socket.emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        "Bạn là nghi phạm trên bục xét xử, không thể tự biểu quyết cho mình!",
      );
    }

    state.judgementVotes[player.characterName] = vote === "GUILTY" ? "GUILTY" : "INNOCENT";
  });

  // 3. Thợ Săn nổ súng
  socket.on(SOCKET_EVENTS.CLIENT.HUNTER_SHOOT, (data) => {
    const { roomCode, targetCharacterName } = data || {};
    const state = roomOnlineState[roomCode];
    const g = roomGameData[roomCode];
    if (!state || !g || state.currentPhase !== "HUNTER_REVENGE") return;

    const player = g.players.find((p) => p.socketId === socket.id);
    if (!player || player.characterName !== state.hunterShooter) return;

    if (targetCharacterName && state.alivePlayers.includes(targetCharacterName)) {
      if (state.timerId) clearTimeout(state.timerId);
      state.timerId = null;

      io.to(roomCode).emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        `💥 Đoành! Thợ Săn ${state.hunterShooter} đã nổ phát súng chí mạng bắn hạ ${targetCharacterName}!`,
      );

      state.hunterShooter = null;
      state.deathQueue.push({
        characterName: targetCharacterName,
        cause: "Bị Thợ Săn bắn hạ",
        role: state.roles[targetCharacterName],
      });

      if (state.pendingMayorTransferFrom) {
        const deadMayor = state.pendingMayorTransferFrom;
        state.pendingMayorTransferFrom = null;
        triggerMayorSuccession(io, roomCode, deadMayor, state.deathQueueCallback);
        return;
      }

      resolveDeathQueue(io, roomCode);
    }
  });

  // 4. Trưởng Làng truyền huy hiệu
  socket.on(SOCKET_EVENTS.CLIENT.TRANSFER_MAYOR, (data) => {
    const { roomCode, targetCharacterName } = data || {};
    const state = roomOnlineState[roomCode];
    const g = roomGameData[roomCode];
    if (!state || !g || state.currentPhase !== "MAYOR_SUCCESSION") return;

    const player = g.players.find((p) => p.socketId === socket.id);
    if (!player || player.characterName !== state.dyingMayor) return;

    if (targetCharacterName && state.alivePlayers.includes(targetCharacterName)) {
      if (state.timerId) clearTimeout(state.timerId);
      state.timerId = null;

      state.dyingMayor = null;
      state.mayor = targetCharacterName;
      io.to(roomCode).emit(
        SOCKET_EVENTS.SERVER.ERROR_MSG,
        `👑 Trưởng Làng đã trao lại huy hiệu lãnh đạo cho ${targetCharacterName}!`,
      );

      resolveDeathQueue(io, roomCode);
    }
  });

  // 5. Thẩm Phán gõ búa Phủ Quyết tha bổng nghi phạm
  socket.on(SOCKET_EVENTS.CLIENT.JUDGE_PARDON, (data) => {
    const { roomCode } = data || {};
    const state = roomOnlineState[roomCode];
    const g = roomGameData[roomCode];
    if (!state || !g) return;

    const player = g.players.find((p) => p.socketId === socket.id);
    if (!player || !state.alivePlayers.includes(player.characterName)) return;

    const role = state.roles[player.characterName];
    const isJudge =
      role?.code === "JUDGE" ||
      role?.name?.toLowerCase().includes("thẩm phán") ||
      role?.name?.toLowerCase().includes("judge");

    if (!isJudge) {
      return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Chỉ Thẩm Phán mới có quyền gõ búa phủ quyết!");
    }

    if (state.judgePardonUsed) {
      return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Bạn đã sử dụng quyền phủ quyết trong ván đấu này rồi!");
    }

    const validPhases = ["DAY_DEFENSE", "DAY_JUDGEMENT"];
    const hasAccused = Boolean(state.accusedPlayer);

    if (!validPhases.includes(state.currentPhase) || !hasAccused) {
      return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Chỉ có thể phủ quyết trong quá trình xét xử nghi phạm!");
    }

    state.judgePardonUsed = true;
    const pardoned = state.accusedPlayer;

    if (state.timerId) {
      clearTimeout(state.timerId);
      state.timerId = null;
    }

    // Xóa án nghi phạm khỏi hàng đợi tử nạn nếu có
    state.deathQueue = (state.deathQueue || []).filter((d) => d.characterName !== pardoned);
    state.accusedPlayer = null;

    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.SOUND_TRIGGERED, "bell");
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.JUDGE_PARDON_ANNOUNCE, {
      judge: player.characterName,
      pardonedPlayer: pardoned,
      message: `⚖️ THẨM PHÁN ${player.characterName} ĐÃ GÕ BÚA PHỦ QUYẾT! Nghi phạm ${pardoned} được tha bổng ngay trước giá treo cổ!`,
    });

    io.to(roomCode).emit(
      SOCKET_EVENTS.SERVER.ERROR_MSG,
      `⚖️ THẨM PHÁN ${player.characterName} ĐÃ GÕ BÚA PHỦ QUYẾT! Nghi phạm ${pardoned} được tha bổng ngay trước giá treo cổ!`
    );

    // Chuyển sang đêm tiếp theo sau 3s
    setTimeout(() => {
      transitionToNight(io, roomCode);
    }, 3000);
  });
}

module.exports = {
  startDayPhase,
  registerDayHandlers,
  finalizeVotingRound1,
  finalizeTieBreaker,
  checkOnlineWinCondition,
  resolveDeathQueue,
};
