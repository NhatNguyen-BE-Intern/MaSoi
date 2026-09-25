"use client";

import React, { useState, useEffect } from "react";
import {
  GiCrown,
  GiDramaMasks,
  GiRollingDices,
  GiCampfire,
  GiCardDraw,
  GiHourglass,
} from "react-icons/gi";
import {
  RiFileCopyLine,
  RiCheckLine,
  RiGroupLine,
  RiSettings4Line,
  RiArrowLeftLine,
  RiEditLine,
  RiCloseLine,
} from "react-icons/ri";

export default function RoomLobby({
  roomCode,
  players,
  user,
  isHost,
  onStartGame,
  onLeaveRoom,
}) {
  const [copied, setCopied] = useState(false);
  const [moderatorMode, setModeratorMode] = useState("host"); // "none" | "host" | "select" | "random"
  const [selectedModeratorId, setSelectedModeratorId] = useState("");
  const [gameMode, setGameMode] = useState("random"); // "random" | "custom"
  const [allCards, setAllCards] = useState([]);
  const [customDeck, setCustomDeck] = useState({});

  const loadCardList = async () => {
    try {
      const res = await fetch("/api/cards");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setAllCards(data);
        const initDeck = {};
        data.forEach((c) => (initDeck[c._id] = 0));
        setCustomDeck(initDeck);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách bài:", err);
    }
  };

  useEffect(() => {
    if (isHost) {
      loadCardList();
    }
  }, [isHost]);

  const effectiveModeratorId =
    selectedModeratorId ||
    players.find((p) => !p.isHost)?.socketId ||
    players[0]?.socketId ||
    "";

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateCustomCount = (cardId, delta) => {
    setCustomDeck((prev) => {
      const current = prev[cardId] || 0;
      const nextVal = Math.max(0, current + delta);
      return { ...prev, [cardId]: nextVal };
    });
  };

  const totalCustomCards = Object.values(customDeck).reduce((a, b) => a + b, 0);

  // Compute how many players will receive cards (excluding moderator if any)
  const receivingPlayerCount =
    moderatorMode === "none" ? players.length : Math.max(0, players.length - 1);

  const handleStartClick = () => {
    if (players.length < 2 && moderatorMode !== "none") {
      return alert(
        "Cần ít nhất 2 người trong phòng để có 1 Quản trò và 1 người chơi nhận bài!",
      );
    }

    if (gameMode === "custom" && totalCustomCards !== receivingPlayerCount) {
      return alert(
        `Số lượng bài chọn (${totalCustomCards}) không khớp với số người nhận bài (${receivingPlayerCount})!`,
      );
    }

    onStartGame({
      roomCode,
      mode: gameMode,
      customDeck,
      moderatorMode,
      moderatorSocketId: effectiveModeratorId,
    });
  };

  return (
    <div
      style={{
        maxWidth: "680px",
        margin: "0 auto",
        padding: "24px 16px",
      }}
    >
      {/* Room Code Card */}
      <div
        className="glass-panel"
        style={{
          padding: "20px 24px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          background: "linear-gradient(135deg, rgba(20, 24, 38, 0.9), rgba(30, 20, 28, 0.9))",
          border: "1px solid rgba(220, 38, 38, 0.3)",
        }}
      >
        <div>
          <span style={{ fontSize: "12px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1px" }}>
            Mã Phòng Bí Mật
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "2px" }}>
            <h2
              className="font-cinzel"
              style={{
                fontSize: "32px",
                fontWeight: "900",
                color: "#ff6b6b",
                letterSpacing: "4px",
                textShadow: "0 0 16px rgba(220, 38, 38, 0.5)",
              }}
            >
              {roomCode}
            </h2>
            <button
              onClick={copyRoomCode}
              className="btn-secondary"
              title="Sao chép mã phòng"
              style={{
                width: "auto",
                padding: "8px 12px",
                fontSize: "12px",
                borderRadius: "8px",
              }}
            >
              {copied ? <RiCheckLine size={14} color="#10b981" /> : <RiFileCopyLine size={14} />}
              <span>{copied ? "Đã chép" : "Chép mã"}</span>
            </button>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Tổng người chơi</span>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--gold-accent)" }}>
            {players.length} người
          </div>
        </div>
      </div>

      {/* Players in Room */}
      <div className="glass-panel" style={{ padding: "20px", marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
            borderBottom: "1px solid var(--border-glass)",
            paddingBottom: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <RiGroupLine size={18} color="var(--gold-accent)" />
            <h3 className="font-cinzel" style={{ fontSize: "16px", fontWeight: "700" }}>
              Người Chơi Trong Phòng
            </h3>
          </div>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {players.length} đã tham gia
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            gap: "10px",
          }}
        >
          {players.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "20px",
                textAlign: "center",
                color: "var(--text-dim)",
                fontSize: "13px",
              }}
            >
              🔄 Đang đồng bộ danh sách người chơi...
            </div>
          ) : (
            players.map((p, idx) => (
              <div
                key={p.characterName || p.socketId || idx}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: p.isHost
                    ? "linear-gradient(135deg, #d4af37, #b45309)"
                    : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {p.isHost ? <GiCrown size={15} color="#fff" /> : p.characterName?.substring(0, 1).toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.characterName}
                </div>
                <div style={{ fontSize: "11px", color: p.isHost ? "var(--gold-accent)" : "var(--text-dim)" }}>
                  {p.isHost ? "Chủ phòng" : "Thành viên"}
                </div>
              </div>
            </div>
          )))}
        </div>
      </div>

      {/* Host Settings Section */}
      {isHost ? (
        <div
          className="glass-panel"
          style={{
            padding: "20px",
            marginBottom: "24px",
            border: "1px solid rgba(212, 175, 55, 0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
              borderBottom: "1px solid var(--border-glass)",
              paddingBottom: "10px",
            }}
          >
            <RiSettings4Line size={18} color="var(--gold-accent)" />
            <h3 className="font-cinzel" style={{ fontSize: "16px", fontWeight: "700" }}>
              Cài Đặt Ván Đấu (Chỉ Chủ Phòng)
            </h3>
          </div>

          {/* 1. Moderator Settings */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "700",
                color: "var(--gold-accent)",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <GiDramaMasks style={{ verticalAlign: "middle", marginRight: "6px", fontSize: "16px" }} />
              Chọn Quản Trò (Game Master)
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              {[
                { id: "host", label: "Host làm", icon: <GiCrown size={14} /> },
                { id: "select", label: "Chỉ định", icon: <GiDramaMasks size={14} /> },
                { id: "random", label: "Ngẫu nhiên", icon: <GiRollingDices size={14} /> },
                { id: "none", label: "Không có", icon: <RiCloseLine size={14} /> },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModeratorMode(m.id)}
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    border:
                      moderatorMode === m.id
                        ? "1px solid var(--gold-accent)"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    background:
                      moderatorMode === m.id
                        ? "rgba(212, 175, 55, 0.15)"
                        : "rgba(255, 255, 255, 0.02)",
                    color: moderatorMode === m.id ? "var(--gold-accent)" : "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Dropdown if "select" is picked */}
            {moderatorMode === "select" && (
              <div style={{ marginTop: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>
                  Chọn người làm Quản trò:
                </span>
                <select
                  className="game-input"
                  value={effectiveModeratorId}
                  onChange={(e) => setSelectedModeratorId(e.target.value)}
                  style={{ fontSize: "14px" }}
                >
                  {players.map((p) => (
                    <option key={p.socketId} value={p.socketId} style={{ background: "#0f131d" }}>
                      {p.characterName} {p.isHost ? "(Host)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <p style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "6px" }}>
              {moderatorMode !== "none"
                ? `⚡ Người làm Quản trò sẽ có màn hình Dashboard riêng để xem ai giữ bài gì và điều hành ván đấu ngoài đời!`
                : `Tất cả mọi người trong phòng đều nhận bài thông thường.`}
            </p>
          </div>

          {/* 2. Card Distribution Mode */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "700",
                color: "var(--gold-accent)",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <GiCardDraw style={{ verticalAlign: "middle", marginRight: "6px", fontSize: "16px" }} />
              Chế Độ Chia Bài
            </label>
            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              <button
                type="button"
                onClick={() => setGameMode("random")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  border:
                    gameMode === "random"
                      ? "1px solid var(--color-villager)"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                  background:
                    gameMode === "random"
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(255, 255, 255, 0.02)",
                  color: gameMode === "random" ? "var(--color-villager)" : "var(--text-muted)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <GiRollingDices size={16} />
                <span>Máy Tự Cân Bằng</span>
              </button>
              <button
                type="button"
                onClick={() => setGameMode("custom")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  border:
                    gameMode === "custom"
                      ? "1px solid var(--color-seer)"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                  background:
                    gameMode === "custom"
                      ? "rgba(168, 85, 247, 0.15)"
                      : "rgba(255, 255, 255, 0.02)",
                  color: gameMode === "custom" ? "var(--color-seer)" : "var(--text-muted)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <RiEditLine size={16} />
                <span>Tự Chọn Bài</span>
              </button>
            </div>

            {/* Custom Deck Configuration */}
            {gameMode === "custom" && (
              <div
                style={{
                  background: "rgba(10, 14, 23, 0.6)",
                  borderRadius: "12px",
                  padding: "14px",
                  border: "1px solid var(--border-glass)",
                  maxHeight: "220px",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "10px",
                    color: totalCustomCards === receivingPlayerCount ? "#10b981" : "#ef4444",
                  }}
                >
                  <span>Tổng số lá đã chọn: {totalCustomCards}</span>
                  <span>Cần chính xác: {receivingPlayerCount} lá</span>
                </div>

                {allCards.map((card) => {
                  const count = customDeck[card._id] || 0;
                  return (
                    <div
                      key={card._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <span style={{ fontSize: "14px", fontWeight: 500 }}>
                        {card.name}{" "}
                        <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                          ({card.team})
                        </span>
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => updateCustomCount(card._id, -1)}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "6px",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            background: "rgba(255, 255, 255, 0.05)",
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          -
                        </button>
                        <span style={{ width: "20px", textAlign: "center", fontWeight: 700 }}>
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCustomCount(card._id, 1)}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "6px",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            background: "rgba(255, 255, 255, 0.05)",
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Waiting Message for Non-host */
        <div
          className="glass-panel"
          style={{
            padding: "20px",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          <div className="floating-element" style={{ color: "var(--gold-accent)", marginBottom: "8px", display: "inline-block" }}>
            <GiHourglass size={36} />
          </div>
          <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-main)" }}>
            Đang chờ Chủ phòng bắt đầu game...
          </h4>
          <p style={{ fontSize: "13px", color: "var(--text-dim)", marginTop: "4px" }}>
            Khi bắt đầu, bạn sẽ nhận được lá bài bí mật được úp sẵn trên màn hình!
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {isHost && (
          <button
            onClick={handleStartClick}
            className="btn-primary"
            style={{
              padding: "16px 24px",
              fontSize: "17px",
              boxShadow: "0 10px 30px rgba(220, 38, 38, 0.6)",
            }}
          >
            <GiCampfire size={22} />
            <span>
              Bắt Đầu Chia Bài ({receivingPlayerCount} người
              {moderatorMode !== "none" ? " + 1 Quản trò" : ""})
            </span>
          </button>
        )}

        <button
          onClick={onLeaveRoom}
          className="btn-secondary"
          style={{ padding: "12px", color: "#ef4444" }}
        >
          <RiArrowLeftLine size={18} />
          <span>Rời Khỏi Phòng</span>
        </button>
      </div>
    </div>
  );
}
