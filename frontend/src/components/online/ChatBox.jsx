"use client";

import React, { useState, useEffect, useRef } from "react";
import { getSocket } from "../../lib/socket";

export default function ChatBox({
  roomCode,
  user,
  players = [],
  role = null,
  isAlive = true,
  currentPhase = "day", // 'day' | 'night'
  currentSubPhase = null, // 'defense' | 'voting' | ...
  accusedPlayer = null,
  accusedSeat = null,
  isLovers = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("town"); // 'town' | 'wolf' | 'lovers' | 'ghost'
  const [messages, setMessages] = useState({
    town: [],
    wolf: [],
    lovers: [],
    ghost: [],
  });
  const [unreadCounts, setUnreadCounts] = useState({
    town: 0,
    wolf: 0,
    lovers: 0,
    ghost: 0,
  });
  const [inputText, setInputText] = useState("");
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [selectedSeatForPreset, setSelectedSeatForPreset] = useState(null);
  const [activePresetType, setActivePresetType] = useState(null);

  const isLycanOrDoppel =
    role?.code === "LYCAN" ||
    role?.name?.toLowerCase().includes("bán sói") ||
    role?.name?.toLowerCase().includes("lycan") ||
    role?.code === "DOPPELGANGER" ||
    role?.name?.toLowerCase().includes("hóa sói") ||
    role?.name?.toLowerCase().includes("doppelganger");

  const isWolf = Boolean(
    role &&
      !isLycanOrDoppel &&
      (role.team === "Sói" ||
        role.name?.toLowerCase().includes("sói") ||
        role.name?.toLowerCase().includes("wolf")),
  );

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab, isOpen]);

  // Xóa unread count của tab hiện tại khi mở hoặc đổi tab
  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setUnreadCounts((prev) => (prev[activeTab] === 0 ? prev : { ...prev, [activeTab]: 0 }));
      });
    }
  }, [isOpen, activeTab]);

  // Bộ đếm cooldown 1.5s
  useEffect(() => {
    let timer = null;
    if (cooldownRemaining > 0) {
      timer = setInterval(() => {
        setCooldownRemaining((prev) => Math.max(0, prev - 100));
      }, 100);
    }
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Lắng nghe sự kiện socket chat
  useEffect(() => {
    const socket = getSocket();

    // Lấy lịch sử chat
    socket.emit("get_chat_history", { roomCode });

    socket.on("chat_history", (history) => {
      setMessages({
        town: history.town || [],
        wolf: history.wolf || [],
        lovers: history.lovers || [],
        ghost: history.ghost || [],
      });
    });

    socket.on("receive_chat_message", (msg) => {
      const channel = msg.channel || "town";
      setMessages((prev) => ({
        ...prev,
        [channel]: [...(prev[channel] || []), msg],
      }));

      // Nếu đang đóng chat hoặc đang ở tab khác thì tăng unread count
      if (!isOpen || activeTab !== channel) {
        setUnreadCounts((prev) => ({
          ...prev,
          [channel]: (prev[channel] || 0) + 1,
        }));
      }
    });

    socket.on("chat_error", (errMsg) => {
      alert(errMsg);
    });

    return () => {
      socket.off("chat_history");
      socket.off("receive_chat_message");
      socket.off("chat_error");
    };
  }, [roomCode, isOpen, activeTab]);

  // Gửi tin nhắn
  const handleSendMessage = (textToSend = null, presetType = null) => {
    const text = (textToSend !== null ? textToSend : inputText).trim();
    if (!text) return;
    if (cooldownRemaining > 0) return;

    const socket = getSocket();
    socket.emit("send_chat_message", {
      roomCode,
      channel: activeTab,
      message: text,
      quickPreset: presetType,
    });

    if (textToSend === null) {
      setInputText("");
    }
    setCooldownRemaining(1500); // 1.5s cooldown
    setSelectedSeatForPreset(null);
    setActivePresetType(null);
  };

  // Kích hoạt mẫu câu chat nhanh
  const handleQuickPresetClick = (preset) => {
    if (preset.requiresSeat) {
      setActivePresetType(preset.type);
    } else {
      handleSendMessage(preset.text, preset.type);
    }
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  // Danh mục phím Chat Nhanh
  const quickPresets = [
    { type: "villager", label: "🌾 Dân Lương Thiện", text: "Tôi là Dân Làng lương thiện!", requiresSeat: false },
    { type: "suspect", label: "❓ Nghi Ngờ Ghế #X", textTemplate: "Tôi nghi ngờ người số #{seat}!", requiresSeat: true },
    { type: "seer_check", label: "🔮 Soi Ra Sói", textTemplate: "Đêm qua tôi soi người số #{seat} ra Sói!", requiresSeat: true },
    { type: "guard_shield", label: "🛡️ Đã Bảo Vệ", text: "Đêm qua tôi đã bảo vệ an toàn!", requiresSeat: false },
    { type: "innocent", label: "😭 Kêu Oan", text: "Tôi vô tội, xin đừng vote tôi!", requiresSeat: false },
    { type: "skip_vote", label: "⚖️ Bỏ Phiếu Trắng", text: "Đề nghị cả làng bỏ phiếu trắng hôm nay.", requiresSeat: false },
  ];

  // Kiểm tra trạng thái bị khóa chat của tab hiện tại
  let isChannelMuted = false;
  let muteReason = "";

  if (activeTab === "town") {
    if (currentPhase === "night") {
      isChannelMuted = true;
      muteReason = "🌙 Trời đang tối, dân làng đang ngủ say không thể trò chuyện.";
    } else if (!isAlive) {
      isChannelMuted = true;
      muteReason = "💀 Bạn đã tử nạn và chỉ có thể trò chuyện ở Kênh Hồn Ma.";
    } else if (
      currentSubPhase === "defense" &&
      accusedPlayer &&
      accusedPlayer.toLowerCase() !== user?.characterName?.toLowerCase()
    ) {
      isChannelMuted = true;
      muteReason = `🎤 Đang trong thời gian biện hộ của số #${accusedSeat}! Cả làng bị khóa chat.`;
    }
  } else if (activeTab === "wolf") {
    if (!isWolf) {
      isChannelMuted = true;
      muteReason = "🐺 Kênh riêng bí mật chỉ dành cho phe Ma Sói.";
    }
  } else if (activeTab === "lovers") {
    if (!isLovers) {
      isChannelMuted = true;
      muteReason = "💖 Kênh riêng chỉ dành cho 2 người trong Cặp Đôi định mệnh.";
    }
  } else if (activeTab === "ghost") {
    if (isAlive) {
      isChannelMuted = true;
      muteReason = "✨ Bạn còn sống, không thể trò chuyện với cõi âm.";
    }
  }

  const currentTabMessages = messages[activeTab] || [];

  return (
    <>
      {/* Nút Floating Toggle Chat tròn ở góc dưới bên phải */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #a855f7, #6366f1)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 25px rgba(168, 85, 247, 0.5)",
            color: "#ffffff",
            fontSize: "24px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 900,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          💬
          {totalUnread > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                background: "#ef4444",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: "800",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #0f172a",
              }}
            >
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Cửa Sổ Khung Chat (Drawer / Panel) */}
      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "380px",
            maxWidth: "calc(100vw - 32px)",
            height: "520px",
            maxHeight: "calc(100vh - 100px)",
            borderRadius: "20px",
            border: "1px solid rgba(168, 85, 247, 0.35)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(168, 85, 247, 0.2)",
            display: "flex",
            flexDirection: "column",
            zIndex: 999,
            overflow: "hidden",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {/* Header Khung Chat */}
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(15, 23, 42, 0.8)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>💬</span>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#f8fafc" }}>
                HỘI ĐỒNG LÀNG SÓI
              </h4>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontSize: "18px",
                cursor: "pointer",
                padding: "4px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
            >
              ✕
            </button>
          </div>

          {/* 4 Tabs Kênh Chat */}
          <div
            style={{
              display: "flex",
              background: "rgba(30, 41, 59, 0.5)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {/* Tab 1: Làng (Town) */}
            <button
              onClick={() => setActiveTab("town")}
              style={{
                flex: 1,
                padding: "10px 4px",
                background: activeTab === "town" ? "rgba(168, 85, 247, 0.25)" : "transparent",
                border: "none",
                borderBottom: activeTab === "town" ? "2px solid #a855f7" : "none",
                color: activeTab === "town" ? "#f8fafc" : "#94a3b8",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                position: "relative",
              }}
            >
              🌾 Làng
              {unreadCounts.town > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    background: "#a855f7",
                    color: "#fff",
                    fontSize: "9px",
                    borderRadius: "8px",
                    padding: "1px 4px",
                  }}
                >
                  {unreadCounts.town}
                </span>
              )}
            </button>

            {/* Tab 2: Bầy Sói (Wolf) */}
            {isWolf && (
              <button
                onClick={() => setActiveTab("wolf")}
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  background: activeTab === "wolf" ? "rgba(239, 68, 68, 0.25)" : "transparent",
                  border: "none",
                  borderBottom: activeTab === "wolf" ? "2px solid #ef4444" : "none",
                  color: activeTab === "wolf" ? "#f87171" : "#94a3b8",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                🐺 Sói
                {unreadCounts.wolf > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: "9px",
                      borderRadius: "8px",
                      padding: "1px 4px",
                    }}
                  >
                    {unreadCounts.wolf}
                  </span>
                )}
              </button>
            )}

            {/* Tab 3: Cặp Đôi (Lovers) */}
            {isLovers && (
              <button
                onClick={() => setActiveTab("lovers")}
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  background: activeTab === "lovers" ? "rgba(236, 72, 153, 0.25)" : "transparent",
                  border: "none",
                  borderBottom: activeTab === "lovers" ? "2px solid #ec4899" : "none",
                  color: activeTab === "lovers" ? "#f472b6" : "#94a3b8",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                💖 Cặp Đôi
                {unreadCounts.lovers > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      background: "#ec4899",
                      color: "#fff",
                      fontSize: "9px",
                      borderRadius: "8px",
                      padding: "1px 4px",
                    }}
                  >
                    {unreadCounts.lovers}
                  </span>
                )}
              </button>
            )}

            {/* Tab 4: Hồn Ma (Ghost) */}
            {(!isAlive || currentTabMessages.length > 0) && (
              <button
                onClick={() => setActiveTab("ghost")}
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  background: activeTab === "ghost" ? "rgba(100, 116, 139, 0.3)" : "transparent",
                  border: "none",
                  borderBottom: activeTab === "ghost" ? "2px solid #94a3b8" : "none",
                  color: activeTab === "ghost" ? "#cbd5e1" : "#64748b",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                💀 Ma
                {unreadCounts.ghost > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      background: "#64748b",
                      color: "#fff",
                      fontSize: "9px",
                      borderRadius: "8px",
                      padding: "1px 4px",
                    }}
                  >
                    {unreadCounts.ghost}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Vùng Tin Nhắn */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              background: "rgba(15, 23, 42, 0.4)",
            }}
          >
            {currentTabMessages.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "12px",
                  marginTop: "auto",
                  marginBottom: "auto",
                }}
              >
                Chưa có tin nhắn nào trong kênh này. Hãy bắt đầu thảo luận!
              </div>
            ) : (
              currentTabMessages.map((msg) => {
                const isMe =
                  msg.senderName?.toLowerCase() === user?.characterName?.toLowerCase();

                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "3px",
                        justifyContent: isMe ? "flex-end" : "flex-start",
                      }}
                    >
                      {msg.seatNumber && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "800",
                            background: "rgba(255, 255, 255, 0.1)",
                            padding: "1px 5px",
                            borderRadius: "6px",
                            color: "#cbd5e1",
                          }}
                        >
                          #{msg.seatNumber}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          color: isMe ? "#c084fc" : "#94a3b8",
                        }}
                      >
                        {msg.senderName}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                        background: isMe
                          ? "linear-gradient(135deg, #a855f7, #7e22ce)"
                          : activeTab === "wolf"
                          ? "rgba(185, 28, 28, 0.4)"
                          : "rgba(30, 41, 59, 0.8)",
                        color: "#f8fafc",
                        fontSize: "13px",
                        lineHeight: "1.4",
                        wordBreak: "break-word",
                        border: isMe ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Dải Phím Chat Nhanh (Quick Chat Presets) */}
          {!isChannelMuted && (
            <div
              style={{
                padding: "8px 10px",
                background: "rgba(15, 23, 42, 0.7)",
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                gap: "6px",
                overflowX: "auto",
                whiteSpace: "nowrap",
                scrollbarWidth: "none",
              }}
            >
              {quickPresets.map((preset) => (
                <button
                  key={preset.type}
                  onClick={() => handleQuickPresetClick(preset)}
                  disabled={cooldownRemaining > 0}
                  style={{
                    background:
                      activePresetType === preset.type
                        ? "rgba(168, 85, 247, 0.4)"
                        : "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    padding: "4px 10px",
                    color: "#cbd5e1",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: cooldownRemaining > 0 ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          {/* Popup chọn số ghế nếu bấm vào Preset cần số ghế */}
          {activePresetType && (
            <div
              style={{
                padding: "8px 12px",
                background: "rgba(88, 28, 135, 0.4)",
                borderTop: "1px solid rgba(168, 85, 247, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: "11px", color: "#fde047", fontWeight: "700" }}>
                Chọn Ghế:
              </span>
              {players.map((p) => (
                <button
                  key={p.seatNumber || p.characterName}
                  onClick={() => {
                    const preset = quickPresets.find((x) => x.type === activePresetType);
                    if (preset) {
                      const text = preset.textTemplate.replace("{seat}", p.seatNumber || p.characterName);
                      handleSendMessage(text, activePresetType);
                    }
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "none",
                    borderRadius: "6px",
                    padding: "2px 8px",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  #{p.seatNumber} ({p.characterName})
                </button>
              ))}
              <button
                onClick={() => setActivePresetType(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "11px",
                  cursor: "pointer",
                  marginLeft: "auto",
                }}
              >
                Hủy
              </button>
            </div>
          )}

          {/* Khung Nhập Tin Nhắn */}
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(15, 23, 42, 0.9)",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {isChannelMuted ? (
              <div
                style={{
                  fontSize: "12px",
                  color: "#fde047",
                  textAlign: "center",
                  padding: "6px 0",
                  fontStyle: "italic",
                }}
              >
                {muteReason}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                style={{ display: "flex", gap: "8px" }}
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    cooldownRemaining > 0
                      ? `Chờ ${(cooldownRemaining / 1000).toFixed(1)}s...`
                      : "Nhập tin nhắn thảo luận..."
                  }
                  disabled={cooldownRemaining > 0}
                  className="input-field"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: "13px",
                    borderRadius: "10px",
                  }}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || cooldownRemaining > 0}
                  className="btn btn-primary"
                  style={{
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: "700",
                    borderRadius: "10px",
                  }}
                >
                  Gửi
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
