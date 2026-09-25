"use client";

import React, { useState } from "react";
import {
  GiHourglass,
  GiCardPlay,
  GiDramaMasks,
  GiDeathSkull,
  GiHeartBeats,
} from "react-icons/gi";
import {
  RiEyeLine,
  RiEyeCloseLine,
  RiRefreshLine,
  RiLogoutBoxRLine,
} from "react-icons/ri";
import { playCardFlip } from "../lib/sound";

export default function PlayerCardView({
  role,
  roomCode,
  isHost,
  onPlayAgain,
  onLeaveRoom,
  activeTimer,
  isAlive = true,
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const playerAlive = role?.isAlive !== undefined ? role.isAlive : isAlive;

  // Play flip sound whenever flipped
  const handleToggleFlip = () => {
    setIsFlipped((prev) => !prev);
    playCardFlip();
  };

  const getCardImage = () => {
    if (!role?.name) return "/cards/villager.jpg";
    const name = role.name.toLowerCase();
    if (name.includes("sói") || name.includes("wolf")) return "/cards/werewolf.jpg";
    if (name.includes("tiên tri") || name.includes("seer")) return "/cards/seer.jpg";
    if (name.includes("bảo vệ") || name.includes("guard")) return "/cards/guard.jpg";
    return "/cards/villager.jpg";
  };

  const isWolf = role?.team === "Sói" || role?.name?.includes("Sói");
  const isSeer = role?.name?.includes("Tiên Tri");
  const isGuard = role?.name?.includes("Bảo Vệ");

  const teamClass = isWolf
    ? "team-soi"
    : isSeer
    ? "team-seer"
    : isGuard
    ? "team-guard"
    : "team-dan";

  const teamColor = isWolf
    ? "var(--color-wolf)"
    : isSeer
    ? "var(--color-seer)"
    : isGuard
    ? "var(--color-guard)"
    : "var(--color-villager)";

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        padding: "20px 16px",
        textAlign: "center",
      }}
    >
      {/* Discussion Timer Banner (if active) */}
      {activeTimer && activeTimer.remaining > 0 && (
        <div
          className="glass-panel"
          style={{
            padding: "10px 18px",
            marginBottom: "16px",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            border: "1px solid rgba(245, 158, 11, 0.4)",
            background: "rgba(245, 158, 11, 0.12)",
          }}
        >
          <GiHourglass size={18} color="var(--gold-accent)" />
          <span style={{ fontSize: "14px", fontWeight: "600" }}>
            {activeTimer.label || "Thời gian thảo luận"}:
          </span>
          <span
            style={{
              fontSize: "18px",
              fontWeight: "900",
              color: "#ffdd57",
              fontFamily: "monospace",
            }}
          >
            {activeTimer.remaining}s
          </span>
        </div>
      )}

      {/* Alive / Dead Banner (MAX UX) */}
      {!playerAlive ? (
        <div
          className="glass-panel"
          style={{
            padding: "14px 18px",
            marginBottom: "16px",
            background: "linear-gradient(135deg, rgba(220, 38, 38, 0.28), rgba(20, 10, 15, 0.95))",
            border: "1px solid rgba(239, 68, 68, 0.6)",
            boxShadow: "0 0 25px rgba(239, 68, 68, 0.35)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              color: "#f87171",
              fontWeight: "800",
              fontSize: "15px",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            <GiDeathSkull size={22} color="#ef4444" />
            <span>BẠN ĐÃ BỊ LOẠI (HỒN MA)</span>
          </div>
          <p style={{ fontSize: "12px", color: "#e2e8f0", marginTop: "6px", lineHeight: "1.4" }}>
            Bạn đã hy sinh đêm qua! Hãy giữ im lặng tuyệt đối, không được tiết lộ thân phận hay can thiệp vào cuộc thảo luận của người còn sống.
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: "10px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 14px",
              borderRadius: "999px",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              color: "#34d399",
              fontSize: "12px",
              fontWeight: "700",
            }}
          >
            <GiHeartBeats size={14} color="#10b981" /> ĐANG CÒN SỐNG
          </span>
        </div>
      )}

      {/* Header Info */}
      <div style={{ marginBottom: "16px" }}>
        <h2
          className="font-cinzel"
          style={{
            fontSize: "22px",
            fontWeight: "800",
            letterSpacing: "1px",
            color: "#fff",
            marginBottom: "4px",
          }}
        >
          LÁ BÀI THÂN PHẬN
        </h2>
        {role?.moderatorName ? (
          <p style={{ fontSize: "13px", color: "var(--gold-accent)" }}>
            <GiDramaMasks style={{ verticalAlign: "middle", marginRight: "4px", fontSize: "15px" }} />
            Quản trò ván đấu: <strong>{role.moderatorName}</strong>
          </p>
        ) : (
          <p style={{ fontSize: "13px", color: "var(--text-dim)" }}>
            Bấm vào lá bài hoặc nút bên dưới để lật mở
          </p>
        )}
      </div>

      {/* 3D FLIP CARD SCENE */}
      <div
        className="card-scene"
        onClick={handleToggleFlip}
        title="Nhấp để lật bài / úp lại"
      >
        <div className={`card-object ${isFlipped ? "is-flipped" : ""}`}>
          {/* Card Back (Face Down by Default) */}
          <div className="card-face card-face-back">
            <img
              src="/cards/card_back.jpg"
              alt="Mặt lưng lá bài ma sói"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                left: "0",
                right: "0",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  background: "rgba(0, 0, 0, 0.75)",
                  backdropFilter: "blur(6px)",
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  color: "var(--gold-accent)",
                  border: "1px solid rgba(212, 175, 55, 0.4)",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <RiEyeLine size={14} /> Chạm để mở bài
              </span>
            </div>
          </div>

          {/* Card Front (Revealed Face) */}
          <div className={`card-face card-face-front ${teamClass}`}>
            {/* Card Illustration */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "60%",
                overflow: "hidden",
                borderBottom: `2px solid ${teamColor}`,
              }}
            >
              <img
                src={getCardImage()}
                alt={role?.name || "Lá bài"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: !playerAlive ? "grayscale(70%) brightness(0.75)" : "none",
                  transition: "filter 0.3s ease",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: !playerAlive ? "#1e293bee" : `${teamColor}ee`,
                  color: !playerAlive ? "#ef4444" : "#000",
                  border: !playerAlive ? "1px solid #ef4444" : "none",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {!playerAlive ? "💀 Hồn Ma" : `Phe ${role?.team || "Dân"}`}
              </div>
            </div>

            {/* Card Content & Description */}
            <div
              style={{
                padding: "16px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background: "linear-gradient(180deg, rgba(14, 18, 28, 0.95) 0%, #06080d 100%)",
                textAlign: "center",
              }}
            >
              <div>
                <h3
                  className="font-cinzel"
                  style={{
                    fontSize: "20px",
                    fontWeight: "900",
                    color: teamColor,
                    marginBottom: "8px",
                  }}
                >
                  {role?.name || "Dân Làng"}
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: "1.45",
                    color: "#cbd5e1",
                    maxHeight: "90px",
                    overflowY: "auto",
                  }}
                >
                  {role?.description || "Không có mô tả chức năng."}
                </p>
              </div>

              <div style={{ marginTop: "8px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <RiEyeCloseLine size={12} /> Chạm thẻ để úp lại
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons for Privacy */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "20px",
          justifyContent: "center",
        }}
      >
        <button
          onClick={handleToggleFlip}
          className="btn-secondary"
          style={{ width: "auto", padding: "10px 18px", fontSize: "14px" }}
        >
          {isFlipped ? (
            <>
              <RiEyeCloseLine size={16} color="#ef4444" />
              <span>Úp bài lại ngay</span>
            </>
          ) : (
            <>
              <RiEyeLine size={16} color="#10b981" />
              <span>Lật mở lá bài</span>
            </>
          )}
        </button>

        {/* Hold to Peek Button */}
        <button
          onMouseDown={() => {
            setIsFlipped(true);
            playCardFlip();
          }}
          onMouseUp={() => {
            setIsFlipped(false);
            playCardFlip();
          }}
          onTouchStart={() => {
            setIsFlipped(true);
            playCardFlip();
          }}
          onTouchEnd={() => {
            setIsFlipped(false);
            playCardFlip();
          }}
          className="btn-secondary"
          style={{
            width: "auto",
            padding: "10px 18px",
            fontSize: "14px",
            borderColor: "rgba(212, 175, 55, 0.4)",
            color: "var(--gold-accent)",
          }}
        >
          <GiCardPlay size={16} />
          <span>Giữ để xem nhanh</span>
        </button>
      </div>

      <p style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "14px" }}>
        Hãy giữ bí mật thân phận với bạn bè ngồi cùng bàn!
      </p>

      {/* Host Controls */}
      <div
        style={{
          marginTop: "28px",
          paddingTop: "16px",
          borderTop: "1px solid var(--border-glass)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {isHost && (
          <button onClick={onPlayAgain} className="btn-primary" style={{ padding: "14px" }}>
            <RiRefreshLine size={18} />
            <span>Chơi Ván Mới (Tất Cả Quay Về Phòng)</span>
          </button>
        )}

        <button
          onClick={onLeaveRoom}
          className="btn-secondary"
          style={{ padding: "10px", color: "#ef4444" }}
        >
          <RiLogoutBoxRLine size={16} />
          <span>Rời Khỏi Phòng</span>
        </button>
      </div>
    </div>
  );
}
