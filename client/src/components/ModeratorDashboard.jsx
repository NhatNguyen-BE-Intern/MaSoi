"use client";

import React, { useState, useEffect } from "react";
import {
  GiDramaMasks,
  GiWolfHead,
  GiHeartBeats,
  GiDeathSkull,
  GiMoon,
  GiHourglass,
  GiChurch,
  GiSunrise,
  GiCardPlay,
} from "react-icons/gi";
import {
  RiVolumeUpFill,
  RiQuestionLine,
  RiRefreshLine,
  RiLogoutBoxRLine,
  RiCloseLine,
  RiPlayFill,
  RiPauseFill,
  RiRestartLine,
  RiCheckboxCircleLine,
  RiCheckboxBlankCircleLine,
} from "react-icons/ri";
import {
  playWolfHowl,
  playChurchBell,
  playMorningChime,
  playTimerAlarm,
  playDeathSound,
  playReviveSound,
} from "../lib/sound";

export default function ModeratorDashboard({
  moderatorData,
  roomCode,
  onTogglePlayerStatus,
  onPlayAgain,
  onLeaveRoom,
  onBroadcastSound,
  onStartTimer,
  activeTimer,
}) {
  const players = moderatorData?.players || [];
  const nightOrder = moderatorData?.nightOrder || [];
  const [completedSteps, setCompletedSteps] = useState({});
  const [selectedCardInfo, setSelectedCardInfo] = useState(null);

  // Timer local state for moderator
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTimerVal, setCurrentTimerVal] = useState(60);

  // Timer countdown tick
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && currentTimerVal > 0) {
      interval = setInterval(() => {
        setCurrentTimerVal((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            playTimerAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, currentTimerVal]);

  const toggleStep = (stepIdx) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepIdx]: !prev[stepIdx],
    }));
  };

  const resetNightSteps = () => {
    setCompletedSteps({});
  };

  const handleStartTimer = (seconds) => {
    setTimerSeconds(seconds);
    setCurrentTimerVal(seconds);
    setIsTimerRunning(true);
    if (onStartTimer) {
      onStartTimer({ roomCode, seconds, label: "Thảo luận ban ngày" });
    }
  };

  const handlePauseResumeTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setCurrentTimerVal(timerSeconds);
  };

  // Sound triggers
  const triggerSound = (type) => {
    if (type === "wolf") playWolfHowl();
    if (type === "bell") playChurchBell();
    if (type === "morning") playMorningChime();
    if (type === "death") playDeathSound();
    if (type === "revive") playReviveSound();

    // Broadcast sound to whole room via socket
    if (onBroadcastSound) {
      onBroadcastSound({ roomCode, soundType: type });
    }
  };

  const alivePlayers = players.filter((p) => p.isAlive);
  const deadPlayers = players.filter((p) => !p.isAlive);
  const wolfPlayers = players.filter(
    (p) => p.role && (p.role.team === "Sói" || p.role.name.includes("Sói")),
  );

  return (
    <div
      style={{
        maxWidth: "880px",
        margin: "0 auto",
        padding: "24px 16px",
      }}
    >
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "24px",
          marginBottom: "24px",
          background: "linear-gradient(135deg, rgba(30, 15, 25, 0.95), rgba(15, 20, 35, 0.95))",
          border: "1px solid rgba(236, 72, 153, 0.35)",
          boxShadow: "0 10px 30px rgba(236, 72, 153, 0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #ec4899, #be185d)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(236, 72, 153, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
              <GiDramaMasks size={28} color="#fff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: "rgba(236, 72, 153, 0.2)",
                  color: "#f472b6",
                  border: "1px solid rgba(236, 72, 153, 0.4)",
                  fontWeight: "700",
                }}
              >
                MASTER DASHBOARD
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                Phòng #{roomCode}
              </span>
            </div>
            <h2
              className="font-cinzel"
              style={{
                fontSize: "24px",
                fontWeight: "800",
                letterSpacing: "1px",
                color: "#fff",
                marginTop: "2px",
              }}
            >
              BẢNG ĐIỀU KHIỂN QUẢN TRÒ
            </h2>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: "flex", gap: "12px" }}>
          <div
            style={{
              padding: "8px 14px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "11px", color: "#10b981", display: "block" }}>
              Còn Sống
            </span>
            <strong style={{ fontSize: "18px", color: "#fff" }}>
              {alivePlayers.length}
            </strong>
          </div>

          <div
            style={{
              padding: "8px 14px",
              borderRadius: "10px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "11px", color: "#ef4444", display: "block" }}>
              Đã Chết
            </span>
            <strong style={{ fontSize: "18px", color: "#fff" }}>
              {deadPlayers.length}
            </strong>
          </div>

          <div
            style={{
              padding: "8px 14px",
              borderRadius: "10px",
              background: "rgba(244, 63, 94, 0.15)",
              border: "1px solid rgba(244, 63, 94, 0.4)",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "11px", color: "#ff4d6d", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              <GiWolfHead size={13} /> Sói
            </span>
            <strong style={{ fontSize: "18px", color: "#ff4d6d" }}>
              {wolfPlayers.length}
            </strong>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns on desktop (Cheat sheet & Night Order) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        {/* =========================================
            COLUMN 1: CHEAT SHEET (DANH SÁCH THÂN PHẬN)
            ========================================= */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
              borderBottom: "1px solid var(--border-glass)",
              paddingBottom: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <GiCardPlay size={18} color="var(--gold-accent)" />
              <h3 className="font-cinzel" style={{ fontSize: "16px", fontWeight: "700" }}>
                Thân Phận Người Chơi
              </h3>
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
              Bấm icon tim/đầu lâu để đổi Sống/Chết
            </span>
          </div>

          {/* Players list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {players.map((p) => {
              const roleObj =
                p.role?._doc && typeof p.role._doc === "object"
                  ? { ...p.role._doc, ...p.role }
                  : p.role || {};
              const roleName = roleObj.name || "Dân Làng";
              const roleTeam = roleObj.team || "Dân";

              const isWolfRole =
                roleTeam === "Sói" ||
                roleName.toLowerCase().includes("sói") ||
                roleName.toLowerCase().includes("wolf");
              const isSeerRole =
                roleName.toLowerCase().includes("tiên tri") ||
                roleName.toLowerCase().includes("seer");
              const isGuardRole =
                roleName.toLowerCase().includes("bảo vệ") ||
                roleName.toLowerCase().includes("guard");
              const isNeutralRole =
                roleTeam === "Trung lập" ||
                roleTeam === "Phe thứ 3" ||
                roleTeam.toLowerCase().includes("trung lập");

              const badgeColor = isWolfRole
                ? "var(--color-wolf)"
                : isSeerRole
                ? "var(--color-seer)"
                : isGuardRole
                ? "var(--color-guard)"
                : isNeutralRole
                ? "#a855f7"
                : "var(--color-villager)";

              return (
                <div
                  key={p.socketId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: p.isAlive
                      ? "rgba(255, 255, 255, 0.03)"
                      : "rgba(239, 68, 68, 0.08)",
                    border: `1px solid ${
                      p.isAlive ? "rgba(255, 255, 255, 0.06)" : "rgba(239, 68, 68, 0.25)"
                    }`,
                    opacity: p.isAlive ? 1 : 0.65,
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Player Name & Alive toggle */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      onClick={() =>
                        onTogglePlayerStatus({
                          roomCode,
                          targetSocketId: p.socketId,
                          targetCharacterName: p.characterName,
                        })
                      }
                      title={p.isAlive ? "Đánh dấu đã chết" : "Hồi sinh"}
                      style={{
                        background: p.isAlive
                          ? "rgba(16, 185, 129, 0.2)"
                          : "rgba(239, 68, 68, 0.25)",
                        border: `1px solid ${p.isAlive ? "#10b981" : "#ef4444"}`,
                        borderRadius: "8px",
                        padding: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {p.isAlive ? (
                        <GiHeartBeats size={16} color="#10b981" />
                      ) : (
                        <GiDeathSkull size={16} color="#ef4444" />
                      )}
                    </button>

                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          textDecoration: p.isAlive ? "none" : "line-through",
                          color: p.isAlive ? "var(--text-main)" : "var(--text-dim)",
                        }}
                      >
                        {p.characterName}
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                        {p.isAlive ? "Đang sống" : "Đã bị loại"}
                      </span>
                    </div>
                  </div>

                  {/* Role Name & Info Trigger */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => setSelectedCardInfo(roleObj)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        background: `${badgeColor}1c`,
                        border: `1px solid ${badgeColor}40`,
                        color: badgeColor,
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Xem chức năng lá bài này"
                    >
                      <span>{roleName}</span>
                      <RiQuestionLine size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================
            COLUMN 2: NIGHT ORDER SCRIPT (KỊCH BẢN ĐÊM)
            ========================================= */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
              borderBottom: "1px solid var(--border-glass)",
              paddingBottom: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <GiMoon size={18} color="#a855f7" />
              <h3 className="font-cinzel" style={{ fontSize: "16px", fontWeight: "700" }}>
                Kịch Bản Gọi Đêm
              </h3>
            </div>
            <button
              onClick={resetNightSteps}
              className="btn-secondary"
              style={{
                width: "auto",
                padding: "4px 10px",
                fontSize: "11px",
                borderRadius: "6px",
              }}
            >
              Reset Đêm Mới
            </button>
          </div>

          {/* Script Steps List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {nightOrder.map((stepItem, idx) => {
              const isChecked = !!completedSteps[idx];
              const isWolfStep = stepItem.team === "Sói";

              return (
                <div
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: isChecked
                      ? "rgba(16, 185, 129, 0.08)"
                      : "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${
                      isChecked
                        ? "rgba(16, 185, 129, 0.3)"
                        : "rgba(255, 255, 255, 0.08)"
                    }`,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {isChecked ? (
                        <RiCheckboxCircleLine size={18} color="#10b981" />
                      ) : (
                        <RiCheckboxBlankCircleLine size={18} color="var(--text-dim)" />
                      )}
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: isChecked ? "#10b981" : "#fff",
                        }}
                      >
                        {stepItem.title}
                      </h4>
                    </div>
                    {isWolfStep && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--color-wolf)",
                          fontWeight: 600,
                        }}
                      >
                        (Sói: {wolfPlayers.map((w) => w.characterName).join(", ")})
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "12px",
                      lineHeight: "1.4",
                      color: isChecked ? "var(--text-dim)" : "var(--text-muted)",
                      paddingLeft: "24px",
                    }}
                  >
                    {stepItem.instruction}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================
          ROW 2: DISCUSSION TIMER & SOUNDBOARD
          ========================================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        {/* Discussion Timer */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "14px",
              borderBottom: "1px solid var(--border-glass)",
              paddingBottom: "10px",
            }}
          >
            <GiHourglass size={18} color="var(--gold-accent)" />
            <h3 className="font-cinzel" style={{ fontSize: "16px", fontWeight: "700" }}>
              Đồng Hồ Thảo Luận Ban Ngày
            </h3>
          </div>

          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "44px",
                fontWeight: "900",
                fontFamily: "monospace",
                color: currentTimerVal <= 10 ? "#ef4444" : "var(--gold-accent)",
                textShadow: "0 0 20px rgba(212, 175, 55, 0.3)",
              }}
            >
              {Math.floor(currentTimerVal / 60)}:
              {String(currentTimerVal % 60).padStart(2, "0")}
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
              {isTimerRunning ? "Đang đếm ngược..." : "Tạm dừng"}
            </span>
          </div>

          {/* Quick preset buttons */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
            {[30, 60, 90, 120].map((sec) => (
              <button
                key={sec}
                onClick={() => handleStartTimer(sec)}
                className="btn-secondary"
                style={{
                  flex: 1,
                  padding: "8px 0",
                  fontSize: "12px",
                  borderRadius: "8px",
                }}
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* Play/Pause/Reset controls */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handlePauseResumeTimer}
              className="btn-secondary"
              style={{ flex: 1, padding: "10px", fontSize: "13px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              {isTimerRunning ? <RiPauseFill size={15} /> : <RiPlayFill size={15} />}
              <span>{isTimerRunning ? "Tạm dừng" : "Tiếp tục"}</span>
            </button>
            <button
              onClick={handleResetTimer}
              className="btn-secondary"
              style={{ flex: 1, padding: "10px", fontSize: "13px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <RiRestartLine size={15} />
              <span>Đặt lại</span>
            </button>
          </div>
        </div>

        {/* Soundboard */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "14px",
              borderBottom: "1px solid var(--border-glass)",
              paddingBottom: "10px",
            }}
          >
            <RiVolumeUpFill size={18} color="var(--gold-accent)" />
            <h3 className="font-cinzel" style={{ fontSize: "16px", fontWeight: "700" }}>
              Âm Thanh Hiệu Ứng (Soundboard)
            </h3>
          </div>

          <p style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "14px" }}>
            Bấm nút để phát âm thanh rùng rợn tăng kịch tính cho cả đám bạn:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button
              onClick={() => triggerSound("wolf")}
              className="btn-secondary"
              style={{
                padding: "12px",
                borderRadius: "10px",
                borderColor: "rgba(220, 38, 38, 0.4)",
                color: "#ff6b6b",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <GiWolfHead size={16} />
              <span>Sói Hú Đêm</span>
            </button>

            <button
              onClick={() => triggerSound("bell")}
              className="btn-secondary"
              style={{
                padding: "12px",
                borderRadius: "10px",
                borderColor: "rgba(212, 175, 55, 0.4)",
                color: "var(--gold-accent)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <GiChurch size={16} />
              <span>Chuông Đêm</span>
            </button>

            <button
              onClick={() => triggerSound("morning")}
              className="btn-secondary"
              style={{
                padding: "12px",
                borderRadius: "10px",
                borderColor: "rgba(16, 185, 129, 0.4)",
                color: "#10b981",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <GiSunrise size={16} />
              <span>Bình Minh</span>
            </button>

            <button
              onClick={() => triggerSound("death")}
              className="btn-secondary"
              style={{
                padding: "12px",
                borderRadius: "10px",
                borderColor: "rgba(239, 68, 68, 0.5)",
                color: "#ef4444",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <GiDeathSkull size={16} />
              <span>Tiếng Trừ Khử</span>
            </button>

            <button
              onClick={() => playTimerAlarm()}
              className="btn-secondary"
              style={{
                padding: "12px",
                borderRadius: "10px",
                borderColor: "rgba(245, 158, 11, 0.4)",
                color: "#fbbf24",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <GiHourglass size={16} />
              <span>Hết Giờ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Quick Card Info */}
      {selectedCardInfo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 110,
            backgroundColor: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setSelectedCardInfo(null)}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: "400px",
              width: "100%",
              padding: "24px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h3 className="font-cinzel" style={{ fontSize: "18px", color: "var(--gold-accent)" }}>
                {selectedCardInfo.name}
              </h3>
              <button
                onClick={() => setSelectedCardInfo(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <RiCloseLine size={20} />
              </button>
            </div>
            <div
              style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 600,
                background: "rgba(255, 255, 255, 0.1)",
                marginBottom: "12px",
              }}
            >
              Phe: {selectedCardInfo.team}
            </div>
            <p style={{ fontSize: "14px", lineHeight: "1.5", color: "var(--text-main)" }}>
              {selectedCardInfo.description}
            </p>
          </div>
        </div>
      )}

      {/* Action Footer Controls */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={onPlayAgain}
          className="btn-primary"
          style={{ width: "auto", padding: "14px 28px", fontSize: "15px" }}
        >
          <RiRefreshLine size={18} />
          <span>Bắt Đầu Ván Mới (Tất Cả Quay Về Phòng)</span>
        </button>

        <button
          onClick={onLeaveRoom}
          className="btn-secondary"
          style={{ width: "auto", padding: "14px 22px", color: "#ef4444" }}
        >
          <RiLogoutBoxRLine size={18} />
          <span>Rời Khỏi Phòng</span>
        </button>
      </div>
    </div>
  );
}
