"use client";

import React, { useState } from "react";
import { GiWolfHead, GiSpellBook } from "react-icons/gi";
import {
  RiVolumeUpFill,
  RiVolumeMuteFill,
  RiGroupLine,
  RiLogoutBoxRLine,
  RiCloseLine,
} from "react-icons/ri";

export default function Navbar({
  user,
  onLogout,
  onOpenFriends,
  onOpenDictionary,
  isConnected,
  currentRoomCode,
  onLeaveRoom,
}) {
  const [muted, setMuted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("masoi_sound_muted") === "true";
    }
    return false;
  });

  const toggleSound = () => {
    const nextVal = !muted;
    setMuted(nextVal);
    localStorage.setItem("masoi_sound_muted", String(nextVal));
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(11, 14, 23, 0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-glass)",
        padding: "12px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo / Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #b91c1c, #450a0a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255, 100, 100, 0.4)",
              boxShadow: "0 0 15px rgba(220, 38, 38, 0.4)",
            }}
          >
            <GiWolfHead size={22} color="#fecaca" />
          </div>
          <div>
            <h1
              className="font-cinzel"
              style={{
                fontSize: "18px",
                fontWeight: "800",
                letterSpacing: "1px",
                background: "linear-gradient(to right, #ffffff, #cbd5e1)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: "1.1",
              }}
            >
              LÀNG MA SÓI
            </h1>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-dim)",
                letterSpacing: "0.5px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: isConnected ? "#10b981" : "#ef4444",
                  boxShadow: isConnected ? "0 0 6px #10b981" : "none",
                  display: "inline-block",
                }}
              />
              {isConnected ? "Máy chủ online" : "Mất kết nối"}
            </span>
          </div>
        </div>

        {/* Room badge if in room */}
        {currentRoomCode && (
          <div
            style={{
              background: "rgba(220, 38, 38, 0.15)",
              border: "1px solid rgba(220, 38, 38, 0.4)",
              padding: "4px 12px",
              borderRadius: "999px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>Phòng:</span>
            <span
              style={{
                color: "#ff6b6b",
                fontFamily: "monospace",
                letterSpacing: "1.5px",
                fontSize: "15px",
              }}
            >
              #{currentRoomCode}
            </span>
            <button
              onClick={onLeaveRoom}
              title="Rời phòng"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "2px",
                marginLeft: "4px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <RiCloseLine size={16} />
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {user && (
            <>
              <button
                onClick={onOpenFriends}
                className="btn-secondary"
                title="Danh sách bạn bè"
                style={{
                  width: "auto",
                  padding: "8px 12px",
                  fontSize: "13px",
                  borderRadius: "10px",
                }}
              >
                <RiGroupLine size={16} />
                <span style={{ display: "none" }} className="sm-inline">
                  Bạn bè
                </span>
              </button>

              <button
                onClick={onOpenDictionary}
                className="btn-secondary"
                title="Từ điển bài"
                style={{
                  width: "auto",
                  padding: "8px 12px",
                  fontSize: "13px",
                  borderRadius: "10px",
                }}
              >
                <GiSpellBook size={16} />
                <span style={{ display: "none" }} className="sm-inline">
                  Từ điển
                </span>
              </button>
            </>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="btn-secondary"
            title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
            style={{
              width: "auto",
              padding: "8px 10px",
              borderRadius: "10px",
            }}
          >
            {muted ? <RiVolumeMuteFill size={16} color="#ef4444" /> : <RiVolumeUpFill size={16} color="#10b981" />}
          </button>

          {/* User profile & logout */}
          {user && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                paddingLeft: "6px",
                borderLeft: "1px solid var(--border-glass)",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 700,
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
                title={user.characterName || user.username}
              >
                {(user.characterName || user.username || "U").substring(0, 1).toUpperCase()}
              </div>
              <button
                onClick={onLogout}
                className="btn-secondary"
                title="Đăng xuất"
                style={{
                  width: "auto",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  color: "#ef4444",
                }}
              >
                <RiLogoutBoxRLine size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
