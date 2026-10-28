"use client";

import React, { useEffect, useState } from "react";
import { getSocket } from "../../lib/socket";

/**
 * MODAL CÁO PHÓ BÌNH MINH (DEATH ANNOUNCEMENT MODAL)
 * Hiển thị danh sách nạn nhân tử nạn đêm qua kèm nguyên nhân và lá bài (nếu mở bài).
 */
export default function DeathAnnouncementModal({
  isOpen,
  onClose,
  data = null,
}) {
  const [timeLeft, setTimeLeft] = useState(() => data?.duration || 10);

  useEffect(() => {
    if (!isOpen) return;
    const initialTime = data?.duration || 10;
    queueMicrotask(() => {
      setTimeLeft(initialTime);
    });

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onClose) onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, data?.dayNumber, data?.duration, onClose]);

  if (!isOpen || !data) return null;

  const deaths = data.deaths || [];
  const hasDeaths = deaths.length > 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 7, 15, 0.88)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 950,
        padding: "16px",
        animation: "fadeIn 0.3s ease",
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "28px 24px",
          textAlign: "center",
          borderRadius: "24px",
          border: `2px solid ${hasDeaths ? "#ef4444" : "#10b981"}`,
          boxShadow: `0 0 40px ${hasDeaths ? "rgba(239, 68, 68, 0.35)" : "rgba(16, 185, 129, 0.35)"}`,
        }}
      >
        {/* Biểu tượng mặt trời / đầu lâu */}
        <div style={{ fontSize: "56px", marginBottom: "8px" }}>
          {hasDeaths ? "⚰️" : "☀️"}
        </div>

        <h2
          style={{
            fontSize: "22px",
            fontWeight: "900",
            color: hasDeaths ? "#f87171" : "#34d399",
            margin: "0 0 6px 0",
          }}
        >
          {hasDeaths
            ? `Cáo Phó Ngày Thứ ${data.dayNumber || 1}`
            : `Bình Minh Yên Ả Ngày Thứ ${data.dayNumber || 1}`}
        </h2>

        <p
          style={{
            fontSize: "14px",
            color: "#cbd5e1",
            margin: "0 0 20px 0",
            lineHeight: "1.5",
          }}
        >
          {hasDeaths
            ? "Màn đêm kinh hoàng đã cướp đi sinh mệnh của những người dân làng sau đây:"
            : "Ánh mặt trời ấm áp chiếu rọi, đêm qua không có bất kỳ ai tử nạn!"}
        </p>

        {/* Danh sách người tử nạn */}
        {hasDeaths && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "20px",
              maxHeight: "260px",
              overflowY: "auto",
            }}
          >
            {deaths.map((victim, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px 16px",
                  borderRadius: "14px",
                  backgroundColor: "rgba(30, 41, 59, 0.75)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "800",
                      color: "#f1f5f9",
                    }}
                  >
                    💀 {victim.characterName}
                  </div>
                  <div style={{ fontSize: "12px", color: "#fca5a5" }}>
                    {victim.cause || "Tử nạn trong đêm"}
                  </div>
                </div>

                {/* Thân phận (Mở bài vs Giấu bài) */}
                <div>
                  {victim.role ? (
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        padding: "4px 10px",
                        borderRadius: "10px",
                        backgroundColor:
                          victim.role.team === "Sói"
                            ? "rgba(239, 68, 68, 0.25)"
                            : "rgba(56, 189, 248, 0.25)",
                        color:
                          victim.role.team === "Sói" ? "#f87171" : "#38bdf8",
                        border: `1px solid ${
                          victim.role.team === "Sói" ? "#ef4444" : "#38bdf8"
                        }`,
                      }}
                    >
                      {victim.role.name}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                        fontStyle: "italic",
                      }}
                    >
                      🎭 Ẩn Thân Phận
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px" }}>
          <button
            className="btn btn-primary"
            onClick={onClose}
            style={{
              padding: "10px 24px",
              fontWeight: "700",
              fontSize: "14px",
            }}
          >
            Đã Rõ ({timeLeft}s)
          </button>
        </div>
      </div>
    </div>
  );
}
