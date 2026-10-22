"use client";

import React, { useState } from "react";
import { GiWolfHead, GiHood } from "react-icons/gi";
import {
  RiUser3Line,
  RiLockPasswordLine,
  RiArrowRightLine,
  RiShieldCheckLine,
} from "react-icons/ri";

export default function AuthSection({ onAuthSuccess }) {
  const [tab, setTab] = useState("login"); // "login" | "register" | "character"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      return setErrorMsg("Vui lòng điền đầy đủ tài khoản và mật khẩu!");
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Đăng nhập thất bại!");
      } else {
        localStorage.setItem("user", JSON.stringify(data.user));
        if (!data.user.characterName) {
          setCurrentUser(data.user);
          setTab("character");
        } else {
          onAuthSuccess(data.user);
        }
      }
    } catch (err) {
      setErrorMsg("Không thể kết nối đến máy chủ backend!");
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      return setErrorMsg("Vui lòng nhập tài khoản và mật khẩu mới!");
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Đăng ký thất bại!");
      } else {
        alert("Đăng ký thành công! Hãy đăng nhập để bắt đầu.");
        setTab("login");
      }
    } catch (err) {
      setErrorMsg("Không thể kết nối đến máy chủ backend!");
    } finally {
      setLoading(false);
    }
  };

  // Handle Create Character
  const handleCreateCharacter = async (e) => {
    e.preventDefault();
    if (!characterName.trim()) {
      return setErrorMsg("Vui lòng nhập tên nhân vật hiển thị!");
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/create-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id,
          characterName: characterName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Tạo tên nhân vật thất bại!");
      } else {
        const updatedUser = { ...currentUser, characterName: data.characterName };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        onAuthSuccess(updatedUser);
      }
    } catch (err) {
      setErrorMsg("Lỗi kết nối máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
      }}
    >
      <div
        className="glass-panel glass-panel-glow"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "36px 28px",
          position: "relative",
        }}
      >
        {/* Mystic Moon Icon / Header Banner */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            className="floating-element"
            style={{
              width: "72px",
              height: "72px",
              margin: "0 auto 16px",
              borderRadius: "50%",
              background: "radial-gradient(circle, #b91c1c 20%, #450a0a 80%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 35px rgba(220, 38, 38, 0.6)",
              border: "2px solid rgba(255, 120, 120, 0.4)",
            }}
          >
            <GiWolfHead size={40} color="#fecaca" />
          </div>

          <h2
            className="font-cinzel"
            style={{
              fontSize: "26px",
              fontWeight: "900",
              letterSpacing: "2px",
              color: "#fff",
              marginBottom: "6px",
            }}
          >
            LÀNG MA SÓI
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            Bộ bài ảo & Trợ lý Quản trò cho nhóm bạn
          </p>
        </div>

        {/* Tab switcher (Login / Register) */}
        {tab !== "character" && (
          <div
            style={{
              display: "flex",
              background: "rgba(10, 14, 23, 0.8)",
              padding: "4px",
              borderRadius: "12px",
              marginBottom: "24px",
              border: "1px solid var(--border-glass)",
            }}
          >
            <button
              onClick={() => {
                setTab("login");
                setErrorMsg("");
              }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                background: tab === "login" ? "rgba(220, 38, 38, 0.25)" : "transparent",
                color: tab === "login" ? "#fff" : "var(--text-muted)",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => {
                setTab("register");
                setErrorMsg("");
              }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                background: tab === "register" ? "rgba(220, 38, 38, 0.25)" : "transparent",
                color: tab === "register" ? "#fff" : "var(--text-muted)",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Đăng Ký
            </button>
          </div>
        )}

        {/* Form Error Message */}
        {errorMsg && (
          <div
            style={{
              padding: "12px",
              borderRadius: "10px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              fontSize: "13px",
              marginBottom: "18px",
              textAlign: "center",
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Form content */}
        {tab === "login" && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                }}
              >
                Tên đăng nhập
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="game-input"
                  placeholder="Nhập tài khoản của bạn..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ paddingLeft: "42px" }}
                />
                <RiUser3Line
                  size={18}
                  color="var(--text-dim)"
                  style={{ position: "absolute", left: "14px", top: "16px" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                }}
              >
                Mật khẩu
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  className="game-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: "42px" }}
                />
                <RiLockPasswordLine
                  size={18}
                  color="var(--text-dim)"
                  style={{ position: "absolute", left: "14px", top: "16px" }}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              <span>{loading ? "Đang xử lý..." : "Vào Làng Ma Sói"}</span>
              <RiArrowRightLine size={18} />
            </button>
          </form>
        )}

        {tab === "register" && (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                }}
              >
                Tạo tài khoản mới
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="game-input"
                  placeholder="Ví dụ: nhatnguyen99"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ paddingLeft: "42px" }}
                />
                <RiUser3Line
                  size={18}
                  color="var(--text-dim)"
                  style={{ position: "absolute", left: "14px", top: "16px" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                }}
              >
                Mật khẩu bí mật
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  className="game-input"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: "42px" }}
                />
                <RiLockPasswordLine
                  size={18}
                  color="var(--text-dim)"
                  style={{ position: "absolute", left: "14px", top: "16px" }}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              <span>{loading ? "Đang đăng ký..." : "Tạo Tài Khoản"}</span>
              <RiArrowRightLine size={18} />
            </button>
          </form>
        )}

        {tab === "character" && (
          <form onSubmit={handleCreateCharacter}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h3 className="font-cinzel" style={{ fontSize: "18px", color: "var(--gold-accent)" }}>
                Đặt Tên Nhân Vật
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                Tên này sẽ hiển thị cho bạn bè trong phòng và dùng để kết bạn.
              </p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <input
                type="text"
                className="game-input"
                placeholder="Ví dụ: SóiĐầuĐàn, TiênTriVũTrụ, Hùng..."
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                style={{ textAlign: "center", fontSize: "16px", fontWeight: "600" }}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              <RiShieldCheckLine size={18} />
              <span>{loading ? "Đang lưu..." : "Xác Nhận Tên Nhân Vật"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
