"use client";

import React, { useState } from "react";
import { GiCrown, GiCardDraw, GiSpellBook, GiMoon } from "react-icons/gi";
import { RiLoginBoxLine, RiGroupLine } from "react-icons/ri";

export default function LobbySection({
  user,
  onCreateRoom,
  onJoinRoom,
  onOpenFriends,
  onOpenDictionary,
}) {
  const [joinCode, setJoinCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return alert("Vui lòng nhập mã phòng!");
    onJoinRoom(joinCode.trim());
  };

  return (
    <div
      style={{
        maxWidth: "760px",
        margin: "0 auto",
        padding: "32px 16px",
      }}
    >
      {/* Welcome Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "30px 24px",
          marginBottom: "28px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-30px",
            right: "-30px",
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(220, 38, 38, 0.2), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "999px",
            background: "rgba(212, 175, 55, 0.12)",
            border: "1px solid rgba(212, 175, 55, 0.3)",
            color: "var(--gold-accent)",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "12px",
          }}
        >
          <GiMoon size={15} />
          Trợ Lý Boardgame Offline
        </div>

        <h2
          className="font-cinzel"
          style={{
            fontSize: "28px",
            fontWeight: "800",
            marginBottom: "8px",
            letterSpacing: "1px",
          }}
        >
          Chào mừng,{" "}
          <span style={{ color: "#ff6b6b" }}>{user?.characterName || user?.username}</span>!
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "15px", maxWidth: "520px", margin: "0 auto" }}>
          Tụ tập bạn bè, tạo phòng để chia bài bí mật trên điện thoại và điều hành trận đấu chuyên nghiệp không cần bộ bài giấy!
        </p>
      </div>

      {/* Main Action Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "18px",
          marginBottom: "28px",
        }}
      >
        {/* Create Room Card */}
        <div
          className="glass-panel"
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "1px solid rgba(220, 38, 38, 0.25)",
            background: "linear-gradient(180deg, rgba(28, 20, 26, 0.8) 0%, rgba(15, 18, 28, 0.8) 100%)",
          }}
        >
          <div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #dc2626, #7f1d1d)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                boxShadow: "0 8px 20px rgba(220, 38, 38, 0.4)",
              }}
            >
              <GiCrown size={26} color="#fff" />
            </div>
            <h3 className="font-cinzel" style={{ fontSize: "19px", fontWeight: "700", marginBottom: "6px" }}>
              Tạo Phòng Mới
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.4", marginBottom: "20px" }}>
              Trở thành Chủ phòng, chọn hoặc ngẫu nhiên Quản trò, tùy biến bộ bài theo ý muốn.
            </p>
          </div>
          <button onClick={onCreateRoom} className="btn-primary">
            <GiCardDraw size={20} />
            <span>Tạo Phòng Ngay</span>
          </button>
        </div>

        {/* Join Room Card */}
        <div
          className="glass-panel"
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "linear-gradient(180deg, rgba(20, 28, 38, 0.8) 0%, rgba(15, 18, 28, 0.8) 100%)",
          }}
        >
          <div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #2563eb, #1e3a8a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                boxShadow: "0 8px 20px rgba(37, 99, 235, 0.35)",
              }}
            >
              <RiLoginBoxLine size={24} color="#fff" />
            </div>
            <h3 className="font-cinzel" style={{ fontSize: "19px", fontWeight: "700", marginBottom: "6px" }}>
              Vào Phòng Có Sẵn
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.4", marginBottom: "20px" }}>
              Nhập mã phòng 4 chữ số do bạn bè chia sẻ để tham gia nhận bài.
            </p>
          </div>

          {!showJoinInput ? (
            <button
              onClick={() => setShowJoinInput(true)}
              className="btn-secondary"
              style={{ padding: "14px", fontSize: "15px" }}
            >
              <RiLoginBoxLine size={18} />
              <span>Nhập Mã Phòng</span>
            </button>
          ) : (
            <form onSubmit={handleJoinSubmit} style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                maxLength={4}
                className="game-input"
                placeholder="Mã (VD: 1234)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                style={{ textAlign: "center", fontSize: "16px", fontWeight: "700", letterSpacing: "2px" }}
                autoFocus
              />
              <button
                type="submit"
                className="btn-primary"
                style={{ width: "auto", padding: "12px 18px", whiteSpace: "nowrap" }}
              >
                Vào
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Secondary Quick Links */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        <button
          onClick={onOpenFriends}
          className="glass-panel"
          style={{
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            border: "1px solid var(--border-glass)",
            color: "var(--text-main)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div
            style={{
              padding: "10px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RiGroupLine size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: "14px", fontWeight: "600" }}>Bạn Bè Của Bạn</h4>
            <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Kết bạn & theo dõi</span>
          </div>
        </button>

        <button
          onClick={onOpenDictionary}
          className="glass-panel"
          style={{
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            border: "1px solid var(--border-glass)",
            color: "var(--text-main)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div
            style={{
              padding: "10px",
              borderRadius: "10px",
              background: "rgba(168, 85, 247, 0.15)",
              color: "#a855f7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GiSpellBook size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: "14px", fontWeight: "600" }}>Từ Điển Thẻ Bài</h4>
            <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Luật & chức năng các lá</span>
          </div>
        </button>
      </div>
    </div>
  );
}
