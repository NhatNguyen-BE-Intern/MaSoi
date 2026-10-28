/**
 * KỊCH BẢN GIẢ LẬP VÁN ĐẤU ONLINE TỰ ĐỘNG (E2E SIMULATION SCRIPT)
 * Mô phỏng 6 Bot kết nối Socket.IO tới Backend localhost:5000:
 * - Bot 1: Host (Chủ phòng)
 * - Bot 2 - Bot 6: Người chơi
 * Tự động Ready -> Start Game -> Nhận vai trò -> Đi qua các phase Đêm/Ngày -> Phán Quyết -> Kết thúc ván.
 */

const { io } = require('../frontend/node_modules/socket.io-client');

const SERVER_URL = 'http://localhost:5000';
const RUN_ID = Math.floor(100 + Math.random() * 900);

const BOT_NAMES = [
  `Host_${RUN_ID}`,
  `ThợSăn_${RUN_ID}`,
  `TiênTri_${RUN_ID}`,
  `BảoVệ_${RUN_ID}`,
  `PhùThủy_${RUN_ID}`,
  `SóiĐầuĐàn_${RUN_ID}`
];

console.log('🎮 ========================================================');
console.log(`🐺 KHỞI ĐỘNG KỊCH BẢN GIẢ LẬP VÁN ĐẤU ONLINE (RUN ID: #${RUN_ID})`);
console.log('🎮 ========================================================\n');

let targetRoomCode = null;
const bots = [];
let gameStarted = false;

function createBot(name, isHost = false) {
  const socket = io(SERVER_URL, {
    transports: ['websocket'],
    reconnection: false
  });

  const botData = {
    name,
    isHost,
    socket,
    role: null,
    isAlive: true,
    seatNumber: null
  };

  socket.on('connect', () => {
    console.log(`🔌 [${name}] đã kết nối thành công tới Server (Socket ID: ${socket.id})`);
    if (isHost) {
      // Host tạo phòng Online
      socket.emit('create_online_room', {
        user: { characterName: name },
        roomName: `Phòng Giả Lập #${RUN_ID}`,
        isPublic: true
      });
    } else {
      // Member vào phòng
      if (targetRoomCode) {
        socket.emit('join_room', {
          roomCode: targetRoomCode,
          user: { characterName: name }
        });
      }
    }
  });

  // Khi phòng được tạo (server emit roomCode string)
  socket.on('room_created', (code) => {
    targetRoomCode = typeof code === 'object' ? code.roomCode : code;
    console.log(`\n🏠 [PHÒNG TẠO THÀNH CÔNG] Mã phòng: #${targetRoomCode} | Host: ${name}`);
    console.log(`👉 Bắt đầu đưa các thành viên khác vào phòng...\n`);

    // Kết nối các bot thành viên còn lại
    for (let i = 1; i < BOT_NAMES.length; i++) {
      setTimeout(() => {
        bots.push(createBot(BOT_NAMES[i], false));
      }, i * 200);
    }
  });

  let hasToggledReady = false;

  // Khi danh sách người chơi cập nhật
  socket.on('update_players', (data) => {
    const players = data?.players || (Array.isArray(data) ? data : []);
    
    // Chỉ Host in log danh sách phòng để không bị spam log
    if (isHost) {
      console.log(`👥 [SẢNH #${targetRoomCode}] Có ${players.length}/${BOT_NAMES.length} người: ${players.map(p => `#${p.seatNumber || '?'}${p.characterName}${p.isReady ? ' [Ready]' : ''}`).join(', ')}`);
    }

    const me = players.find(p => p.characterName === name);
    if (me) {
      botData.seatNumber = me.seatNumber;
      // Tự động bật Ready 1 lần duy nhất cho thành viên
      if (!isHost && !hasToggledReady && !me.isReady) {
        hasToggledReady = true;
        socket.emit('toggle_ready', targetRoomCode);
      }
    }

    // Nếu là Host và đủ 6 người và 100% đã Ready -> Bắt đầu ván
    const allReady = players.length === BOT_NAMES.length && players.every(p => p.isReady);
    if (isHost && allReady && !gameStarted) {
      gameStarted = true;
      console.log(`\n✨ [TẤT CẢ BOT ĐÃ SẴN SÀNG] Host ${name} chuẩn bị Bắt Đầu Trận Đấu...\n`);
      setTimeout(() => {
        socket.emit('start_game', { roomCode: targetRoomCode });
      }, 800);
    }
  });

  // Khi ván đấu bắt đầu
  socket.on('game_started', () => {
    if (isHost) {
      console.log(`🚀 [GAME STARTED] Ván đấu tại phòng #${targetRoomCode} chính thức BẮT ĐẦU!`);
    }
  });

  // Nhận vai trò bí mật
  socket.on('receive_role', (role) => {
    botData.role = role;
    console.log(`🃏 [THẺ BÀI BÍ MẬT] #${botData.seatNumber || '?'} ${name}: ${role.name} (Phe: ${role.team})`);
  });

  // Cáo phó ban sáng từ Server
  socket.on('day_announcement', (data) => {
    const deaths = data?.deaths || [];
    if (isHost) {
      if (deaths.length === 0) {
        console.log(`🕊️ [CÁO PHÓ BÌNH MINH NGÀY ${data.dayNumber}] Đêm qua thật thanh bình! Không ai ngã xuống.`);
      } else {
        console.log(`🩸 [CÁO PHÓ BÌNH MINH NGÀY ${data.dayNumber}] Có ${deaths.length} người tử nạn:`);
        deaths.forEach(d => {
          console.log(`   - 💀 ${d.characterName} (${d.cause}) [Vai trò: ${d.role?.name || 'Ẩn'}]`);
        });
      }
    }
    deaths.forEach(d => {
      const deadBot = bots.find(b => b.name === d.characterName);
      if (deadBot) deadBot.isAlive = false;
    });
  });

  // Kết quả Phán Quyết Treo Cổ
  socket.on('judgement_result', (res) => {
    if (res.executed) {
      if (isHost) console.log(`⚰️ [KẾT ÁN TREO CỔ] ${res.suspect} đã bị treo cổ với ${res.guiltyCount} phiếu Có Tội!`);
      const executedBot = bots.find(b => b.name === res.suspect);
      if (executedBot) executedBot.isAlive = false;
    } else {
      if (isHost) console.log(`✨ [THA BỔNG] ${res.suspect} đã được tuyên bố Vô Tội!`);
    }
  });

  // Thay đổi Phase (Màn đêm / Bình minh / Ban ngày)
  socket.on('phase_changed', (phaseData) => {
    const { phase, title, duration, dayNumber, nightNumber, suspects, suspect, availableTargets } = phaseData || {};
    if (isHost) {
      console.log(`\n⏳ >>> CHUYỂN PHA: [${phase}] - "${title}" (${duration || 0}s) <<<`);
    }

    if (phase === 'DAY_MAYOR_ELECTION') {
      // Bầu cử Trưởng Làng
      setTimeout(() => {
        if (botData.isAlive) {
          const alive = bots.filter(b => b.isAlive).map(b => b.name);
          const pick = alive[0]; // Tập trung bầu cho người đầu tiên để không bị hòa phiếu
          console.log(`👑 [BẦU TRƯỞNG LÀNG] ${name} bỏ phiếu cho: [${pick}]`);
          socket.emit('cast_day_vote', {
            roomCode: targetRoomCode,
            targetCharacterName: pick
          });
        }
      }, 1000);
    } else if (phase === 'DAY_DISCUSS') {
      // Chat tự do ban ngày
      setTimeout(() => {
        if (botData.isAlive) {
          const sampleMsgs = [
            'Đêm qua tôi nghe tiếng sói hú rất gần!',
            'Tôi là Dân Làng lương thiện, hãy tin tôi!',
            'Hãy cùng nhau truy tìm kẻ thủ ác!'
          ];
          const msg = sampleMsgs[Math.floor(Math.random() * sampleMsgs.length)];
          socket.emit('send_chat_message', {
            roomCode: targetRoomCode,
            channel: 'town',
            message: msg
          });
        }
      }, Math.random() * 2000 + 400);
    } else if (phase === 'DAY_VOTE' || phase === 'DAY_VOTE_TIE_BREAKER') {
      // Bỏ phiếu chỉ định nghi phạm lên bục biện hộ
      setTimeout(() => {
        if (botData.isAlive) {
          const pool = suspects || (availableTargets ? availableTargets.filter(t => t !== name) : bots.filter(b => b.isAlive && b.name !== name).map(b => b.name));
          // Chọn mục tiêu đầu tiên trong danh sách người sống
          const target = pool.length > 0 ? pool[0] : 'ABSTAIN';
          
          console.log(`🗳️ [BỎ PHIẾU CHỈ ĐỊNH] ${name} biểu quyết đưa lên bục: [${target}]`);
          socket.emit('cast_day_vote', {
            roomCode: targetRoomCode,
            targetCharacterName: target
          });
        }
      }, 1200);
    } else if (phase === 'DAY_DEFENSE') {
      if (name === suspect) {
        console.log(`🎤 [BỤC BIỆN HỘ] Nghi phạm ${name} phát biểu: "Tôi hoàn toàn vô tội, xin làng hãy tha cho tôi!"`);
      }
    } else if (phase === 'DAY_JUDGEMENT') {
      // Phán quyết Treo Cổ Có Tội (GUILTY)
      setTimeout(() => {
        if (botData.isAlive && name !== suspect) {
          console.log(`⚖️ [PHÁN QUYẾT TREO CỔ] ${name} bỏ phiếu: [GUILTY - CÓ TỘI] cho ${suspect}`);
          socket.emit('cast_judgement_vote', {
            roomCode: targetRoomCode,
            vote: 'GUILTY',
            verdict: 'GUILTY'
          });
        }
      }, 800);
    }
  });

  // Cập nhật trạng thái sống/chết
  socket.on('player_status_changed', (status) => {
    const bot = bots.find(b => b.name === status.characterName);
    if (bot) bot.isAlive = status.isAlive;
    if (isHost) {
      console.log(`📢 [TRẠNG THÁI] ${status.characterName}: ${status.isAlive ? '💚 Còn sống' : '💀 Đã tử nạn'}`);
    }
  });

  // Prompt hành động đêm (Sói, Tiên Tri, Bảo Vệ, Sát Thủ, Trưởng Làng,...)
  socket.on('night_action_prompt', (prompt) => {
    const { actionType, title, availableTargets } = prompt;
    console.log(`🌙 [HÀNH ĐỘNG ĐÊM] ${name} nhận prompt: "${title}" (${actionType})`);

    setTimeout(() => {
      // Xử lý di chúc kế thừa Trưởng Làng (kể cả khi đã chết)
      if (actionType === 'TRANSFER_MAYOR') {
        if (availableTargets && availableTargets.length > 0) {
          const successor = availableTargets[0];
          console.log(`👑 [DI CHÚC KẾ VỊ] ${name} chỉ định Trưởng Làng mới: [${successor}]`);
          socket.emit('transfer_mayor', {
            roomCode: targetRoomCode,
            targetCharacterName: successor
          });
        }
        return;
      }

      if (!botData.isAlive) return;

      if (actionType === 'WOLF_KILL') {
        if (availableTargets && availableTargets.length > 0) {
          const target = availableTargets[0];
          console.log(`🐺 [BẦY SÓI VOTE] ${name} chọn cắn: ${target}`);
          socket.emit('vote_wolf_kill', {
            roomCode: targetRoomCode,
            targetCharacterName: target
          });
        }
      } else if (actionType === 'GUARD_PROTECT') {
        if (availableTargets && availableTargets.length > 0) {
          const target = availableTargets.find(t => t !== name) || availableTargets[0];
          console.log(`🛡️ [BẢO VỆ] ${name} giương khiên che chở cho: ${target}`);
          socket.emit('submit_night_action', {
            roomCode: targetRoomCode,
            actionType: 'GUARD_PROTECT',
            targetCharacterName: target
          });
        }
      } else if (actionType === 'SEER_INSPECT') {
        if (availableTargets && availableTargets.length > 0) {
          const target = availableTargets.find(t => t !== name) || availableTargets[0];
          console.log(`🔮 [TIÊN TRI SOI] ${name} chọn soi thân phận của: ${target}`);
          socket.emit('submit_night_action', {
            roomCode: targetRoomCode,
            actionType: 'SEER_INSPECT',
            targetCharacterName: target
          });
        }
      } else if (actionType === 'SERIAL_KILLER_STAB') {
        if (availableTargets && availableTargets.length > 0) {
          const target = availableTargets[availableTargets.length - 1];
          console.log(`🔪 [SÁT THỦ ĐÂM] ${name} chọn hạ sát: ${target}`);
          socket.emit('submit_night_action', {
            roomCode: targetRoomCode,
            actionType: 'SERIAL_KILLER_STAB',
            targetCharacterName: target
          });
        }
      } else if (actionType === 'WHITE_WOLF_KILL') {
        if (availableTargets && availableTargets.length > 0) {
          const target = availableTargets[0];
          console.log(`🐺 [SÓI TRẮNG] ${name} chọn xé xác đồng loại: ${target}`);
          socket.emit('submit_night_action', {
            roomCode: targetRoomCode,
            actionType: 'WHITE_WOLF_KILL',
            targetCharacterName: target
          });
        }
      } else if (actionType === 'THIEF_SWAP') {
        console.log(`🎴 [KẺ TRỘM] ${name} tráo bài thừa ngoài bàn...`);
        socket.emit('submit_night_action', {
          roomCode: targetRoomCode,
          actionType: 'THIEF_SWAP',
          chosenCardIndex: 0
        });
      } else if (actionType === 'DOPPELGANGER_CHOOSE') {
        if (availableTargets && availableTargets.length > 0) {
          const target = availableTargets[0];
          console.log(`🎭 [DOPPELGANGER] ${name} chọn hình mẫu: ${target}`);
          socket.emit('submit_night_action', {
            roomCode: targetRoomCode,
            actionType: 'DOPPELGANGER_CHOOSE',
            targetCharacterName: target
          });
        }
      }
    }, 1000);
  });

  // Prompt Phù Thủy
  socket.on('witch_prompt', (witchData) => {
    console.log(`🧙 [PHÙ THỦY] ${name} thức giấc! Nạn nhân bị cắn: ${witchData.victim || 'Không có'}`);
    setTimeout(() => {
      if (!botData.isAlive) return;
      if (witchData.victim && witchData.canHeal) {
        console.log(`🧪 [PHÙ THỦY] ${name} dùng BÌNH CỨU giải cứu ${witchData.victim}!`);
        socket.emit('submit_night_action', {
          roomCode: targetRoomCode,
          actionType: 'WITCH_ACTION',
          witchAction: 'HEAL'
        });
      } else {
        console.log(`💤 [PHÙ THỦY] ${name} bỏ qua đêm nay.`);
        socket.emit('submit_night_action', {
          roomCode: targetRoomCode,
          actionType: 'WITCH_ACTION',
          witchAction: 'SKIP'
        });
      }
    }, 1000);
  });

  // Tiên tri soi ra kết quả
  socket.on('seer_reveal', (res) => {
    console.log(`🔮 [KẾT QUẢ SOI] Tiên Tri phát hiện: ${res.targetCharacterName} thuộc ${res.team === 'Sói' ? '🐺 PHE MA SÓI' : '🕊️ PHE DÂN LÀNG'} (${res.roleName})!`);
  });

  // Kết thúc ván đấu
  socket.on('game_over', (overData) => {
    if (!isHost) return;
    console.log('\n🏆 ========================================================');
    console.log(`🎉 [KẾT THÚC VÁN ĐẤU] ${overData.title}`);
    console.log(`🏆 PHE CHIẾN THẮNG: [${overData.winner}]`);
    console.log(`📜 Thông điệp: ${overData.message}`);
    console.log('--------------------------------------------------------');
    console.log('📋 THÂN PHẬN TOÀN BỘ NGƯỜI CHƠI:');
    (overData.allRoles || []).forEach(r => {
      console.log(`   - ${r.isAlive ? '💚 Sống' : '💀 Chết'} | ${r.characterName}: ${r.role?.name || 'Ẩn'} (Phe: ${r.role?.team || '?'})`);
    });
    console.log('========================================================\n');
    console.log('🎉🎉🎉 KIỂM THỬ E2E SIMULATION HOÀN TOÀN THÀNH CÔNG RỰC RỠ 100%! 🎉🎉🎉\n');

    // Đóng tất cả kết nối socket sau 2s
    setTimeout(() => {
      bots.forEach(b => b.socket.disconnect());
      process.exit(0);
    }, 2000);
  });

  return botData;
}

// Bắt đầu với Bot Host đầu tiên
bots.push(createBot(BOT_NAMES[0], true));

// Timeout tối đa 7.5 phút để hoàn tất trọn vẹn ván đấu đến Game Over
setTimeout(() => {
  console.log('\n⏱️ Hết thời gian chờ tối đa (7.5 phút). Đóng kết nối simulation.');
  bots.forEach(b => b.socket.disconnect());
  process.exit(0);
}, 450000);
