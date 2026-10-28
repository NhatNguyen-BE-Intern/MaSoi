"use client";

import React from "react";

export default function ModeSelectionModal({ isOpen, onClose, onSelectMode }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.88)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
        animation: "fadeIn 0.25s ease-out",
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: "840px",
          width: "100%",
          padding: "36px 28px",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(168, 85, 247, 0.15)",
          textAlign: "center",
          position: "relative",
        }}
      >
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "18px",
              right: "20px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              color: "#94a3b8",
              fontSize: "20px",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            ✕
          </button>
        )}

        <div style={{ marginBottom: "28px" }}>
          <span
            style={{
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "3px",
              color: "#a855f7",
              fontWeight: "700",
              display: "inline-block",
              marginBottom: "8px",
            }}
          >
            Định Mệnh Làng Sói
          </span>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "900",
              color: "#f8fafc",
              letterSpacing: "-0.5px",
              margin: 0,
            }}
          >
            CHỌN HÌNH THỨC TRẢI NGHIỆM
          </h2>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "15px",
              marginTop: "8px",
              maxWidth: "520px",
              marginInline: "auto",
            }}
          >
            Bạn đang tụ họp ngoài đời cùng bạn bè hay muốn thi đấu online tự động hóa từ xa?
          </p>
        </div>

        {/* 2 Chế Độ Lớn */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
            textAlign: "left",
          }}
        >
          {/* Card 1: Chơi Ngoài Đời */}
          <div
            onClick={() => onSelectMode("offline")}
            className="mode-card"
            style={{
              padding: "28px 24px",
              borderRadius: "20px",
              background:
                "linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))",
              border: "1px solid rgba(234, 179, 8, 0.25)",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(234, 179, 8, 0.7)";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(234, 179, 8, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(234, 179, 8, 0.25)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "rgba(234, 179, 8, 0.15)",
                fontSize: "28px",
                marginBottom: "16px",
                border: "1px solid rgba(234, 179, 8, 0.3)",
              }}
            >
              🃏
            </div>
            <div
              style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: "20px",
                background: "rgba(34, 197, 94, 0.15)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                color: "#4ade80",
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "12px",
                float: "right",
              }}
            >
              Ổn định 100%
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "800",
                color: "#fde047",
                marginBottom: "8px",
              }}
            >
              Trợ Lý Quản Trò Ngoài Đời
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#cbd5e1",
                lineHeight: "1.6",
                marginBottom: "18px",
              }}
            >
              Dành cho nhóm bạn gặp mặt trực tiếp. Điện thoại đóng vai trò là thẻ bài Tarot 3D bí
              mật, Soundboard âm thanh (sói hú, chuông đêm) và Dashboard điều hành cho Quản trò.
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 20px 0",
                fontSize: "12px",
                color: "#94a3b8",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <li>✨ Thẻ bài 3D lật mở bảo mật chống soi</li>
              <li>🎙️ Kịch bản gọi đêm & Dashboard Quản trò</li>
              <li>🔔 Soundboard âm thanh đồng bộ toàn phòng</li>
            </ul>
            <button
              className="btn"
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, #eab308, #ca8a04)",
                color: "#0f172a",
                fontWeight: "800",
                fontSize: "14px",
                borderRadius: "12px",
                border: "none",
              }}
            >
              Vào Chơi Ngoài Đời →
            </button>
          </div>

          {/* Card 2: Chơi Online */}
          <div
            onClick={() => onSelectMode("online")}
            className="mode-card"
            style={{
              padding: "28px 24px",
              borderRadius: "20px",
              background:
                "linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.8)";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(168, 85, 247, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.3)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "rgba(168, 85, 247, 0.15)",
                fontSize: "28px",
                marginBottom: "16px",
                border: "1px solid rgba(168, 85, 247, 0.3)",
              }}
            >
              🌐
            </div>
            <div
              style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: "20px",
                background: "rgba(168, 85, 247, 0.15)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                color: "#c084fc",
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "12px",
                float: "right",
              }}
            >
              Tự Động Hóa 24/7
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "800",
                color: "#c084fc",
                marginBottom: "8px",
              }}
            >
              Chơi Online Từ Xa (Remote)
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#cbd5e1",
                lineHeight: "1.6",
                marginBottom: "18px",
              }}
            >
              Không cần Quản trò người thật! Máy chủ tự động hóa toàn bộ vòng lặp Ngày/Đêm, Ghép trận
              nhanh, Bàn tròn ảo đánh số ghế, Chat 4 kênh, Biện hộ và Treo cổ chuẩn thi đấu.
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 20px 0",
                fontSize: "12px",
                color: "#94a3b8",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <li>⚡ Ghép trận nhanh thông minh (Smart Quick Match)</li>
              <li>💬 Khung chat 4 kênh thời gian thực & Chat nhanh</li>
              <li>⚖️ Bầu cử, Biện hộ Spotlight & Luật hòa 2 vòng</li>
            </ul>
            <button
              className="btn"
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, #a855f7, #7e22ce)",
                color: "#ffffff",
                fontWeight: "800",
                fontSize: "14px",
                borderRadius: "12px",
                border: "none",
              }}
            >
              Vào Sảnh Online →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
