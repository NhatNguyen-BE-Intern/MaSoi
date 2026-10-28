"use client";

import React, { useState, useEffect } from "react";
import { getSocket } from "../../lib/socket";

export default function OnlineLobby({
  user,
  onJoinRoom,
  onCreateOnlineRoom,
  onSwitchMode,
  onOpenFriends,
  onOpenDictionary,
}) {
  const [publicRooms, setPublicRooms] = useState([]);
  const [isSearchingQuickMatch, setIsSearchingQuickMatch] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [pinCodeInput, setPinCodeInput] = useState("");
  const [targetRoomForPin, setTargetRoomForPin] = useState(null);

  // Form tạo phòng Online
  const [roomNameInput, setRoomNameInput] = useState(`Phòng của ${user?.characterName || "Dân Làng"}`);
  const [isPrivate, setIsPrivate] = useState(false);
  const [createPinInput, setCreatePinInput] = useState("");
  const [deckMode, setDeckMode] = useState("auto"); // 'auto' | 'custom'
  const [roleReveal, setRoleReveal] = useState("open"); // 'open' | 'hidden'

  useEffect(() => {
    const socket = getSocket();

    // Yêu cầu lấy danh sách phòng public ngay khi vào sảnh
    socket.emit("get_public_rooms");

    // Lắng nghe cập nhật danh sách phòng
    socket.on("public_rooms_list", (roomsList) => {
      setPublicRooms(roomsList || []);
    });

    // Lắng nghe kết quả ghép trận nhanh
    socket.on("quick_match_found", ({ roomCode }) => {
      setIsSearchingQuickMatch(false);
      onJoinRoom(roomCode);
    });

    const interval = setInterval(() => {
      socket.emit("get_public_rooms");
    }, 5000);

    return () => {
      clearInterval(interval);
      socket.off("public_rooms_list");
      socket.off("quick_match_found");
    };
  }, [onJoinRoom]);

  // Xử lý bấm Ghép trận nhanh
  const handleQuickMatch = () => {
    setIsSearchingQuickMatch(true);
    const socket = getSocket();
    socket.emit("quick_match", user);
  };

  // Xử lý tạo phòng Online
  const handleCreateRoomSubmit = (e) => {
    e.preventDefault();
    if (!roomNameInput.trim()) return alert("Vui lòng nhập tên phòng!");
    if (isPrivate && (!createPinInput.trim() || createPinInput.length !== 4)) {
      return alert("Mã PIN phòng riêng tư phải gồm đúng 4 chữ số!");
    }

    onCreateOnlineRoom({
      user,
      roomName: roomNameInput.trim(),
      isPublic: !isPrivate,
      pinCode: isPrivate ? createPinInput.trim() : null,
      settings: {
        deckMode,
        roleRevealOnDeath: roleReveal,
      },
    });
    setIsCreateModalOpen(false);
  };

  // Xử lý vào phòng có mã PIN
  const handleJoinWithPin = (e) => {
    e.preventDefault();
    if (!pinCodeInput.trim() || pinCodeInput.length !== 4) {
      return alert("Mã PIN phòng phải gồm đúng 4 chữ số!");
    }
    onJoinRoom(targetRoomForPin.roomCode, pinCodeInput.trim());
    setTargetRoomForPin(null);
    setPinCodeInput("");
  };

  // Xử lý vào phòng bằng mã 4 số trực tiếp
  const handleJoinByCodeSubmit = (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim() || joinCodeInput.length !== 4) {
      return alert("Mã phòng phải gồm 4 chữ số!");
    }
    onJoinRoom(joinCodeInput.trim(), pinCodeInput ? pinCodeInput.trim() : null);
    setIsJoinCodeModalOpen(false);
    setJoinCodeInput("");
    setPinCodeInput("");
  };

  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Thanh Header Sảnh Online */}
      <div
        className="glass-panel"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 24px",
          borderRadius: "18px",
          marginBottom: "24px",
          border: "1px solid rgba(168, 85, 247, 0.25)",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #a855f7, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              border: "2px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            🐺
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#f8fafc" }}>
                {user?.characterName}
              </h3>
              <span
                style={{
                  fontSize: "11px",
                  background: "rgba(34, 197, 94, 0.2)",
                  color: "#4ade80",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontWeight: "700",
                }}
              >
                100 Uy Tín
              </span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>
              Sảnh Thi Đấu Trực Tuyến Tự Động Hóa
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onSwitchMode}
            className="btn btn-secondary"
            style={{ fontSize: "13px", padding: "8px 14px" }}
          >
            🔄 Đổi Chế Độ
          </button>
          <button
            onClick={onOpenFriends}
            className="btn btn-secondary"
            style={{ fontSize: "13px", padding: "8px 14px" }}
          >
            👥 Bạn Bè
          </button>
          <button
            onClick={onOpenDictionary}
            className="btn btn-secondary"
            style={{ fontSize: "13px", padding: "8px 14px" }}
          >
            📖 Từ Điển 34 Lá
          </button>
        </div>
      </div>

      {/* Hero Banner: Ghép Trận Nhanh & Tạo Phòng */}
      <div
        className="glass-panel"
        style={{
          background: "linear-gradient(135deg, rgba(30, 27, 75, 0.7), rgba(15, 23, 42, 0.85))",
          padding: "32px 28px",
          borderRadius: "24px",
          border: "1px solid rgba(168, 85, 247, 0.3)",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "24px",
        }}
      >
        <div style={{ maxWidth: "560px" }}>
          <span
            style={{
              fontSize: "12px",
              color: "#c084fc",
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            Máy Chủ Tự Động Hóa Chuẩn Thi Đấu
          </span>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "900",
              color: "#f8fafc",
              margin: "6px 0 10px",
            }}
          >
            THAM GIA NGÔI LÀNG BÓNG ĐÊM
          </h1>
          <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
            Hệ thống tự động xếp bạn vào phòng có đông người chơi nhất để ván đấu bắt đầu nhanh
            chóng, hoặc bạn có thể tự tạo bàn thi đấu riêng cùng bạn bè!
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: "260px" }}>
          <button
            onClick={handleQuickMatch}
            disabled={isSearchingQuickMatch}
            className="btn"
            style={{
              padding: "16px 24px",
              background: isSearchingQuickMatch
                ? "#475569"
                : "linear-gradient(135deg, #a855f7, #6366f1)",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "800",
              borderRadius: "14px",
              border: "none",
              boxShadow: "0 6px 20px rgba(168, 85, 247, 0.4)",
              cursor: isSearchingQuickMatch ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
          >
            {isSearchingQuickMatch ? (
              <>⏳ Đang tìm phòng đông nhất...</>
            ) : (
              <>⚡ GHÉP TRẬN NHANH</>
            )}
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-secondary"
              style={{
                flex: 1,
                padding: "12px",
                fontSize: "13px",
                fontWeight: "700",
                borderRadius: "12px",
              }}
            >
              + Tạo Phòng Mới
            </button>
            <button
              onClick={() => setIsJoinCodeModalOpen(true)}
              className="btn btn-secondary"
              style={{
                flex: 1,
                padding: "12px",
                fontSize: "13px",
                fontWeight: "700",
                borderRadius: "12px",
              }}
            >
              🔑 Nhập Mã 4 Số
            </button>
          </div>
        </div>
      </div>

      {/* Danh Sách Phòng Công Khai */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#f8fafc", margin: 0 }}>
              Danh Sách Phòng Chờ
            </h2>
            <span
              style={{
                background: "rgba(168, 85, 247, 0.2)",
                color: "#c084fc",
                padding: "2px 10px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              {publicRooms.length} phòng khả dụng
            </span>
          </div>

          <button
            onClick={() => getSocket().emit("get_public_rooms")}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            🔄 Làm mới
          </button>
        </div>

        {publicRooms.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: "48px 20px",
              textAlign: "center",
              borderRadius: "18px",
              color: "#94a3b8",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🏰</div>
            <h3 style={{ color: "#cbd5e1", margin: "0 0 6px" }}>Chưa có phòng công khai nào</h3>
            <p style={{ fontSize: "14px", margin: 0 }}>
              Hãy bấm <b>⚡ Ghép Trận Nhanh</b> để tự động tạo phòng mới làm Chủ phòng!
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "16px",
            }}
          >
            {publicRooms.map((room) => (
              <div
                key={room.roomCode}
                className="glass-panel"
                style={{
                  padding: "20px",
                  borderRadius: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "14px",
                  transition: "all 0.2s ease",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "8px",
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#f8fafc",
                      }}
                    >
                      {room.roomName}
                    </h4>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "800",
                        color: room.playerCount >= room.maxPlayers ? "#f87171" : "#4ade80",
                      }}
                    >
                      {room.playerCount}/{room.maxPlayers} người
                    </span>
                  </div>

                  <div style={{ fontSize: "12px", color: "#94a3b8", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span>Chủ phòng: <b style={{ color: "#cbd5e1" }}>{room.hostName}</b></span>
                    <span>•</span>
                    <span>Mã: <b style={{ color: "#a855f7" }}>{room.roomCode}</b></span>
                  </div>

                  <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.06)",
                        color: "#cbd5e1",
                      }}
                    >
                      {room.settings.deckMode === "auto" ? "🤖 Máy tự chọn" : "🎴 Quản trò chọn"}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.06)",
                        color: "#cbd5e1",
                      }}
                    >
                      {room.settings.roleRevealOnDeath === "open" ? "🎴 Công khai bài" : "🎭 Giấu bài"}
                    </span>
                    {room.hasPin && (
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "8px",
                          background: "rgba(234, 179, 8, 0.15)",
                          color: "#fde047",
                        }}
                      >
                        🔒 Có mã PIN
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (room.hasPin) {
                      setTargetRoomForPin(room);
                    } else {
                      onJoinRoom(room.roomCode);
                    }
                  }}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                  }}
                >
                  {room.hasPin ? "🔑 Nhập PIN để vào" : "Vào phòng chơi →"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal 1: Tạo Phòng Mới */}
      {isCreateModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: "460px",
              width: "100%",
              padding: "28px 24px",
              borderRadius: "20px",
              border: "1px solid rgba(168, 85, 247, 0.3)",
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: "20px", fontWeight: "800", color: "#f8fafc" }}>
              Thiết Lập Phòng Online Mới
            </h3>
            <form onSubmit={handleCreateRoomSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                  Tên phòng:
                </label>
                <input
                  type="text"
                  value={roomNameInput}
                  onChange={(e) => setRoomNameInput(e.target.value)}
                  className="input-field"
                  placeholder="Nhập tên phòng..."
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                  Chế độ chọn bộ bài:
                </label>
                <select
                  value={deckMode}
                  onChange={(e) => setDeckMode(e.target.value)}
                  className="input-field"
                >
                  <option value="auto">🤖 Máy Tự Chọn (Cân bằng thông minh)</option>
                  <option value="custom">🎴 Quản Trò Tự Chọn (Custom 34 Lá)</option>
                </select>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                  Hiển thị thẻ bài khi chết:
                </label>
                <select
                  value={roleReveal}
                  onChange={(e) => setRoleReveal(e.target.value)}
                  className="input-field"
                >
                  <option value="open">🎴 Công Khai Bài (Mặc định)</option>
                  <option value="hidden">🎭 Giấu Bài (Hardcore / Dark Mode)</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#cbd5e1", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  Đặt phòng riêng tư (Có mã PIN 4 số)
                </label>
                {isPrivate && (
                  <input
                    type="text"
                    maxLength={4}
                    value={createPinInput}
                    onChange={(e) => setCreatePinInput(e.target.value.replace(/\D/g, ""))}
                    className="input-field"
                    placeholder="Nhập 4 số PIN..."
                    style={{ marginTop: "8px" }}
                    required
                  />
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Tạo Phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Nhập PIN để vào phòng Private */}
      {targetRoomForPin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: "380px",
              width: "100%",
              padding: "24px",
              borderRadius: "18px",
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", color: "#fde047" }}>
              🔒 Phòng Riêng Tư
            </h3>
            <p style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "16px" }}>
              Vui lòng nhập mã PIN 4 số để tham gia <b>{targetRoomForPin.roomName}</b>
            </p>
            <form onSubmit={handleJoinWithPin}>
              <input
                type="text"
                maxLength={4}
                value={pinCodeInput}
                onChange={(e) => setPinCodeInput(e.target.value.replace(/\D/g, ""))}
                className="input-field"
                placeholder="Nhập 4 số PIN..."
                style={{ textAlign: "center", fontSize: "20px", letterSpacing: "4px", marginBottom: "16px" }}
                autoFocus
                required
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setTargetRoomForPin(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Vào Phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Nhập Mã Phòng 4 Số Trực Tiếp */}
      {isJoinCodeModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: "380px",
              width: "100%",
              padding: "24px",
              borderRadius: "18px",
            }}
          >
            <h3 style={{ margin: "0 0 14px", fontSize: "18px", color: "#f8fafc", textAlign: "center" }}>
              Nhập Mã Phòng 4 Số
            </h3>
            <form onSubmit={handleJoinByCodeSubmit}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>
                  Mã phòng:
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.replace(/\D/g, ""))}
                  className="input-field"
                  placeholder="Ví dụ: 1234"
                  style={{ textAlign: "center", fontSize: "20px", letterSpacing: "4px" }}
                  autoFocus
                  required
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>
                  Mã PIN (nếu phòng yêu cầu):
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={pinCodeInput}
                  onChange={(e) => setPinCodeInput(e.target.value.replace(/\D/g, ""))}
                  className="input-field"
                  placeholder="Để trống nếu không có PIN"
                  style={{ textAlign: "center", fontSize: "16px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsJoinCodeModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Tham Gia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
