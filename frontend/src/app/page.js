"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import AuthSection from "../components/AuthSection";
import LobbySection from "../components/LobbySection";
import RoomLobby from "../components/RoomLobby";
import PlayerCardView from "../components/PlayerCardView";
import ModeratorDashboard from "../components/ModeratorDashboard";
import FriendsModal from "../components/FriendsModal";
import CardDictionaryModal from "../components/CardDictionaryModal";
import ModeSelectionModal from "../components/ModeSelectionModal";
import OnlineLobby from "../components/online/OnlineLobby";
import OnlineRoomLobby from "../components/online/OnlineRoomLobby";
import ChatBox from "../components/online/ChatBox";
import NightActionSheet from "../components/online/NightActionSheet";
import DeathAnnouncementModal from "../components/online/DeathAnnouncementModal";
import DayVotingPanel from "../components/online/DayVotingPanel";
import { getSocket } from "../lib/socket";
import {
  playWolfHowl,
  playChurchBell,
  playMorningChime,
  playTimerAlarm,
  playDeathSound,
  playReviveSound,
} from "../lib/sound";

export default function Home() {
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [gameMode, setGameMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("masoi_game_mode") || null;
    }
    return null;
  });
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [roomMetadata, setRoomMetadata] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState(() => {
    if (typeof window !== "undefined") {
      const savedRoom = sessionStorage.getItem("masoi_current_room");
      if (savedRoom) return "in_room";
    }
    return "lobby";
  });
  const [currentRoomCode, setCurrentRoomCode] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("masoi_current_room") || "";
    }
    return "";
  });
  const [isHost, setIsHost] = useState(false);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [isModerator, setIsModerator] = useState(false);
  const [moderatorData, setModeratorData] = useState(null);
  const [playerRole, setPlayerRole] = useState(null);
  const [activeTimer, setActiveTimer] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [currentPhase, setCurrentPhase] = useState("LOBBY");
  const [deathAnnouncementData, setDeathAnnouncementData] = useState(null);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);

  // 2. Initialize Socket listeners
  useEffect(() => {
    const socket = getSocket();

    socket.on("connect", () => {
      setIsConnected(true);
      // TỰ ĐỘNG RECONNECT NẾU VỪA RELOAD (F5) TRONG PHÒNG
      const savedRoom = sessionStorage.getItem("masoi_current_room");
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      if (savedRoom && currentUser?.characterName) {
        console.log(`🔄 Tự động khôi phục kết nối vào phòng ${savedRoom}...`);
        socket.emit("join_room", { roomCode: savedRoom, user: currentUser });
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("error_msg", (msg) => {
      alert(msg);
      // Nếu phòng đã bị xóa hoặc không hợp lệ, dọn sạch session để về lại sảnh
      if (
        msg.includes("không tồn tại") ||
        msg.includes("giải tán") ||
        msg.includes("không thể vào")
      ) {
        sessionStorage.removeItem("masoi_current_room");
        setCurrentRoomCode("");
        setGameState("lobby");
        setPlayerRole(null);
        setIsModerator(false);
        setModeratorData(null);
      }
    });

    // Room created
    socket.on("room_created", (code) => {
      sessionStorage.setItem("masoi_current_room", code);
      setCurrentRoomCode(code);
      setGameState("in_room");
      setIsHost(true);
    });

    // Room joined
    socket.on("room_joined", (code) => {
      sessionStorage.setItem("masoi_current_room", code);
      setCurrentRoomCode(code);
      setGameState("in_room");
      setIsHost(false);
    });

    // Players list updated (hỗ trợ cả format cũ và format mới có metadata)
    socket.on("update_players", (data) => {
      const players = Array.isArray(data) ? data : data?.players || [];
      const meta = data?.metadata || null;
      setRoomPlayers(players);
      if (meta) {
        setRoomMetadata(meta);
        if (meta.gameMode) {
          setGameMode(meta.gameMode);
          localStorage.setItem("masoi_game_mode", meta.gameMode);
        }
      }
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const me = players.find(
        (p) => p.characterName?.toLowerCase() === currentUser?.characterName?.toLowerCase(),
      );
      if (me) {
        setIsHost(!!me.isHost);
      }
    });

    // Cài đặt phòng Online được Host cập nhật
    socket.on("online_room_settings_updated", (newSettings) => {
      setRoomMetadata((prev) => (prev ? { ...prev, settings: newSettings } : prev));
    });

    // Bị Host kick khỏi phòng
    socket.on("kicked_from_room", (msg) => {
      alert(msg);
      sessionStorage.removeItem("masoi_current_room");
      setCurrentRoomCode("");
      setGameState("lobby");
      setRoomPlayers([]);
      setRoomMetadata(null);
    });

    // Chuyển quyền Host mới (Host Migration)
    socket.on("host_changed", (newHost) => {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (
        currentUser?.characterName &&
        newHost?.characterName?.toLowerCase() === currentUser.characterName.toLowerCase()
      ) {
        setIsHost(true);
        alert("👑 Bạn hiện là Chủ phòng mới!");
      }
    });

    // Game started & Role distributed
    socket.on("receive_role", (roleData) => {
      setGameState("playing");
      if (roleData.isModerator) {
        setIsModerator(true);
        setModeratorData(roleData.moderatorData);
      } else {
        setIsModerator(false);
        const resolved =
          roleData?._doc && typeof roleData._doc === "object"
            ? { ...roleData._doc, ...roleData }
            : roleData;
        setPlayerRole({
          ...resolved,
          isAlive: resolved?.isAlive !== undefined ? resolved.isAlive : true,
        });
      }
    });

    // Moderator player updates
    socket.on("moderator_players_updated", (updatedPlayers) => {
      setModeratorData((prev) => ({
        ...prev,
        players: updatedPlayers,
      }));
    });

    // Lắng nghe thay đổi trạng thái Sống / Chết của người chơi (TỐI ƯU TRẢI NGHIỆM)
    socket.on("player_status_changed", ({ characterName, isAlive }) => {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const muted = localStorage.getItem("masoi_sound_muted") === "true";

      // Nếu chính là bản thân mình
      if (currentUser?.characterName && characterName === currentUser.characterName) {
        setPlayerRole((prev) => (prev ? { ...prev, isAlive } : prev));
        if (!muted) {
          if (isAlive) playReviveSound();
          else playDeathSound();
        }
      }

      // Cập nhật trong dữ liệu Quản trò
      setModeratorData((prev) => {
        if (!prev || !prev.players) return prev;
        return {
          ...prev,
          players: prev.players.map((p) =>
            p.characterName === characterName ? { ...p, isAlive } : p,
          ),
        };
      });

      // Cập nhật danh sách roomPlayers
      setRoomPlayers((prev) =>
        prev.map((p) =>
          p.characterName === characterName ? { ...p, isAlive } : p,
        ),
      );
    });

    // Return to room lobby (Play Again)
    socket.on("back_to_room", () => {
      setGameState("in_room");
      setPlayerRole(null);
      setIsModerator(false);
      setModeratorData(null);
      setActiveTimer(null);
      setGameOverData(null);
      setDeathAnnouncementData(null);
      setCurrentPhase("LOBBY");
    });

    // Online game phase changed
    socket.on("phase_changed", (data) => {
      if (data?.phase) setCurrentPhase(data.phase);
    });

    // Online morning death announcement
    socket.on("day_announcement", (data) => {
      setDeathAnnouncementData(data);
    });

    // Real-time sound effect triggered by moderator
    socket.on("sound_triggered", (soundType) => {
      const muted = localStorage.getItem("masoi_sound_muted") === "true";
      if (!muted) {
        if (soundType === "wolf") playWolfHowl();
        if (soundType === "bell") playChurchBell();
        if (soundType === "morning") playMorningChime();
        if (soundType === "death") playDeathSound();
        if (soundType === "revive") playReviveSound();
      }
    });

    // Real-time discussion timer started
    socket.on("timer_started", ({ seconds, label }) => {
      setActiveTimer({ remaining: seconds, label });
    });

    // Real-time discussion timer stopped
    socket.on("timer_stopped", () => {
      setActiveTimer(null);
    });

    // Game Over & Phân định Thắng / Thua
    socket.on("game_over", (data) => {
      setGameOverData(data);
      setCurrentPhase("GAME_OVER");
      try {
        import("canvas-confetti").then((mod) => {
          const confetti = mod.default || mod;
          confetti({
            particleCount: 140,
            spread: 80,
            origin: { y: 0.5 },
          });
        });
      } catch (err) {}
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("error_msg");
      socket.off("room_created");
      socket.off("room_joined");
      socket.off("update_players");
      socket.off("online_room_settings_updated");
      socket.off("kicked_from_room");
      socket.off("host_changed");
      socket.off("receive_role");
      socket.off("moderator_players_updated");
      socket.off("player_status_changed");
      socket.off("back_to_room");
      socket.off("phase_changed");
      socket.off("day_announcement");
      socket.off("sound_triggered");
      socket.off("timer_started");
      socket.off("timer_stopped");
      socket.off("game_over");
    };
  }, []);

  // Timer countdown on client
  useEffect(() => {
    let timerId = null;
    if (activeTimer && activeTimer.remaining > 0) {
      timerId = setInterval(() => {
        setActiveTimer((prev) => {
          if (!prev || prev.remaining <= 1) {
            playTimerAlarm();
            return null;
          }
          return { ...prev, remaining: prev.remaining - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [activeTimer]);

  // Handle Auth
  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("masoi_current_room");
    localStorage.removeItem("user");
    setUser(null);
    setGameState("lobby");
    setCurrentRoomCode("");
    window.location.reload();
  };

  // Handle Chế Độ Chơi (Portal)
  const handleSelectMode = (mode) => {
    setGameMode(mode);
    localStorage.setItem("masoi_game_mode", mode);
    setIsModeModalOpen(false);
  };

  // Handle Room Actions
  const handleCreateRoom = () => {
    if (!user) return;
    const socket = getSocket();
    socket.emit("create_room", user);
  };

  const handleCreateOnlineRoom = (roomData) => {
    const socket = getSocket();
    socket.emit("create_online_room", roomData);
  };

  const handleJoinRoom = (code) => {
    if (!user) return;
    const socket = getSocket();
    socket.emit("join_room", { roomCode: code, user });
  };

  const handleJoinOnlineRoom = (code, pinCode) => {
    if (!user) return;
    const socket = getSocket();
    socket.emit("join_room", { roomCode: code, user, pinCode });
  };

  const handleLeaveRoom = () => {
    if (currentRoomCode) {
      const socket = getSocket();
      socket.emit("leave_room", currentRoomCode);
    }
    sessionStorage.removeItem("masoi_current_room");
    setCurrentRoomCode("");
    setGameState("lobby");
    setPlayerRole(null);
    setIsModerator(false);
    setModeratorData(null);
    setRoomMetadata(null);
  };

  const handleStartGame = (gameConfig) => {
    const socket = getSocket();
    const config =
      typeof gameConfig === "object" && gameConfig && !gameConfig.nativeEvent
        ? { roomCode: currentRoomCode, ...gameConfig }
        : { roomCode: currentRoomCode, mode: "auto", moderatorMode: "none" };
    socket.emit("start_game", config);
  };

  const handlePlayAgain = () => {
    const socket = getSocket();
    socket.emit("play_again", currentRoomCode);
  };

  // Moderator actions (Truyền thêm targetCharacterName để chống rớt mạng / đổi socket)
  const handleTogglePlayerStatus = ({ roomCode, targetSocketId, targetCharacterName }) => {
    const socket = getSocket();
    socket.emit("moderator_toggle_status", { roomCode, targetSocketId, targetCharacterName });
  };

  const handleBroadcastSound = ({ roomCode, soundType }) => {
    const socket = getSocket();
    socket.emit("play_sound_effect", { roomCode, soundType });
  };

  const handleStartTimer = ({ roomCode, seconds, label }) => {
    const socket = getSocket();
    socket.emit("start_discussion_timer", { roomCode, seconds, label });
  };

  const handleStopTimer = ({ roomCode }) => {
    const socket = getSocket();
    socket.emit("stop_discussion_timer", { roomCode: roomCode || currentRoomCode });
    setActiveTimer(null);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navigation */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenFriends={() => setIsFriendsOpen(true)}
        onOpenDictionary={() => setIsDictionaryOpen(true)}
        isConnected={isConnected}
        currentRoomCode={currentRoomCode}
        onLeaveRoom={handleLeaveRoom}
        onSwitchMode={() => setIsModeModalOpen(true)}
        gameMode={gameMode}
      />

      {/* Main View Area */}
      <main style={{ flex: 1 }}>
        {!user ? (
          /* Step 1: Authentication & Character Creation */
          <AuthSection onAuthSuccess={handleAuthSuccess} />
        ) : gameState === "lobby" ? (
          /* Step 2: Main Lobby (Offline vs Online) */
          gameMode === "online" ? (
            <OnlineLobby
              user={user}
              onJoinRoom={handleJoinOnlineRoom}
              onCreateOnlineRoom={handleCreateOnlineRoom}
              onSwitchMode={() => setIsModeModalOpen(true)}
              onOpenFriends={() => setIsFriendsOpen(true)}
              onOpenDictionary={() => setIsDictionaryOpen(true)}
            />
          ) : (
            <LobbySection
              user={user}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onOpenFriends={() => setIsFriendsOpen(true)}
              onOpenDictionary={() => setIsDictionaryOpen(true)}
            />
          )
        ) : gameState === "in_room" ? (
          /* Step 3: Waiting in Room (Offline vs Online) */
          roomMetadata?.gameMode === "online" ? (
            <OnlineRoomLobby
              roomCode={currentRoomCode}
              players={roomPlayers}
              metadata={roomMetadata}
              user={user}
              isHost={isHost}
              onStartGame={handleStartGame}
              onLeaveRoom={handleLeaveRoom}
            />
          ) : (
            <RoomLobby
              roomCode={currentRoomCode}
              players={roomPlayers}
              user={user}
              isHost={isHost}
              onStartGame={handleStartGame}
              onLeaveRoom={handleLeaveRoom}
            />
          )
        ) : isModerator ? (
          /* Step 4A: Master Game Moderator Dashboard */
          <ModeratorDashboard
            moderatorData={moderatorData}
            roomCode={currentRoomCode}
            onTogglePlayerStatus={handleTogglePlayerStatus}
            onPlayAgain={handlePlayAgain}
            onLeaveRoom={handleLeaveRoom}
            onBroadcastSound={handleBroadcastSound}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
            activeTimer={activeTimer}
          />
        ) : (
          /* Step 4B: Player 3D Flip Card View */
          <PlayerCardView
            role={playerRole}
            roomCode={currentRoomCode}
            isHost={isHost}
            onPlayAgain={handlePlayAgain}
            onLeaveRoom={handleLeaveRoom}
            activeTimer={activeTimer}
            isAlive={playerRole?.isAlive !== false}
            onBroadcastSound={handleBroadcastSound}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
          />
        )}
      </main>

      {/* Modals */}
      <ModeSelectionModal
        isOpen={isModeModalOpen || (!!user && !gameMode && gameState === "lobby")}
        onClose={gameMode ? () => setIsModeModalOpen(false) : null}
        onSelectMode={handleSelectMode}
      />

      <FriendsModal
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        user={user}
      />

      <CardDictionaryModal
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
      />

      {/* Game Over Victory Modal */}
      {gameOverData && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: "460px",
              width: "100%",
              padding: "32px 24px",
              textAlign: "center",
              borderRadius: "20px",
              border: `2px solid ${gameOverData.winner === "Ma Sói" ? "#ef4444" : "#eab308"}`,
              boxShadow: `0 0 40px ${gameOverData.winner === "Ma Sói" ? "rgba(239, 68, 68, 0.4)" : "rgba(234, 179, 8, 0.4)"}`,
            }}
          >
            <div style={{ fontSize: "56px", marginBottom: "12px" }}>
              {gameOverData.winner === "Ma Sói" ? "🐺" : "🏆"}
            </div>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "800",
                color: gameOverData.winner === "Ma Sói" ? "#f87171" : "#fde047",
                marginBottom: "12px",
              }}
            >
              {gameOverData.title}
            </h2>
            <p
              style={{
                color: "#e2e8f0",
                fontSize: "15px",
                lineHeight: "1.6",
                marginBottom: "20px",
              }}
            >
              {gameOverData.message}
            </p>

            {/* Bảng công khai thân phận toàn bộ người chơi khi kết thúc trận đấu */}
            {gameOverData.allRoles && gameOverData.allRoles.length > 0 && (
              <div
                style={{
                  marginBottom: "24px",
                  maxHeight: "220px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>
                  📜 Thân Phận Toàn Làng:
                </div>
                {gameOverData.allRoles.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(30, 41, 59, 0.6)",
                      border: "1px solid rgba(148, 163, 184, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "13px",
                    }}
                  >
                    <div>
                      <span style={{ color: p.isAlive ? "#34d399" : "#94a3b8", marginRight: "6px" }}>
                        {p.isAlive ? "💚" : "💀"}
                      </span>
                      <strong style={{ color: "#f8fafc" }}>{p.characterName}</strong>
                      <span style={{ color: "#64748b", marginLeft: "6px" }}>#{p.seatNumber || "?"}</span>
                    </div>
                    <span
                      style={{
                        fontWeight: "700",
                        fontSize: "12px",
                        padding: "2px 8px",
                        borderRadius: "8px",
                        backgroundColor:
                          p.role?.team === "Sói"
                            ? "rgba(239, 68, 68, 0.2)"
                            : "rgba(56, 189, 248, 0.2)",
                        color: p.role?.team === "Sói" ? "#f87171" : "#38bdf8",
                        border: `1px solid ${p.role?.team === "Sói" ? "#ef4444" : "#38bdf8"}`,
                      }}
                    >
                      {p.role?.name || "Dân Làng"}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              {(isHost || isModerator) && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setGameOverData(null);
                    handlePlayAgain();
                  }}
                  style={{
                    padding: "12px 24px",
                    fontSize: "15px",
                    fontWeight: "bold",
                  }}
                >
                  🔄 Chơi ván mới
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => setGameOverData(null)}
                style={{
                  padding: "12px 18px",
                  fontSize: "14px",
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Box for Online Mode */}
      {currentRoomCode && (roomMetadata?.gameMode === "online" || gameMode === "online") && gameState !== "lobby" && (
        <ChatBox
          roomCode={currentRoomCode}
          user={user}
          players={roomPlayers}
          role={playerRole}
          isAlive={playerRole?.isAlive !== false}
          currentPhase={gameState === "in_room" ? "LOBBY" : currentPhase}
          loverPartner={playerRole?.loverPartner || null}
        />
      )}

      {/* Night Action Sheet Overlay for Online Mode */}
      {currentRoomCode && (roomMetadata?.gameMode === "online" || gameMode === "online") && currentPhase?.startsWith("NIGHT_") && (
        <NightActionSheet
          roomCode={currentRoomCode}
          user={user}
          role={playerRole}
          players={roomPlayers}
          isAlive={playerRole?.isAlive !== false}
          currentPhase={currentPhase}
        />
      )}

      {/* Morning Death Announcement Modal for Online Mode */}
      <DeathAnnouncementModal
        isOpen={!!deathAnnouncementData}
        onClose={() => setDeathAnnouncementData(null)}
        data={deathAnnouncementData}
      />

      {/* Day Voting Panel Overlay for Online Mode */}
      {currentRoomCode && (roomMetadata?.gameMode === "online" || gameMode === "online") && (
        <DayVotingPanel
          roomCode={currentRoomCode}
          user={user}
          role={playerRole}
          players={roomPlayers}
          isAlive={playerRole?.isAlive !== false}
          currentPhase={currentPhase}
        />
      )}
    </div>
  );
}
