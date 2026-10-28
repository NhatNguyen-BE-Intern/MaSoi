const {
  rooms,
  roomMetadata,
  roomGameData,
  roomOnlineState,
  disconnectGraceTimers,
  roomEmptyCleanupTimers,
  roomChatHistory,
  DEFAULT_ONLINE_SETTINGS,
  assignLowestSeatNumber,
  getPublicRooms,
  clearPlayerGraceTimer,
  clearRoomEmptyTimer,
  deleteRoom,
} = require("../state");
const { sanitizeCard } = require("../../utils/cardHelper");
const SOCKET_EVENTS = require("../../constants/socketEvents");

/**
 * Đăng ký các sự kiện quản lý Phòng Chờ & Kết Nối (Lobby & Lifecycle)
 * @param {Server} io
 * @param {Socket} socket
 */
function registerRoomHandlers(io, socket) {
  // Hàm phụ trợ: Rời khỏi tất cả các phòng khác trước khi tạo hoặc vào phòng mới
  function leaveAllOtherRooms(targetRoomCode, userToken, characterName) {
    for (const rCode in rooms) {
      if (rCode !== targetRoomCode) {
        const pIdx = rooms[rCode].findIndex(
          (p) =>
            p.socketId === socket.id ||
            (characterName && p.characterName?.toLowerCase() === characterName.trim().toLowerCase()) ||
            (userToken && p.token === userToken),
        );
        if (pIdx !== -1) {
          const removed = rooms[rCode].splice(pIdx, 1)[0];
          clearPlayerGraceTimer(rCode, removed.characterName);
          socket.leave(rCode);
          socket.leave(`room_${rCode}_town`);
          socket.leave(`room_${rCode}_wolf`);
          socket.leave(`room_${rCode}_lovers`);

          // Cập nhật game đang chạy nếu có
          const ag = roomGameData[rCode];
          if (ag) {
            if (ag.moderator && ag.moderator.characterName?.toLowerCase() === removed.characterName?.toLowerCase()) {
              io.to(rCode).emit(
                SOCKET_EVENTS.SERVER.ERROR_MSG,
                "Quản trò đã rời phòng! Trận đấu đã kết thúc và chuyển về Phòng chờ.",
              );
              delete roomGameData[rCode];
              io.to(rCode).emit(SOCKET_EVENTS.SERVER.BACK_TO_ROOM);
            } else if (ag.players) {
              ag.players = ag.players.filter(
                (p) => p.socketId !== socket.id && p.characterName !== removed.characterName,
              );
              if (ag.moderator) {
                io.to(ag.moderator.socketId).emit(
                  SOCKET_EVENTS.SERVER.MODERATOR_PLAYERS_UPDATED,
                  ag.players,
                );
              }
            }
          }

          if (rooms[rCode].length === 0) {
            deleteRoom(rCode);
          } else {
            if (removed.isHost) {
              // HOST MIGRATION: Trao quyền Host cho người có ghế nhỏ nhất tiếp theo
              rooms[rCode].sort((a, b) => (a.seatNumber || 1) - (b.seatNumber || 1));
              rooms[rCode][0].isHost = true;
              rooms[rCode][0].isReady = true;
              io.to(rCode).emit(SOCKET_EVENTS.SERVER.HOST_CHANGED, rooms[rCode][0]);
            }
            io.to(rCode).emit(SOCKET_EVENTS.SERVER.UPDATE_PLAYERS, {
              players: rooms[rCode],
              metadata: roomMetadata[rCode] || null,
            });
          }
          // Cập nhật lại danh sách phòng public ở Sảnh
          io.emit(SOCKET_EVENTS.SERVER.PUBLIC_ROOMS_LIST, getPublicRooms());
        }
      }
    }
  }

  // 0. LẤY DANH SÁCH PHÒNG ONLINE CÔNG KHAI Ở SẢNH
  socket.on(SOCKET_EVENTS.CLIENT.GET_PUBLIC_ROOMS, () => {
    socket.emit(SOCKET_EVENTS.SERVER.PUBLIC_ROOMS_LIST, getPublicRooms());
  });

  // 1. TẠO PHÒNG (CHẾ ĐỘ NGOÀI ĐỜI - OFFLINE COMPANION)
  socket.on(SOCKET_EVENTS.CLIENT.CREATE_ROOM, (user) => {
    if (!user || !user.characterName) {
      return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Thông tin người dùng không hợp lệ!");
    }

    const playerToken = user.token || user.sessionToken || socket.id;
    leaveAllOtherRooms(null, playerToken, user.characterName);

    let roomCode;
    let attempts = 0;
    do {
      roomCode = Math.floor(1000 + Math.random() * 9000).toString();
      attempts++;
    } while (rooms[roomCode] && attempts < 1000);

    roomMetadata[roomCode] = {
      gameMode: "offline",
      isPublic: false,
      pinCode: null,
      createdAt: Date.now(),
    };

    rooms[roomCode] = [
      {
        ...user,
        token: playerToken,
        socketId: socket.id,
        isHost: true,
        seatNumber: 1,
        isReady: true,
      },
    ];

    socket.join(roomCode);
    socket.emit(SOCKET_EVENTS.SERVER.ROOM_CREATED, roomCode);
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.UPDATE_PLAYERS, {
      players: rooms[roomCode],
      metadata: roomMetadata[roomCode],
    });
  });

  // 1.1. TẠO PHÒNG ONLINE MỚI (ONLINE AUTOMATED REMOTE)
  socket.on(SOCKET_EVENTS.CLIENT.CREATE_ONLINE_ROOM, (data) => {
    const { user, roomName, isPublic, pinCode, settings } = data || {};
    if (!user || !user.characterName) {
      return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Thông tin người dùng không hợp lệ!");
    }

    const playerToken = user.token || user.sessionToken || socket.id;
    leaveAllOtherRooms(null, playerToken, user.characterName);

    let roomCode;
    let attempts = 0;
    do {
      roomCode = Math.floor(1000 + Math.random() * 9000).toString();
      attempts++;
    } while (rooms[roomCode] && attempts < 1000);

    roomMetadata[roomCode] = {
      gameMode: "online",
      roomName: roomName ? roomName.trim() : `Phòng của ${user.characterName}`,
      isPublic: isPublic !== false,
      pinCode: pinCode ? String(pinCode).trim() : null,
      maxPlayers: 18,
      settings: {
        ...DEFAULT_ONLINE_SETTINGS,
        ...(settings || {}),
      },
      createdAt: Date.now(),
    };

    rooms[roomCode] = [
      {
        ...user,
        token: playerToken,
        socketId: socket.id,
        isHost: true,
        seatNumber: 1,
        isReady: true,
      },
    ];

    socket.join(roomCode);
    socket.emit(SOCKET_EVENTS.SERVER.ROOM_CREATED, roomCode);
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.UPDATE_PLAYERS, {
      players: rooms[roomCode],
      metadata: roomMetadata[roomCode],
    });

    // Cập nhật danh sách sảnh
    io.emit(SOCKET_EVENTS.SERVER.PUBLIC_ROOMS_LIST, getPublicRooms());
  });

  // 1.2. GHÉP TRẬN NHANH (SMART QUICK MATCH)
  socket.on(SOCKET_EVENTS.CLIENT.QUICK_MATCH, (user) => {
    if (!user || !user.characterName) {
      return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Thông tin người dùng không hợp lệ!");
    }

    const publicRooms = getPublicRooms().filter((r) => !r.hasPin && r.playerCount < r.maxPlayers);

    if (publicRooms.length > 0) {
      // Ưu tiên phòng đông người nhất (Greedy Fill)
      const targetRoom = publicRooms[0];
      socket.emit("quick_match_found", { roomCode: targetRoom.roomCode });
    } else {
      // Không có phòng phù hợp -> Tự động tạo phòng Public mới làm Host
      const playerToken = user.token || user.sessionToken || socket.id;
      leaveAllOtherRooms(null, playerToken, user.characterName);

      let roomCode;
      let attempts = 0;
      do {
        roomCode = Math.floor(1000 + Math.random() * 9000).toString();
        attempts++;
      } while (rooms[roomCode] && attempts < 1000);

      roomMetadata[roomCode] = {
        gameMode: "online",
        roomName: `Phòng của ${user.characterName}`,
        isPublic: true,
        pinCode: null,
        maxPlayers: 18,
        settings: { ...DEFAULT_ONLINE_SETTINGS },
        createdAt: Date.now(),
      };

      rooms[roomCode] = [
        {
          ...user,
          token: playerToken,
          socketId: socket.id,
          isHost: true,
          seatNumber: 1,
          isReady: true,
        },
      ];

      socket.join(roomCode);
      socket.emit(SOCKET_EVENTS.SERVER.ROOM_CREATED, roomCode);
      io.to(roomCode).emit(SOCKET_EVENTS.SERVER.UPDATE_PLAYERS, {
        players: rooms[roomCode],
        metadata: roomMetadata[roomCode],
      });
      io.emit(SOCKET_EVENTS.SERVER.PUBLIC_ROOMS_LIST, getPublicRooms());
    }
  });

  // 2. VÀO PHÒNG (Hỗ trợ cả Offline & Online, Reconnect, Kiểm tra PIN)
  socket.on(SOCKET_EVENTS.CLIENT.JOIN_ROOM, (data) => {
    const { roomCode, user, pinCode } = data || {};
    if (!roomCode || !user || !user.characterName) {
      return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Dữ liệu vào phòng không hợp lệ!");
    }

    if (!rooms[roomCode]) {
      return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Phòng không tồn tại hoặc đã bị giải tán!");
    }

    const meta = roomMetadata[roomCode];
    const incomingToken = user.token || user.sessionToken;

    // Kiểm tra PIN đối với phòng Online riêng tư (nếu không phải người chơi cũ đang reconnect)
    const existingPlayer = rooms[roomCode].find(
      (p) => p.characterName.toLowerCase() === user.characterName.trim().toLowerCase(),
    );

    if (!existingPlayer && meta && meta.pinCode) {
      if (!pinCode || String(pinCode).trim() !== String(meta.pinCode).trim()) {
        return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Mật khẩu phòng (PIN) không chính xác!");
      }
    }

    // Kiểm tra giới hạn số người tối đa (18 người)
    if (!existingPlayer && rooms[roomCode].length >= (meta?.maxPlayers || 18)) {
      return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Phòng đã đủ số lượng người chơi tối đa!");
    }

    leaveAllOtherRooms(roomCode, incomingToken, user.characterName);

    // Hủy bộ đếm dọn phòng trống nếu có người kết nối lại
    clearRoomEmptyTimer(roomCode);

    // Hủy grace timer disconnect của người chơi hoặc Quản trò nếu đang chạy
    clearPlayerGraceTimer(roomCode, user.characterName);
    clearPlayerGraceTimer(roomCode, `MOD_${user.characterName}`);

    const activeGame = roomGameData[roomCode];

    // BẢO VỆ CHỐNG MẠO DANH & SOI BÀI:
    if (existingPlayer) {
      // Nếu đã có token phiên và token gửi lên không khớp -> Chặn mạo danh!
      if (existingPlayer.token) {
        if (!incomingToken || existingPlayer.token !== incomingToken) {
          return socket.emit(
            SOCKET_EVENTS.SERVER.ERROR_MSG,
            "Tên nhân vật này đã có người sử dụng trong phòng! Vui lòng chọn tên khác hoặc đăng nhập đúng tài khoản.",
          );
        }
      }

      // Nếu socket cũ vẫn đang kết nối online mà không có token trùng khớp
      const oldSocket = io.sockets.sockets.get(existingPlayer.socketId);
      if (
        oldSocket &&
        oldSocket.connected &&
        oldSocket.id !== socket.id &&
        (!incomingToken || existingPlayer.token !== incomingToken)
      ) {
        return socket.emit(
          SOCKET_EVENTS.SERVER.ERROR_MSG,
          "Người chơi này hiện đang online trong phòng! Bạn không thể mạo danh.",
        );
      }

      existingPlayer.socketId = socket.id;
      if (incomingToken && !existingPlayer.token) {
        existingPlayer.token = incomingToken;
      }
    } else {
      // Nếu ván đấu đang diễn ra mà người này không thuộc phòng từ trước
      if (activeGame) {
        return socket.emit(
          SOCKET_EVENTS.SERVER.ERROR_MSG,
          "Trận đấu trong phòng này đang diễn ra! Bạn không thể vào giữa ván.",
        );
      }
      const playerToken = incomingToken || socket.id;
      const seatNumber = assignLowestSeatNumber(rooms[roomCode]);
      rooms[roomCode].push({
        ...user,
        token: playerToken,
        socketId: socket.id,
        isHost: false,
        seatNumber,
        isReady: false,
      });
    }

    socket.join(roomCode);
    socket.emit(SOCKET_EVENTS.SERVER.ROOM_JOINED, roomCode);
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.UPDATE_PLAYERS, {
      players: rooms[roomCode],
      metadata: roomMetadata[roomCode] || null,
    });
    io.emit(SOCKET_EVENTS.SERVER.PUBLIC_ROOMS_LIST, getPublicRooms());

    // HỖ TRỢ PHỤC HỒI KHI F5 / RỚT MẠNG VÀO LẠI TRẬN ĐẤU ĐANG CHẠY
    if (activeGame) {
      // Quản trò kết nối lại
      if (
        activeGame.moderator &&
        activeGame.moderator.characterName.toLowerCase() === user.characterName.trim().toLowerCase()
      ) {
        // Kiểm tra bảo mật token của Quản trò chống soi bài gian lận
        if (
          activeGame.moderator.token &&
          (!incomingToken || activeGame.moderator.token !== incomingToken)
        ) {
          return socket.emit(
            SOCKET_EVENTS.SERVER.ERROR_MSG,
            "Xác thực Quản trò thất bại! Token phiên làm việc không khớp.",
          );
        }

        activeGame.moderator.socketId = socket.id;
        io.to(roomCode).emit(
          SOCKET_EVENTS.SERVER.ERROR_MSG,
          "✅ Quản trò đã kết nối lại phòng thành công!",
        );
        socket.emit(SOCKET_EVENTS.SERVER.RECEIVE_ROLE, {
          isModerator: true,
          name: "Quản Trò (Game Master)",
          team: "Quản Trò",
          description:
            "Bạn là Quản Trò - nắm giữ toàn bộ diễn biến của ngôi làng. Hãy sử dụng bảng điều khiển này để điều hành trận đấu trực tiếp!",
          roomCode,
          moderatorData: {
            players: activeGame.players,
            allCards: activeGame.cardsInGame,
            nightOrder: activeGame.nightOrder,
            wolves: activeGame.players
              .filter((p) => p.role && (p.role.team === "Sói" || p.role.name?.includes("Sói")))
              .map((p) => p.characterName),
          },
        });
      } else if (activeGame.players) {
        // Người chơi thường kết nối lại
        const inGamePlayer = activeGame.players.find(
          (p) => p.characterName.toLowerCase() === user.characterName.trim().toLowerCase(),
        );
        if (inGamePlayer) {
          if (
            inGamePlayer.token &&
            (!incomingToken || inGamePlayer.token !== incomingToken)
          ) {
            return socket.emit(
              SOCKET_EVENTS.SERVER.ERROR_MSG,
              "Xác thực người chơi thất bại! Token phiên làm việc không khớp.",
            );
          }

          inGamePlayer.socketId = socket.id;
          inGamePlayer.isOnline = true;
          const cleanRole = sanitizeCard(inGamePlayer.role);
          socket.emit(SOCKET_EVENTS.SERVER.RECEIVE_ROLE, {
            ...cleanRole,
            isAlive: inGamePlayer.isAlive !== undefined ? inGamePlayer.isAlive : true,
            isModerator: false,
            roomCode,
            moderatorName: activeGame.moderator ? activeGame.moderator.characterName : null,
          });

          // PHỤC HỒI CHO TRẬN ONLINE: THAM GIA LẠI PHÒNG BÍ MẬT & ĐỒNG BỘ TRẠNG THÁI
          const onlineState = roomOnlineState[roomCode];
          if (onlineState) {
            socket.join(`room_${roomCode}_town`);

            const roleName = (inGamePlayer.role?.name || "").toLowerCase();
            const roleTeam = (inGamePlayer.role?.team || "").toLowerCase();
            const isWolf = roleTeam === "sói" || roleName.includes("sói") || roleName.includes("wolf");
            const isLittleGirl = roleName.includes("cô bé") || roleName.includes("little girl");

            if (isWolf || isLittleGirl) {
              socket.join(`room_${roomCode}_wolf`);
            }

            if (
              onlineState.lovers &&
              Array.isArray(onlineState.lovers) &&
              onlineState.lovers.some(
                (l) => l.toLowerCase() === user.characterName.trim().toLowerCase(),
              )
            ) {
              socket.join(`room_${roomCode}_lovers`);
            }

            // Gửi lại Phase hiện tại và thời gian đếm ngược còn lại
            if (onlineState.currentPhase && onlineState.currentPhase !== "GAME_OVER") {
              const remainingSecs = Math.max(
                2,
                Math.round(((onlineState.phaseEndsAt || 0) - Date.now()) / 1000),
              );
              socket.emit(SOCKET_EVENTS.SERVER.PHASE_CHANGED, {
                phase: onlineState.currentPhase,
                duration: remainingSecs,
                dayNumber: onlineState.dayNumber || 1,
                nightNumber: onlineState.nightNumber || 1,
                suspect: onlineState.accusedPlayer || undefined,
                mayor: onlineState.mayor || undefined,
                suspects: onlineState.tieSuspects || undefined,
                instruction: "Đang tiếp tục diễn biến trận đấu...",
              });

              if (onlineState.currentPhase === "NIGHT_WOLF" && isWolf) {
                socket.emit(SOCKET_EVENTS.SERVER.WOLF_VOTES_UPDATED, {
                  votes: onlineState.wolfVotes || {},
                });
              }

              if (
                (onlineState.currentPhase === "DAY_VOTE" ||
                  onlineState.currentPhase === "DAY_VOTE_TIE_BREAKER" ||
                  onlineState.currentPhase === "DAY_MAYOR_ELECTION") &&
                onlineState.dayVotes
              ) {
                socket.emit(SOCKET_EVENTS.SERVER.DAY_VOTES_UPDATED, {
                  votes: onlineState.dayVotes || {},
                });
              }
            }
          }

          // Cập nhật lại danh sách người chơi cho Quản trò
          if (activeGame.moderator) {
            io.to(activeGame.moderator.socketId).emit(
              SOCKET_EVENTS.SERVER.MODERATOR_PLAYERS_UPDATED,
              activeGame.players,
            );
          }
        }
      }
    }
  });

  // 3. RỜI PHÒNG CHỦ ĐỘNG
  socket.on(SOCKET_EVENTS.CLIENT.LEAVE_ROOM, (data) => {
    const roomCode = typeof data === "object" ? data?.roomCode : data;
    if (rooms[roomCode]) {
      const playerIndex = rooms[roomCode].findIndex((p) => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const leftPlayer = rooms[roomCode].splice(playerIndex, 1)[0];
        clearPlayerGraceTimer(roomCode, leftPlayer.characterName);
        socket.leave(roomCode);

        // Cập nhật dữ liệu ván đấu nếu ván đang chạy
        const activeGame = roomGameData[roomCode];
        if (activeGame) {
          const isModeratorLeaving =
            activeGame.moderator && activeGame.moderator.socketId === socket.id;

          if (isModeratorLeaving) {
            io.to(roomCode).emit(
              SOCKET_EVENTS.SERVER.ERROR_MSG,
              "Quản trò đã rời phòng! Trận đấu đã kết thúc và chuyển về Phòng chờ.",
            );
            delete roomGameData[roomCode];
            io.to(roomCode).emit(SOCKET_EVENTS.SERVER.BACK_TO_ROOM);
          } else if (activeGame.players) {
            activeGame.players = activeGame.players.filter(
              (p) => p.socketId !== socket.id && p.characterName !== leftPlayer.characterName,
            );
            if (activeGame.moderator) {
              io.to(activeGame.moderator.socketId).emit(
                SOCKET_EVENTS.SERVER.MODERATOR_PLAYERS_UPDATED,
                activeGame.players,
              );
            }
          }
        }

        if (rooms[roomCode].length === 0) {
          deleteRoom(roomCode);
          console.log(`🗑️ Phòng ${roomCode} đã bị giải tán.`);
        } else {
          if (leftPlayer.isHost) {
            // HOST MIGRATION: Trao quyền cho người có ghế nhỏ nhất tiếp theo
            rooms[roomCode].sort((a, b) => (a.seatNumber || 1) - (b.seatNumber || 1));
            rooms[roomCode][0].isHost = true;
            rooms[roomCode][0].isReady = true;
            io.to(roomCode).emit(SOCKET_EVENTS.SERVER.HOST_CHANGED, rooms[roomCode][0]);
          }
          io.to(roomCode).emit(SOCKET_EVENTS.SERVER.UPDATE_PLAYERS, {
            players: rooms[roomCode],
            metadata: roomMetadata[roomCode] || null,
          });
        }
        io.emit(SOCKET_EVENTS.SERVER.PUBLIC_ROOMS_LIST, getPublicRooms());
      }
    }
  });

  // 3.1. BẬT/TẮT TRẠNG THÁI SẴN SÀNG (READY CHECK)
  socket.on(SOCKET_EVENTS.CLIENT.TOGGLE_READY, (data) => {
    const roomCode = typeof data === "object" ? data?.roomCode : data;
    const roomPlayers = rooms[roomCode];
    if (!roomPlayers) return;

    const player = roomPlayers.find((p) => p.socketId === socket.id);
    if (!player) return;

    // Host luôn luôn là ready = true
    if (player.isHost) {
      player.isReady = true;
    } else {
      player.isReady = !player.isReady;
    }

    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.UPDATE_PLAYERS, {
      players: rooms[roomCode],
      metadata: roomMetadata[roomCode] || null,
    });
  });

  // 3.2. CẬP NHẬT CÀI ĐẶT PHÒNG CHO HOST
  socket.on(SOCKET_EVENTS.CLIENT.UPDATE_ROOM_SETTINGS, (data) => {
    const { roomCode, settings } = data || {};
    if (!roomCode || !rooms[roomCode] || !settings) return;

    const roomPlayers = rooms[roomCode];
    const sender = roomPlayers.find((p) => p.socketId === socket.id);
    if (!sender || !sender.isHost) {
      return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Chỉ Chủ phòng mới có quyền thay đổi cài đặt!");
    }

    if (roomMetadata[roomCode]) {
      roomMetadata[roomCode].settings = {
        ...roomMetadata[roomCode].settings,
        ...settings,
      };
      io.to(roomCode).emit(
        SOCKET_EVENTS.SERVER.ONLINE_ROOM_SETTINGS_UPDATED,
        roomMetadata[roomCode].settings,
      );
      io.to(roomCode).emit(SOCKET_EVENTS.SERVER.UPDATE_PLAYERS, {
        players: rooms[roomCode],
        metadata: roomMetadata[roomCode],
      });
      io.emit(SOCKET_EVENTS.SERVER.PUBLIC_ROOMS_LIST, getPublicRooms());
    }
  });

  // 3.3. CHỦ PHÒNG KICK NGƯỜI CHƠI
  socket.on(SOCKET_EVENTS.CLIENT.KICK_PLAYER, (data) => {
    const { roomCode, targetCharacterName } = data || {};
    if (!roomCode || !rooms[roomCode] || !targetCharacterName) return;

    const roomPlayers = rooms[roomCode];
    const sender = roomPlayers.find((p) => p.socketId === socket.id);
    if (!sender || !sender.isHost) {
      return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Chỉ Chủ phòng mới có quyền đuổi người chơi!");
    }

    const targetIdx = roomPlayers.findIndex(
      (p) => p.characterName.toLowerCase() === targetCharacterName.trim().toLowerCase(),
    );

    if (targetIdx !== -1) {
      const kicked = roomPlayers.splice(targetIdx, 1)[0];
      clearPlayerGraceTimer(roomCode, kicked.characterName);

      const targetSocket = io.sockets.sockets.get(kicked.socketId);
      if (targetSocket) {
        targetSocket.leave(roomCode);
        targetSocket.emit(
          SOCKET_EVENTS.SERVER.KICKED_FROM_ROOM,
          "Bạn đã bị Chủ phòng mời ra khỏi phòng!",
        );
      }

      io.to(roomCode).emit(SOCKET_EVENTS.SERVER.UPDATE_PLAYERS, {
        players: rooms[roomCode],
        metadata: roomMetadata[roomCode] || null,
      });
      io.emit(SOCKET_EVENTS.SERVER.PUBLIC_ROOMS_LIST, getPublicRooms());
    }
  });

  // 4. CHƠI VÁN MỚI
  socket.on(SOCKET_EVENTS.CLIENT.PLAY_AGAIN, (roomCode) => {
    const roomPlayers = rooms[roomCode];
    if (!roomPlayers) return;
    const hostPlayer = roomPlayers.find((p) => p.isHost);
    const g = roomGameData[roomCode];
    const isModerator = g?.moderator?.socketId === socket.id;
    const isHost = hostPlayer?.socketId === socket.id;

    if (!isHost && !isModerator) {
      return socket.emit(SOCKET_EVENTS.SERVER.ERROR_MSG, "Chỉ Chủ phòng hoặc Quản trò mới có thể bắt đầu lại!");
    }

    // Reset trạng thái sẵn sàng cho mọi thành viên (trừ Host) và dọn dẹp các socket room bí mật
    roomPlayers.forEach((p) => {
      p.isReady = !!p.isHost;
      const s = io.sockets.sockets.get(p.socketId);
      if (s && typeof s.leave === "function") {
        s.leave(`room_${roomCode}_wolf`);
        s.leave(`room_${roomCode}_town`);
        s.leave(`room_${roomCode}_lovers`);
      }
    });

    if (roomOnlineState[roomCode]?.timerId) {
      clearTimeout(roomOnlineState[roomCode].timerId);
    }
    delete roomOnlineState[roomCode];
    delete roomGameData[roomCode];
    delete roomChatHistory[roomCode];
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.BACK_TO_ROOM);
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.UPDATE_PLAYERS, {
      players: rooms[roomCode],
      metadata: roomMetadata[roomCode] || null,
    });
    io.emit(SOCKET_EVENTS.SERVER.PUBLIC_ROOMS_LIST, getPublicRooms());
  });

  // 5. NGẮT KẾT NỐI (DISCONNECT VỚI GRACE PERIOD)
  socket.on("disconnect", () => {
    console.log(`❌ Thiết bị ngắt kết nối: ${socket.id}`);
    for (const roomCode in rooms) {
      const roomPlayers = rooms[roomCode];
      const playerIndex = roomPlayers.findIndex((p) => p.socketId === socket.id);

      if (playerIndex !== -1) {
        const leftPlayer = roomPlayers[playerIndex];

        // Trường hợp 1: Game chưa bắt đầu -> Grace period 8s để F5 reconnect
        if (!roomGameData[roomCode]) {
          const graceKey = `${roomCode}_${leftPlayer.characterName}`;
          if (disconnectGraceTimers.has(graceKey)) {
            clearTimeout(disconnectGraceTimers.get(graceKey));
          }

          const timer = setTimeout(() => {
            disconnectGraceTimers.delete(graceKey);
            const currentRoom = rooms[roomCode];
            if (!currentRoom) return;

            const idx = currentRoom.findIndex(
              (p) => p.characterName === leftPlayer.characterName && p.socketId === socket.id,
            );
            if (idx !== -1) {
              const removed = currentRoom.splice(idx, 1)[0];
              console.log(`⏱️ Hết thời gian chờ: ${removed.characterName} đã rời phòng ${roomCode}`);
              if (currentRoom.length === 0) {
                deleteRoom(roomCode);
                console.log(`🗑️ Phòng ${roomCode} đã bị giải tán do không còn ai.`);
                io.emit(SOCKET_EVENTS.SERVER.PUBLIC_ROOMS_LIST, getPublicRooms());
              } else {
                if (removed.isHost) {
                  currentRoom.sort((a, b) => (a.seatNumber || 1) - (b.seatNumber || 1));
                  currentRoom[0].isHost = true;
                  currentRoom[0].isReady = true;
                  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.HOST_CHANGED, currentRoom[0]);
                }
                io.to(roomCode).emit(SOCKET_EVENTS.SERVER.UPDATE_PLAYERS, {
                  players: currentRoom,
                  metadata: roomMetadata[roomCode] || null,
                });
                io.emit(SOCKET_EVENTS.SERVER.PUBLIC_ROOMS_LIST, getPublicRooms());
              }
            }
          }, 8000);

          disconnectGraceTimers.set(graceKey, timer);
        } else {
          // Trường hợp 2: Game đang chạy
          const activeGame = roomGameData[roomCode];

          // 2.1 Nếu người ngắt kết nối là QUẢN TRÒ
          if (
            activeGame &&
            activeGame.moderator &&
            activeGame.moderator.characterName.toLowerCase() === leftPlayer.characterName.toLowerCase()
          ) {
            const modGraceKey = `${roomCode}_MOD_${leftPlayer.characterName}`;
            clearPlayerGraceTimer(roomCode, `MOD_${leftPlayer.characterName}`);

            console.log(`⚠️ Quản trò ${leftPlayer.characterName} mất kết nối trong phòng ${roomCode}. Chờ 15s...`);
            io.to(roomCode).emit(
              SOCKET_EVENTS.SERVER.ERROR_MSG,
              "⚠️ Quản trò vừa mất kết nối! Hệ thống đang chờ Quản trò vào lại trong 15 giây...",
            );

            const timer = setTimeout(() => {
              disconnectGraceTimers.delete(modGraceKey);
              const currentAg = roomGameData[roomCode];
              if (
                currentAg &&
                currentAg.moderator &&
                currentAg.moderator.characterName.toLowerCase() === leftPlayer.characterName.toLowerCase()
              ) {
                const modSocket = io.sockets.sockets.get(currentAg.moderator.socketId);
                if (!modSocket || !modSocket.connected) {
                  console.log(`⏱️ Quản trò ${leftPlayer.characterName} quá hạn kết nối lại. Hủy trận và chuyển phòng ${roomCode} về Sảnh.`);
                  io.to(roomCode).emit(
                    SOCKET_EVENTS.SERVER.ERROR_MSG,
                    "Quản trò đã mất kết nối quá lâu! Trận đấu đã kết thúc và chuyển về Phòng chờ.",
                  );
                  delete roomGameData[roomCode];
                  io.to(roomCode).emit(SOCKET_EVENTS.SERVER.BACK_TO_ROOM);
                }
              }
            }, 15000);

            disconnectGraceTimers.set(modGraceKey, timer);
          } else if (activeGame && activeGame.players) {
            // 2.2 Nếu người ngắt kết nối là người chơi thường: Cập nhật trạng thái cho Quản trò
            const p = activeGame.players.find(
              (x) => x.characterName.toLowerCase() === leftPlayer.characterName.toLowerCase(),
            );
            if (p && p.socketId === socket.id) {
              p.isOnline = false;
              if (activeGame.moderator) {
                io.to(activeGame.moderator.socketId).emit(
                  SOCKET_EVENTS.SERVER.MODERATOR_PLAYERS_UPDATED,
                  activeGame.players,
                );
              }
            }
          }

          // 2.3 Kiểm tra cả phòng có bỏ trống hoàn toàn không
          const socketsInRoom = io.sockets.adapter.rooms.get(roomCode);
          const activeConnectionsCount = socketsInRoom ? socketsInRoom.size : 0;

          if (activeConnectionsCount === 0) {
            console.log(`⚠️ Phòng ${roomCode} đang trống, bắt đầu đếm 60s trước khi dọn RAM...`);
            if (roomEmptyCleanupTimers.has(roomCode)) {
              clearTimeout(roomEmptyCleanupTimers.get(roomCode));
            }
            const cleanupTimer = setTimeout(() => {
              const recheckSockets = io.sockets.adapter.rooms.get(roomCode);
              if (!recheckSockets || recheckSockets.size === 0) {
                deleteRoom(roomCode);
                console.log(`🗑️ Đã dọn dẹp phòng ${roomCode} sau 60s không có ai kết nối lại.`);
              }
              roomEmptyCleanupTimers.delete(roomCode);
            }, 60000);
            roomEmptyCleanupTimers.set(roomCode, cleanupTimer);
          }
        }
      }
    }
  });
}

module.exports = { registerRoomHandlers };
