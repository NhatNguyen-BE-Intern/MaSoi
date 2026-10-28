"use client";

import React, { useState } from "react";
import { getSocket } from "../../lib/socket";

export default function OnlineRoomLobby({
  roomCode,
  players = [],
  metadata,
  user,
  isHost,
  onStartGame,
  onLeaveRoom,
}) {
  const [copied, setCopied] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Cài đặt phòng
  const currentSettings = metadata?.settings || {
    deckMode: "auto",
    roleRevealOnDeath: "open",
    discussionTime: 90,
  };

  const currentUser = players.find(
    (p) => p.characterName?.toLowerCase() === user?.characterName?.toLowerCase(),
  );

  const isUserReady = currentUser?.isReady;
  const totalPlayers = players.length;
  const readyPlayersCount = players.filter((p) => p.isReady).length;
  const canStartGame = totalPlayers >= 5 && readyPlayersCount === totalPlayers;

  // Xử lý sao chép mã phòng
  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Xử lý bấm Ready
  const handleToggleReady = () => {
    const socket = getSocket();
    socket.emit("toggle_ready", roomCode);
  };

  // Host cập nhật cài đặt
  const handleUpdateSetting = (key, value) => {
    const socket = getSocket();
    socket.emit("update_room_settings", {
      roomCode,
      settings: { [key]: value },
    });
  };

  // Host kick người chơi
  const handleKickPlayer = (targetCharacterName) => {
    if (confirm(`Bạn có chắc muốn mời ${targetCharacterName} ra khỏi phòng?`)) {
      const socket = getSocket();
      socket.emit("kick_player", { roomCode, targetCharacterName });
    }
  };

  // Host bắt đầu ván đấu Online
  const handleStartGame = () => {
    if (!canStartGame) return;
    if (typeof onStartGame === "function") {
      onStartGame({
        roomCode,
        mode: currentSettings.deckMode || "auto",
        customDeck: currentSettings.customDeck || null,
        moderatorMode: "none",
      });
    }
  };

  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "20px 16px" }}>
      {/* Thanh Header Phòng Chờ */}
      <div
        className="glass-panel"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderRadius: "18px",
          marginBottom: "20px",
          border: "1px solid rgba(168, 85, 247, 0.25)",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              background: "rgba(168, 85, 247, 0.2)",
              border: "1px solid rgba(168, 85, 247, 0.4)",
              padding: "6px 14px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#c084fc", fontWeight: "700" }}>MÃ PHÒNG:</span>
            <span style={{ fontSize: "22px", fontWeight: "900", color: "#f8fafc", letterSpacing: "2px" }}>
              {roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              style={{
                background: "transparent",
                border: "none",
                color: copied ? "#4ade80" : "#94a3b8",
                cursor: "pointer",
                fontSize: "14px",
                marginLeft: "4px",
              }}
            >
              {copied ? "✓ Đã chép" : "📋"}
            </button>
          </div>

          <div>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#f8fafc" }}>
              {metadata?.roomName || `Phòng Chờ #${roomCode}`}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>
              Chế độ Online Tự Động Hóa • {totalPlayers}/18 người chơi
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {isHost && (
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="btn btn-secondary"
              style={{ fontSize: "13px", padding: "8px 14px" }}
            >
              ⚙️ Cài Đặt Phòng
            </button>
          )}
          <button
            onClick={onLeaveRoom}
            className="btn btn-secondary"
            style={{
              fontSize: "13px",
              padding: "8px 14px",
              color: "#f87171",
              borderColor: "rgba(239, 68, 68, 0.3)",
            }}
          >
            🚪 Rời Phòng
          </button>
        </div>
      </div>

      {/* Panel Cài Đặt Dành Cho Host */}
      {isSettingsOpen && isHost && (
        <div
          className="glass-panel"
          style={{
            padding: "20px",
            borderRadius: "16px",
            marginBottom: "20px",
            border: "1px solid rgba(234, 179, 8, 0.3)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "6px" }}>
              Bộ bài thi đấu:
            </label>
            <select
              value={currentSettings.deckMode}
              onChange={(e) => handleUpdateSetting("deckMode", e.target.value)}
              className="input-field"
              style={{ padding: "8px 12px", fontSize: "13px" }}
            >
              <option value="auto">🤖 Máy Tự Cân Bằng (Tỷ lệ vàng)</option>
              <option value="custom">🎴 Quản Trò Tự Chọn</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "6px" }}>
              Thân phận khi chết:
            </label>
            <select
              value={currentSettings.roleRevealOnDeath}
              onChange={(e) => handleUpdateSetting("roleRevealOnDeath", e.target.value)}
              className="input-field"
              style={{ padding: "8px 12px", fontSize: "13px" }}
            >
              <option value="open">🎴 Công Khai Bài (Mặc định)</option>
              <option value="hidden">🎭 Giấu Bài (Hardcore)</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "6px" }}>
              Thời gian thảo luận ban ngày:
            </label>
            <select
              value={currentSettings.discussionTime}
              onChange={(e) => handleUpdateSetting("discussionTime", Number(e.target.value))}
              className="input-field"
              style={{ padding: "8px 12px", fontSize: "13px" }}
            >
              <option value={60}>⏱️ 60 giây (Nhanh)</option>
              <option value={90}>⏱️ 90 giây (Tiêu chuẩn)</option>
              <option value={120}>⏱️ 120 giây (Kỹ lưỡng)</option>
              <option value={180}>⏱️ 180 giây (Thư thả)</option>
            </select>
          </div>
        </div>
      )}

      {/* Khu Vực Bàn Tròn Ảo Đánh Số Ghế */}
      <div
        className="glass-panel"
        style={{
          padding: "28px 20px",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          marginBottom: "24px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <span
            style={{
              fontSize: "12px",
              color: "#a855f7",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            Bàn Tròn Hội Đồng Làng
          </span>
          <h3 style={{ margin: "4px 0 0", fontSize: "18px", color: "#f8fafc", fontWeight: "800" }}>
            Vị Trí Ghế Ngồi Thi Đấu
          </h3>
        </div>

        {/* Lưới 18 Ghế Ngồi */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "14px",
          }}
        >
          {Array.from({ length: Math.max(12, totalPlayers) }).map((_, index) => {
            const seatNum = index + 1;
            const playerOnSeat = players.find((p) => p.seatNumber === seatNum);
            const isMe =
              playerOnSeat &&
              playerOnSeat.characterName?.toLowerCase() === user?.characterName?.toLowerCase();

            return (
              <div
                key={seatNum}
                style={{
                  background: playerOnSeat
                    ? isMe
                      ? "linear-gradient(135deg, rgba(88, 28, 135, 0.5), rgba(30, 41, 59, 0.7))"
                      : "rgba(30, 41, 59, 0.5)"
                    : "rgba(15, 23, 42, 0.3)",
                  border: playerOnSeat
                    ? playerOnSeat.isReady
                      ? "1px solid rgba(34, 197, 94, 0.5)"
                      : "1px solid rgba(148, 163, 184, 0.3)"
                    : "1px dashed rgba(255, 255, 255, 0.1)",
                  borderRadius: "16px",
                  padding: "16px 12px",
                  textAlign: "center",
                  position: "relative",
                  transition: "all 0.2s ease",
                  boxShadow: playerOnSeat?.isReady
                    ? "0 0 16px rgba(34, 197, 94, 0.15)"
                    : "none",
                }}
              >
                {/* Số Ghế Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.1)",
                    color: "#cbd5e1",
                    fontSize: "11px",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  #{seatNum}
                </div>

                {/* Nút Kick dành cho Host */}
                {isHost && playerOnSeat && !playerOnSeat.isHost && (
                  <button
                    onClick={() => handleKickPlayer(playerOnSeat.characterName)}
                    style={{
                      position: "absolute",
                      top: "6px",
                      right: "6px",
                      background: "rgba(239, 68, 68, 0.2)",
                      border: "none",
                      color: "#f87171",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Đuổi khỏi phòng"
                  >
                    ✕
                  </button>
                )}

                {playerOnSeat ? (
                  <>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: playerOnSeat.isHost
                          ? "linear-gradient(135deg, #eab308, #ca8a04)"
                          : "linear-gradient(135deg, #a855f7, #6366f1)",
                        margin: "4px auto 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                        border: "2px solid rgba(255, 255, 255, 0.2)",
                        position: "relative",
                      }}
                    >
                      {playerOnSeat.isHost ? "👑" : "👤"}
                    </div>

                    <div
                      style={{
                        fontWeight: "700",
                        fontSize: "13px",
                        color: isMe ? "#c084fc" : "#f8fafc",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: "6px",
                      }}
                    >
                      {playerOnSeat.characterName} {isMe && "(Bạn)"}
                    </div>

                    {/* Huy hiệu Sẵn sàng */}
                    <div
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "10px",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        background: playerOnSeat.isReady
                          ? "rgba(34, 197, 94, 0.2)"
                          : "rgba(148, 163, 184, 0.15)",
                        color: playerOnSeat.isReady ? "#4ade80" : "#94a3b8",
                        border: playerOnSeat.isReady
                          ? "1px solid rgba(34, 197, 94, 0.4)"
                          : "1px solid rgba(148, 163, 184, 0.2)",
                      }}
                    >
                      {playerOnSeat.isHost ? "Chủ Phòng" : playerOnSeat.isReady ? "✓ Sẵn Sàng" : "Chưa Sẵn Sàng"}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "16px 0", color: "#64748b", fontSize: "12px" }}>
                    <div style={{ fontSize: "20px", marginBottom: "4px", opacity: 0.5 }}>🪑</div>
                    Ghế trống
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Thanh Điều Khiển Dưới Cùng (Ready Check & Bắt Đầu) */}
      <div
        className="glass-panel"
        style={{
          padding: "20px 24px",
          borderRadius: "20px",
          border: "1px solid rgba(168, 85, 247, 0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc" }}>
            Trạng Thái Sẵn Sàng:{" "}
            <span style={{ color: canStartGame ? "#4ade80" : "#fde047" }}>
              {readyPlayersCount}/{totalPlayers} người chơi
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
            {totalPlayers < 5
              ? "Cần tối thiểu 5 người chơi để bắt đầu trận đấu."
              : !canStartGame
              ? "Đang chờ tất cả thành viên trong phòng bấm Sẵn sàng..."
              : "✅ Toàn bộ người chơi đã sẵn sàng! Chủ phòng có thể bắt đầu."}
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {/* Nút Sẵn Sàng dành cho thành viên (không phải Host) */}
          {!isHost && (
            <button
              onClick={handleToggleReady}
              className="btn"
              style={{
                padding: "14px 28px",
                fontSize: "15px",
                fontWeight: "800",
                borderRadius: "14px",
                border: "none",
                background: isUserReady
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "linear-gradient(135deg, #a855f7, #6366f1)",
                color: "#ffffff",
                boxShadow: isUserReady
                  ? "0 0 20px rgba(16, 185, 129, 0.4)"
                  : "0 0 20px rgba(168, 85, 247, 0.4)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {isUserReady ? "✓ ĐÃ SẴN SÀNG (Bấm để hủy)" : "⚡ BẤM SẴN SÀNG"}
            </button>
          )}

          {/* Nút Bắt Đầu Ván Đấu dành cho Host */}
          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={!canStartGame}
              className="btn"
              style={{
                padding: "14px 32px",
                fontSize: "15px",
                fontWeight: "800",
                borderRadius: "14px",
                border: "none",
                background: canStartGame
                  ? "linear-gradient(135deg, #eab308, #ca8a04)"
                  : "#334155",
                color: canStartGame ? "#0f172a" : "#94a3b8",
                boxShadow: canStartGame ? "0 0 25px rgba(234, 179, 8, 0.4)" : "none",
                cursor: canStartGame ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
              }}
            >
              🚀 BẮT ĐẦU VÁN ĐẤU
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
