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

  const getRoleImage = (cardName, team) => {
    if (!cardName) return "/cards/villager.jpg";
    const lower = cardName.toLowerCase();
    const teamLower = (team || "").toLowerCase();

    if (lower.includes("sói") || lower.includes("wolf") || teamLower.includes("sói")) {
      return "/cards/werewolf.jpg";
    }
    if (lower.includes("tiên tri") || lower.includes("seer")) {
      return "/cards/seer.jpg";
    }
    if (lower.includes("bảo vệ") || lower.includes("guard") || lower.includes("hiệp sĩ")) {
      return "/cards/guard.jpg";
    }
    if (
      lower.includes("phù thủy") ||
      lower.includes("witch") ||
      lower.includes("thầy tu") ||
      lower.includes("pháp sư")
    ) {
      return "/cards/witch.jpg";
    }
    if (
      lower.includes("thợ săn") ||
      lower.includes("hunter") ||
      lower.includes("sát thủ") ||
      lower.includes("báo thù") ||
      lower.includes("độc hành") ||
      lower.includes("bóng đêm")
    ) {
      return "/cards/hunter.jpg";
    }
    if (lower.includes("quản trò") || lower.includes("moderator")) {
      return "/cards/moderator.jpg";
    }
    if (teamLower.includes("trung lập") || teamLower.includes("thứ")) {
      return "/cards/hunter.jpg";
    }
    return "/cards/villager.jpg";
  };

  const getCardColor = (card) => {
    const name = (card.name || "").toLowerCase();
    const team = (card.team || "").toLowerCase();

    if (team === "sói" || name.includes("sói") || name.includes("wolf")) {
      return "var(--color-wolf)";
    }
    if (name.includes("tiên tri") || name.includes("seer")) {
      return "var(--color-seer)";
    }
    if (name.includes("bảo vệ") || name.includes("guard")) {
      return "var(--color-guard)";
    }
    if (name.includes("phù thủy") || name.includes("witch")) {
      return "#c084fc";
    }
    if (name.includes("thợ săn") || name.includes("hunter")) {
      return "#fb923c";
    }
    if (team.includes("trung lập") || team.includes("thứ")) {
      return "var(--color-neutral)";
    }
    return "var(--color-villager)";
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
        backgroundColor: "rgba(0, 0, 0, 0.82)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
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
          maxWidth: "860px",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          position: "relative",
          animation: "fadeIn 0.2s ease-out",
          background: "linear-gradient(135deg, rgba(16, 20, 32, 0.95), rgba(10, 12, 20, 0.98))",
          border: "1.5px solid var(--border-glass)",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(212, 175, 55, 0.12)",
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
            paddingBottom: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "rgba(212, 175, 55, 0.14)",
                border: "1px solid rgba(212, 175, 55, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GiSpellBook size={24} color="var(--gold-accent)" />
            </div>
            <div>
              <h3
                className="font-cinzel"
                style={{
                  fontSize: "19px",
                  fontWeight: "800",
                  letterSpacing: "0.5px",
                  color: "var(--text-main)",
                  margin: 0,
                }}
              >
                Từ Điển Thẻ Bài Ma Sói
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-dim)", marginTop: "2px" }}>
                Tra cứu luật & kỹ năng các vai trò trong ván đấu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.35)";
              e.currentTarget.style.borderColor = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
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
            marginBottom: "18px",
            overflowX: "auto",
            paddingBottom: "6px",
            scrollbarWidth: "none",
          }}
        >
          {[
            { id: "all", label: "Tất cả", icon: null, color: "var(--text-main)" },
            { id: "wolf", label: "Phe Ma Sói", icon: GiWolfHead, color: "var(--color-wolf)" },
            { id: "villager", label: "Phe Dân Làng", icon: GiFarmer, color: "var(--color-villager)" },
            { id: "neutral", label: "Phe Thứ Ba", icon: GiDramaMasks, color: "var(--color-neutral)" },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: isActive ? `1.5px solid ${tab.color}` : "1px solid rgba(255, 255, 255, 0.12)",
                  background: isActive ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.04)",
                  color: isActive ? tab.color : "#cbd5e1",
                  boxShadow: isActive ? `0 0 14px ${tab.color}33` : "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  flexShrink: 0,
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
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "14px",
            padding: "4px 4px 20px 2px",
          }}
        >
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "var(--text-dim)",
                gridColumn: "1/-1",
                fontSize: "14px",
              }}
            >
              Đang tải danh sách thẻ bài...
            </div>
          ) : filteredCards.length > 0 ? (
            filteredCards.map((card, idx) => {
              const accentColor = getCardColor(card);
              const cardImage = getRoleImage(card.name, card.team);

              return (
                <div
                  key={card._id || idx}
                  style={{
                    background: "rgba(14, 18, 28, 0.88)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderLeft: `4px solid ${accentColor}`,
                    borderRadius: "14px",
                    padding: "14px",
                    display: "flex",
                    gap: "14px",
                    alignItems: "flex-start",
                    transition: "transform 0.2s ease, border-color 0.2s ease",
                  }}
                >
                  <img
                    src={cardImage}
                    alt={card.name}
                    style={{
                      width: "64px",
                      height: "92px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1.5px solid rgba(255, 255, 255, 0.18)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.45)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        marginBottom: "6px",
                      }}
                    >
                      <h4
                        className="font-cinzel"
                        style={{
                          fontSize: "15px",
                          fontWeight: "700",
                          color: accentColor,
                          margin: 0,
                          lineHeight: "1.25",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {card.name}
                      </h4>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "3px 9px",
                          borderRadius: "999px",
                          background: `${accentColor}1c`,
                          color: accentColor,
                          border: `1px solid ${accentColor}44`,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          letterSpacing: "0.3px",
                        }}
                      >
                        Phe {card.team}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "12.5px",
                        lineHeight: "1.5",
                        color: "#cbd5e1",
                        margin: 0,
                      }}
                    >
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "var(--text-dim)",
                gridColumn: "1/-1",
                fontSize: "14px",
              }}
            >
              Không có thẻ bài nào trong danh mục này.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
