"use client";

import React, { useState, useEffect } from "react";
import { GiSpellBook, GiWolfHead, GiFarmer, GiDramaMasks } from "react-icons/gi";
import { RiCloseLine } from "react-icons/ri";

export default function CardDictionaryModal({ isOpen, onClose }) {
  const [cards, setCards] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);

  const loadCards = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cards");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCards(data);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách bài:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCards();
    }
  }, [isOpen]);

  const getRoleImage = (cardName) => {
    if (!cardName) return "/cards/villager.jpg";
    const lower = cardName.toLowerCase();
    if (lower.includes("sói") || lower.includes("wolf")) return "/cards/werewolf.jpg";
    if (lower.includes("tiên tri") || lower.includes("seer")) return "/cards/seer.jpg";
    if (lower.includes("bảo vệ") || lower.includes("guard")) return "/cards/guard.jpg";
    if (lower.includes("quản trò")) return "/cards/moderator.jpg";
    return "/cards/villager.jpg";
  };

  const filteredCards = cards.filter((card) => {
    if (activeTab === "all") return true;
    if (activeTab === "wolf") return card.team === "Sói" || card.name.includes("Sói");
    if (activeTab === "villager") return card.team === "Dân";
    if (activeTab === "neutral") return card.team !== "Sói" && card.team !== "Dân";
    return true;
  });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "680px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          position: "relative",
          animation: "fadeIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
            borderBottom: "1px solid var(--border-glass)",
            paddingBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <GiSpellBook size={24} color="var(--gold-accent)" />
            <div>
              <h3 className="font-cinzel" style={{ fontSize: "18px", fontWeight: "700" }}>
                Từ Điển Thẻ Bài Ma Sói
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                Tra cứu luật & chức năng các vai trò trong ván đấu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
            overflowX: "auto",
            paddingBottom: "4px",
          }}
        >
          {[
            { id: "all", label: "Tất cả", icon: null, color: "var(--text-main)" },
            { id: "wolf", label: "Phe Ma Sói", icon: GiWolfHead, color: "var(--color-wolf)" },
            { id: "villager", label: "Phe Dân Làng", icon: GiFarmer, color: "var(--color-villager)" },
            { id: "neutral", label: "Phe Thứ Ba", icon: GiDramaMasks, color: "var(--color-seer)" },
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: activeTab === tab.id ? `1px solid ${tab.color}` : "1px solid transparent",
                  background:
                    activeTab === tab.id
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(255, 255, 255, 0.02)",
                  color: activeTab === tab.id ? tab.color : "var(--text-muted)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {TabIcon && <TabIcon size={16} />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Cards Grid */}
        <div
          style={{
            overflowY: "auto",
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "14px",
            paddingRight: "4px",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)", gridColumn: "1/-1" }}>
              Đang tải danh sách thẻ bài...
            </div>
          ) : filteredCards.length > 0 ? (
            filteredCards.map((card, idx) => {
              const isWolf = card.team === "Sói" || card.name.includes("Sói");
              const isSeer = card.name.includes("Tiên Tri");
              const isGuard = card.name.includes("Bảo Vệ");
              const accentColor = isWolf
                ? "var(--color-wolf)"
                : isSeer
                ? "var(--color-seer)"
                : isGuard
                ? "var(--color-guard)"
                : "var(--color-villager)";

              return (
                <div
                  key={card._id || idx}
                  style={{
                    background: "rgba(14, 18, 28, 0.8)",
                    border: `1px solid rgba(255, 255, 255, 0.08)`,
                    borderLeft: `4px solid ${accentColor}`,
                    borderRadius: "12px",
                    padding: "14px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <img
                    src={getRoleImage(card.name)}
                    alt={card.name}
                    style={{
                      width: "60px",
                      height: "85px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <h4
                        className="font-cinzel"
                        style={{
                          fontSize: "15px",
                          fontWeight: "700",
                          color: accentColor,
                        }}
                      >
                        {card.name}
                      </h4>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          background: `${accentColor}18`,
                          color: accentColor,
                          border: `1px solid ${accentColor}33`,
                          fontWeight: 600,
                        }}
                      >
                        Phe {card.team}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        lineHeight: "1.45",
                        color: "var(--text-muted)",
                      }}
                    >
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)", gridColumn: "1/-1" }}>
              Không có thẻ bài nào trong danh mục này.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
