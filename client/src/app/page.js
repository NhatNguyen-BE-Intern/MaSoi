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

    // Players list updated
    socket.on("update_players", (players) => {
      setRoomPlayers(players);
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const me = players.find(
        (p) => p.characterName === currentUser.characterName,
      );
      if (me) {
        setIsHost(!!me.isHost);
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
        setPlayerRole({
          ...roleData,
          isAlive: roleData.isAlive !== undefined ? roleData.isAlive : true,
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

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("error_msg");
      socket.off("room_created");
      socket.off("room_joined");
      socket.off("update_players");
      socket.off("receive_role");
      socket.off("moderator_players_updated");
      socket.off("player_status_changed");
      socket.off("back_to_room");
      socket.off("sound_triggered");
      socket.off("timer_started");
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

  // Handle Room Actions
  const handleCreateRoom = () => {
    if (!user) return;
    const socket = getSocket();
    socket.emit("create_room", user);
  };

  const handleJoinRoom = (code) => {
    if (!user) return;
    const socket = getSocket();
    socket.emit("join_room", { roomCode: code, user });
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
  };

  const handleStartGame = (gameConfig) => {
    const socket = getSocket();
    socket.emit("start_game", gameConfig);
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
      />

      {/* Main View Area */}
      <main style={{ flex: 1 }}>
        {!user ? (
          /* Step 1: Authentication & Character Creation */
          <AuthSection onAuthSuccess={handleAuthSuccess} />
        ) : gameState === "lobby" ? (
          /* Step 2: Main Lobby (Create or Join room) */
          <LobbySection
            user={user}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onOpenFriends={() => setIsFriendsOpen(true)}
            onOpenDictionary={() => setIsDictionaryOpen(true)}
          />
        ) : gameState === "in_room" ? (
          /* Step 3: Waiting in Room with friends */
          <RoomLobby
            roomCode={currentRoomCode}
            players={roomPlayers}
            user={user}
            isHost={isHost}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
          />
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
          />
        )}
      </main>

      {/* Modals */}
      <FriendsModal
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        user={user}
      />

      <CardDictionaryModal
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
      />
    </div>
  );
}
