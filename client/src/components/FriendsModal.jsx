"use client";

import React, { useState, useEffect } from "react";
import { RiGroupLine, RiUserAddLine, RiCloseLine, RiCheckLine } from "react-icons/ri";

export default function FriendsModal({ isOpen, onClose, user }) {
  const [friends, setFriends] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  const loadFriends = async () => {
    if (!user?.characterName) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/friends/list/${encodeURIComponent(user.characterName)}`);
      const data = await res.json();
      if (res.ok && data.friends) {
        setFriends(data.friends);
      }
    } catch (err) {
      console.error("Lỗi tải bạn bè:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user?.characterName) {
      loadFriends();
    }
  }, [isOpen, user]);

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!searchName.trim()) return;

    setStatusMsg({ text: "Đang gửi yêu cầu...", type: "info" });
    try {
      const res = await fetch("/api/friends/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          myName: user.characterName,
          friendName: searchName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ text: data.message || "Kết bạn thành công!", type: "success" });
        setSearchName("");
        await loadFriends();
      } else {
        setStatusMsg({ text: data.message || "Không thể kết bạn!", type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: "Lỗi kết nối máy chủ!", type: "error" });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
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
          maxWidth: "440px",
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
            marginBottom: "20px",
            borderBottom: "1px solid var(--border-glass)",
            paddingBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <RiGroupLine size={22} color="var(--gold-accent)" />
            <h3 className="font-cinzel" style={{ fontSize: "18px", fontWeight: "700" }}>
              Danh Sách Bạn Bè
            </h3>
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

        {/* Add Friend Input */}
        <form onSubmit={handleAddFriend} style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              className="game-input"
              placeholder="Nhập tên nhân vật..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              style={{ fontSize: "14px" }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ width: "auto", padding: "12px 18px", whiteSpace: "nowrap" }}
            >
              <RiUserAddLine size={16} />
              <span>Thêm</span>
            </button>
          </div>
          {statusMsg.text && (
            <p
              style={{
                marginTop: "8px",
                fontSize: "13px",
                color:
                  statusMsg.type === "success"
                    ? "#10b981"
                    : statusMsg.type === "error"
                    ? "#ef4444"
                    : "#38bdf8",
              }}
            >
              {statusMsg.text}
            </p>
          )}
        </form>

        {/* Friends List */}
        <div
          style={{
            maxHeight: "260px",
            overflowY: "auto",
            borderRadius: "12px",
            background: "rgba(8, 11, 18, 0.6)",
            border: "1px solid var(--border-glass)",
            padding: "8px",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--text-dim)" }}>
              Đang tải danh sách...
            </div>
          ) : friends.length > 0 ? (
            friends.map((friendName, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  marginBottom: "4px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #10b981, #047857)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {friendName.substring(0, 1).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: "14px" }}>{friendName}</span>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-dim)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <RiCheckLine size={15} color="#10b981" />
                  Bạn bè
                </span>
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", padding: "28px 12px", color: "var(--text-dim)" }}>
              <p style={{ fontSize: "14px", marginBottom: "4px" }}>Chưa có người bạn nào.</p>
              <p style={{ fontSize: "12px" }}>Nhập tên nhân vật của bạn bè ở trên để kết bạn!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
