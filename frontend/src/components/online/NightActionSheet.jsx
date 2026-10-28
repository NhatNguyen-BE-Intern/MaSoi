"use client";

import React, { useState, useEffect } from "react";
import { getSocket } from "../../lib/socket";

/**
 * GIAO DIỆN HÀNH ĐỘNG BAN ĐÊM (NIGHT ACTION SHEET)
 * Hiệu ứng sương mù, trăng sao, lưới chọn mục tiêu theo số ghế và hỗ trợ từng vai trò riêng biệt.
 */
export default function NightActionSheet({
  roomCode,
  user,
  role,
  players = [],
  isAlive = true,
  currentPhase = "NIGHT_START",
}) {
  const [nightPrompt, setNightPrompt] = useState(null);
  const [wolfVotes, setWolfVotes] = useState({});
  const [tieWarning, setTieWarning] = useState("");
  const [seerResult, setSeerResult] = useState(null);
  const [fortuneTellerResult, setFortuneTellerResult] = useState(null);
  const [beholderResult, setBeholderResult] = useState(null);
  const [shadowHunterResult, setShadowHunterResult] = useState(null);
  const [manipulatedNotice, setManipulatedNotice] = useState(null);
  const [witchData, setWitchData] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedPair, setSelectedPair] = useState([]); // Cho Thần Tình Yêu & Dark Cupid
  const [actionDone, setActionDone] = useState(false);
  const [phaseInfo, setPhaseInfo] = useState({
    title: "🌙 Màn Đêm Buông Xuống",
    instruction: "Cả làng đang say ngủ trong tĩnh mịch...",
    duration: 20,
  });
  const [timeLeft, setTimeLeft] = useState(20);

  // 1. Lắng nghe các socket events của Pha Đêm
  useEffect(() => {
    const socket = getSocket();

    const handlePhaseChanged = (data) => {
      if (data?.phase?.startsWith("NIGHT_")) {
        setPhaseInfo({
          title: data.title || "🌙 Màn Đêm",
          instruction: data.instruction || "",
          duration: data.duration || 20,
        });
        setTimeLeft(data.duration || 20);
        setSelectedTarget(null);
        setSelectedPair([]);
        setTieWarning("");
        setActionDone(false);
        // Nếu chuyển sang phase khác không phải vai trò mình thì reset prompt
        if (data.phase === "NIGHT_START" || data.phase === "NIGHT_END") {
          setNightPrompt(null);
          setWitchData(null);
          setSeerResult(null);
          setFortuneTellerResult(null);
        }
      }
    };

    const handleActionPrompt = (data) => {
      setNightPrompt(data);
      if (data.currentVotes) {
        setWolfVotes(data.currentVotes);
      }
    };

    const handleWolfVotesUpdated = (data) => {
      if (data?.votes) {
        setWolfVotes(data.votes);
      }
    };

    const handleWolfTieWarning = (msg) => {
      setTieWarning(msg);
      setTimeLeft(5);
    };

    const handleSeerReveal = (result) => {
      setSeerResult(result);
    };

    const handleFortuneTellerReveal = (result) => {
      setFortuneTellerResult(result);
    };

    const handleBeholderReveal = (result) => {
      setBeholderResult(result);
    };

    const handleShadowHunterResult = (result) => {
      setShadowHunterResult(result);
    };

    const handleManipulatedNotice = (data) => {
      setManipulatedNotice(data?.message || "Tâm trí bạn đã bị thao túng!");
    };

    const handleWitchPrompt = (data) => {
      setWitchData(data);
      setNightPrompt({ actionType: "WITCH_ACTION" });
    };

    const handleActionResult = (res) => {
      setActionDone(true);
    };

    socket.on("phase_changed", handlePhaseChanged);
    socket.on("night_action_prompt", handleActionPrompt);
    socket.on("wolf_votes_updated", handleWolfVotesUpdated);
    socket.on("wolf_vote_tie_warning", handleWolfTieWarning);
    socket.on("seer_reveal", handleSeerReveal);
    socket.on("fortune_teller_reveal", handleFortuneTellerReveal);
    socket.on("beholder_reveal", handleBeholderReveal);
    socket.on("shadow_hunter_result", handleShadowHunterResult);
    socket.on("manipulated_notice", handleManipulatedNotice);
    socket.on("witch_prompt", handleWitchPrompt);
    socket.on("night_action_result", handleActionResult);

    return () => {
      socket.off("phase_changed", handlePhaseChanged);
      socket.off("night_action_prompt", handleActionPrompt);
      socket.off("wolf_votes_updated", handleWolfVotesUpdated);
      socket.off("wolf_vote_tie_warning", handleWolfTieWarning);
      socket.off("seer_reveal", handleSeerReveal);
      socket.off("fortune_teller_reveal", handleFortuneTellerReveal);
      socket.off("beholder_reveal", handleBeholderReveal);
      socket.off("shadow_hunter_result", handleShadowHunterResult);
      socket.off("manipulated_notice", handleManipulatedNotice);
      socket.off("witch_prompt", handleWitchPrompt);
      socket.off("night_action_result", handleActionResult);
    };
  }, []);

  // 2. Bộ đếm ngược thời gian cục bộ
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Helper tìm player từ characterName
  const getPlayerInfo = (charName) => {
    return players.find((p) => p.characterName === charName) || { characterName: charName };
  };

  // 3. Xử lý hành động Submit
  const handleConfirmAction = () => {
    const socket = getSocket();
    if (!nightPrompt) return;

    if (nightPrompt.actionType === "CUPID_PAIR") {
      if (selectedPair.length !== 2) return;
      socket.emit("submit_night_action", {
        roomCode,
        actionType: "CUPID_PAIR",
        targetPair: selectedPair,
      });
      setActionDone(true);
    } else if (nightPrompt.actionType === "DARK_CUPID_PAIR") {
      if (selectedPair.length !== 2) return;
      socket.emit("submit_night_action", {
        roomCode,
        actionType: "DARK_CUPID_PAIR",
        targetPair: selectedPair,
      });
      setActionDone(true);
    } else if (nightPrompt.actionType === "MANIPULATOR_TARGET") {
      if (!selectedTarget) return;
      socket.emit("submit_night_action", {
        roomCode,
        actionType: "MANIPULATOR_TARGET",
        targetCharacterName: selectedTarget,
      });
      setActionDone(true);
    } else if (nightPrompt.actionType === "FORTUNE_TELLER_INSPECT") {
      if (!selectedTarget) return;
      socket.emit("submit_night_action", {
        roomCode,
        actionType: "FORTUNE_TELLER_INSPECT",
        targetCharacterName: selectedTarget,
      });
    } else if (nightPrompt.actionType === "GUARD_PROTECT") {
      if (!selectedTarget) return;
      socket.emit("submit_night_action", {
        roomCode,
        actionType: "GUARD_PROTECT",
        targetCharacterName: selectedTarget,
      });
      setActionDone(true);
    } else if (nightPrompt.actionType === "SEER_INSPECT") {
      if (!selectedTarget) return;
      socket.emit("submit_night_action", {
        roomCode,
        actionType: "SEER_INSPECT",
        targetCharacterName: selectedTarget,
      });
    } else if (nightPrompt.actionType === "WHITE_WOLF_KILL") {
      socket.emit("submit_night_action", {
        roomCode,
        actionType: "WHITE_WOLF_KILL",
        targetCharacterName: selectedTarget,
      });
      setActionDone(true);
    } else if (nightPrompt.actionType === "DOPPELGANGER_CHOOSE") {
      if (!selectedTarget) return;
      socket.emit("submit_night_action", {
        roomCode,
        actionType: "DOPPELGANGER_CHOOSE",
        targetCharacterName: selectedTarget,
      });
      setActionDone(true);
    } else if (nightPrompt.actionType === "TROUBLEMAKER_SWAP") {
      if (selectedPair.length !== 2) return;
      socket.emit("submit_night_action", {
        roomCode,
        actionType: "TROUBLEMAKER_SWAP",
        targetPair: selectedPair,
      });
      setActionDone(true);
    } else if (nightPrompt.actionType === "SERIAL_KILLER_STAB") {
      if (!selectedTarget) return;
      socket.emit("submit_night_action", {
        roomCode,
        actionType: "SERIAL_KILLER_STAB",
        targetCharacterName: selectedTarget,
      });
      setActionDone(true);
    } else if (nightPrompt.actionType === "PRIEST_BLESS") {
      if (!selectedTarget) return;
      socket.emit("submit_night_action", {
        roomCode,
        actionType: "PRIEST_BLESS",
        targetCharacterName: selectedTarget,
      });
      setActionDone(true);
    } else if (nightPrompt.actionType === "ARSONIST_ACTION") {
      const targets = selectedPair.length > 0 ? selectedPair : selectedTarget ? [selectedTarget] : [];
      socket.emit("submit_night_action", {
        roomCode,
        actionType: "ARSONIST_ACTION",
        targetCharacterNames: targets,
      });
      setActionDone(true);
    } else if (nightPrompt.actionType === "SHADOW_HUNTER_SHOOT") {
      if (!selectedTarget) return;
      socket.emit("submit_night_action", {
        roomCode,
        actionType: "SHADOW_HUNTER_SHOOT",
        targetCharacterName: selectedTarget,
      });
      setActionDone(true);
    } else if (nightPrompt.actionType === "BEHOLDER_DONE") {
      socket.emit("submit_night_action", {
        roomCode,
        actionType: "BEHOLDER_DONE",
      });
      setActionDone(true);
    }
  };

  const handleArsonistIgnite = () => {
    const socket = getSocket();
    socket.emit("submit_night_action", {
      roomCode,
      actionType: "ARSONIST_ACTION",
      subAction: "IGNITE",
      ignite: true,
    });
    setActionDone(true);
  };

  const handleThiefSwap = (cardIndex) => {
    const socket = getSocket();
    socket.emit("submit_night_action", {
      roomCode,
      actionType: "THIEF_SWAP",
      chosenCardIndex: cardIndex,
    });
    setActionDone(true);
  };

  const handleWolfVoteSelect = (targetName) => {
    setSelectedTarget(targetName);
    const socket = getSocket();
    socket.emit("vote_wolf_kill", {
      roomCode,
      targetCharacterName: targetName,
    });
  };

  const handleAlphaWolfInfect = () => {
    if (!selectedTarget) return;
    const socket = getSocket();
    socket.emit("submit_night_action", {
      roomCode,
      actionType: "ALPHA_WOLF_INFECT",
      targetCharacterName: selectedTarget,
    });
    setActionDone(true);
  };

  const handleWitchUseHeal = () => {
    const socket = getSocket();
    socket.emit("submit_night_action", {
      roomCode,
      actionType: "WITCH_ACTION",
      witchAction: "HEAL",
    });
    setActionDone(true);
  };

  const handleWitchUsePoison = () => {
    if (!selectedTarget) return;
    const socket = getSocket();
    socket.emit("submit_night_action", {
      roomCode,
      actionType: "WITCH_ACTION",
      witchAction: "POISON",
      targetCharacterName: selectedTarget,
    });
    setActionDone(true);
  };

  const handleWitchSkip = () => {
    const socket = getSocket();
    socket.emit("submit_night_action", {
      roomCode,
      actionType: "WITCH_ACTION",
      witchAction: "SKIP",
    });
    setActionDone(true);
  };

  const handleEarlySleep = () => {
    const socket = getSocket();
    socket.emit("skip_night_turn", { roomCode });
    setActionDone(true);
  };

  const isNightPhase = currentPhase && currentPhase.startsWith("NIGHT_");
  if (!isNightPhase) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 7, 15, 0.92)",
        backdropFilter: "blur(12px)",
        zIndex: 900,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 16px",
        color: "#f8fafc",
        animation: "fadeIn 0.4s ease",
      }}
    >
      {/* 1. Header: Trăng Sao & Đồng Hồ Đếm Ngược */}
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "20px",
            backgroundColor: "rgba(30, 41, 59, 0.8)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            marginBottom: "12px",
          }}
        >
          <span style={{ fontSize: "18px" }}>⏳</span>
          <span
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: timeLeft <= 5 ? "#ef4444" : "#38bdf8",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {timeLeft}s
          </span>
          <span style={{ color: "#94a3b8", fontSize: "13px" }}>còn lại</span>
        </div>

        <h2
          style={{
            fontSize: "22px",
            fontWeight: "800",
            color: "#f1f5f9",
            textShadow: "0 0 20px rgba(56, 189, 248, 0.5)",
            margin: "0 0 6px 0",
          }}
        >
          {phaseInfo.title}
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "#cbd5e1",
            margin: 0,
            lineHeight: "1.5",
          }}
        >
          {phaseInfo.instruction}
        </p>

        {/* Cảnh báo hòa phiếu Sói */}
        {tieWarning && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px 16px",
              borderRadius: "12px",
              backgroundColor: "rgba(239, 68, 68, 0.25)",
              border: "1px solid #ef4444",
              color: "#fca5a5",
              fontWeight: "700",
              fontSize: "13px",
              animation: "pulse 1s infinite",
            }}
          >
            {tieWarning}
          </div>
        )}

        {/* Thông báo bị Thao Túng Tâm Trí */}
        {manipulatedNotice && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px 16px",
              borderRadius: "12px",
              backgroundColor: "rgba(168, 85, 247, 0.25)",
              border: "1px solid #a855f7",
              color: "#d8b4fe",
              fontWeight: "700",
              fontSize: "13px",
              animation: "pulse 1.5s infinite",
            }}
          >
            {manipulatedNotice}
          </div>
        )}
      </div>

      {/* 2. Main Content Area */}
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px 0",
          overflowY: "auto",
        }}
      >
        {/* TRƯỜNG HỢP A1: KẾT QUẢ SOI THẦY BÓI */}
        {fortuneTellerResult ? (
          <div
            className="glass-panel"
            style={{
              padding: "28px 24px",
              textAlign: "center",
              borderRadius: "20px",
              border: "2px solid #a855f7",
              boxShadow: "0 0 35px rgba(168, 85, 247, 0.4)",
              maxWidth: "400px",
              width: "100%",
            }}
          >
            <div style={{ fontSize: "54px", marginBottom: "12px" }}>🔮</div>
            <h3 style={{ fontSize: "18px", color: "#94a3b8", marginBottom: "6px" }}>
              Thầy Bói đã soi thấu chân tướng của{" "}
              <strong style={{ color: "#f8fafc" }}>{fortuneTellerResult.targetCharacterName}</strong>
            </h3>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "900",
                color: "#c084fc",
                marginBottom: "8px",
              }}
            >
              {fortuneTellerResult.roleName}
            </div>
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "800",
                backgroundColor:
                  fortuneTellerResult.team === "Sói"
                    ? "rgba(239, 68, 68, 0.2)"
                    : "rgba(56, 189, 248, 0.2)",
                color: fortuneTellerResult.team === "Sói" ? "#f87171" : "#38bdf8",
                border: `1px solid ${fortuneTellerResult.team === "Sói" ? "#ef4444" : "#38bdf8"}`,
                marginBottom: "14px",
              }}
            >
              Phe: {fortuneTellerResult.team}
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "#cbd5e1",
                marginBottom: "20px",
                lineHeight: "1.5",
              }}
            >
              {fortuneTellerResult.description}
            </p>
            <button
              className="btn btn-primary"
              onClick={handleEarlySleep}
              style={{ width: "100%", padding: "12px" }}
            >
              😴 Xong lượt / Đi ngủ
            </button>
          </div>
        ) : seerResult ? (
          /* TRƯỜNG HỢP A2: KẾT QUẢ SOI BÀI TIÊN TRI */
          <div
            className="glass-panel"
            style={{
              padding: "28px 24px",
              textAlign: "center",
              borderRadius: "20px",
              border: `2px solid ${seerResult.isWolf ? "#ef4444" : "#10b981"}`,
              boxShadow: `0 0 35px ${seerResult.isWolf ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
              maxWidth: "380px",
              width: "100%",
            }}
          >
            <div style={{ fontSize: "54px", marginBottom: "12px" }}>
              {seerResult.isWolf ? "🐺" : "🕊️"}
            </div>
            <h3 style={{ fontSize: "18px", color: "#94a3b8", marginBottom: "8px" }}>
              Chân tướng của{" "}
              <strong style={{ color: "#f8fafc" }}>{seerResult.targetCharacterName}</strong>
            </h3>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "900",
                color: seerResult.isWolf ? "#f87171" : "#34d399",
                marginBottom: "16px",
              }}
            >
              {seerResult.isWolf ? "PHE MA SÓI" : "PHE DÂN LÀNG"}
            </div>
            <p style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "20px" }}>
              Hãy ghi nhớ bí mật này và dẫn dắt dân làng khi trời sáng!
            </p>
            <button
              className="btn btn-primary"
              onClick={handleEarlySleep}
              style={{ width: "100%", padding: "12px" }}
            >
              😴 Xong lượt / Đi ngủ
            </button>
          </div>
        ) : beholderResult ? (
          /* TRƯỜNG HỢP: KẾT QUẢ NGƯỜI QUAN SÁT */
          <div
            className="glass-panel"
            style={{
              padding: "28px 24px",
              textAlign: "center",
              borderRadius: "20px",
              border: "2px solid #38bdf8",
              boxShadow: "0 0 35px rgba(56, 189, 248, 0.4)",
              maxWidth: "380px",
              width: "100%",
            }}
          >
            <div style={{ fontSize: "54px", marginBottom: "12px" }}>👁️</div>
            <h3 style={{ fontSize: "18px", color: "#94a3b8", marginBottom: "8px" }}>
              Linh Ảnh Tiên Tri Thật
            </h3>
            <div
              style={{
                fontSize: "22px",
                fontWeight: "900",
                color: "#38bdf8",
                marginBottom: "16px",
              }}
            >
              {beholderResult.found
                ? `${beholderResult.seerName} (Ghế #${beholderResult.seerSeat || 1})`
                : "Không có Tiên Tri trong làng"}
            </div>
            <p style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "20px" }}>
              {beholderResult.message}
            </p>
            <button
              className="btn btn-primary"
              onClick={handleEarlySleep}
              style={{ width: "100%", padding: "12px" }}
            >
              😴 Xong lượt / Đi ngủ
            </button>
          </div>
        ) : shadowHunterResult ? (
          /* TRƯỜNG HỢP: KẾT QUẢ PHÁT ĐẠN THỢ SĂN BÓNG ĐÊM */
          <div
            className="glass-panel"
            style={{
              padding: "28px 24px",
              textAlign: "center",
              borderRadius: "20px",
              border: `2px solid ${shadowHunterResult.success ? "#10b981" : "#f59e0b"}`,
              boxShadow: `0 0 35px ${shadowHunterResult.success ? "rgba(16, 185, 129, 0.4)" : "rgba(245, 158, 11, 0.4)"}`,
              maxWidth: "380px",
              width: "100%",
            }}
          >
            <div style={{ fontSize: "54px", marginBottom: "12px" }}>
              {shadowHunterResult.success ? "🎯" : "💨"}
            </div>
            <h3 style={{ fontSize: "18px", color: "#94a3b8", marginBottom: "8px" }}>
              Kết Quả Phát Đạn Bóng Đêm
            </h3>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "900",
                color: shadowHunterResult.success ? "#34d399" : "#fbbf24",
                marginBottom: "16px",
              }}
            >
              {shadowHunterResult.success ? "TIÊU DIỆT THÀNH CÔNG" : "PHÁT ĐẠN TRƯỢT"}
            </div>
            <p style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "20px" }}>
              {shadowHunterResult.message}
            </p>
            <button
              className="btn btn-primary"
              onClick={handleEarlySleep}
              style={{ width: "100%", padding: "12px" }}
            >
              😴 Xong lượt / Đi ngủ
            </button>
          </div>
        ) : nightPrompt && isAlive ? (
          /* TRƯỜNG HỢP B: ĐẾN LƯỢT HÀNH ĐỘNG CỦA BẢN THÂN */
          <div style={{ width: "100%", textAlign: "center" }}>
            <div
              style={{
                fontSize: "15px",
                fontWeight: "700",
                color: "#38bdf8",
                marginBottom: "16px",
              }}
            >
              {nightPrompt.title}
            </div>

            {/* Banner Cơn Cuồng Nộ của Sói Con */}
            {nightPrompt.doubleKill && (
              <div
                style={{
                  marginBottom: "14px",
                  padding: "10px 16px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(220, 38, 38, 0.3)",
                  border: "1px solid #ef4444",
                  color: "#fca5a5",
                  fontSize: "13px",
                  fontWeight: "800",
                  animation: "pulse 1.2s infinite",
                }}
              >
                🔥 CƠN CUỒNG NỘ: Sói Con đã chết, bầy Sói được cắn 2 nạn nhân đêm nay!
              </div>
            )}

            {/* B1. PHÙ THỦY GIAO DIỆN ĐẶC BIỆT */}
            {witchData && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "16px",
                  borderRadius: "16px",
                  backgroundColor: "rgba(30, 41, 59, 0.7)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                }}
              >
                {witchData.victim ? (
                  <div style={{ marginBottom: "14px", color: "#f87171", fontSize: "15px" }}>
                    🩸 Nạn nhân bị Sói cắn đêm nay:{" "}
                    <strong>{witchData.victim}</strong>
                  </div>
                ) : (
                  <div style={{ marginBottom: "14px", color: "#94a3b8", fontSize: "14px" }}>
                    ✨ Đêm nay không có ai bị Sói cắn (hoặc đã hết bình Cứu).
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                  {witchData.canHeal && (
                    <button
                      className="btn"
                      onClick={handleWitchUseHeal}
                      disabled={actionDone}
                      style={{
                        backgroundColor: "#10b981",
                        color: "#fff",
                        padding: "10px 18px",
                        fontWeight: "700",
                        fontSize: "14px",
                      }}
                    >
                      🧪 Dùng Bình Cứu
                    </button>
                  )}

                  {witchData.canPoison && (
                    <button
                      className="btn"
                      onClick={() => setSelectedTarget("POISON_MODE")}
                      disabled={actionDone}
                      style={{
                        backgroundColor: "#8b5cf6",
                        color: "#fff",
                        padding: "10px 18px",
                        fontWeight: "700",
                        fontSize: "14px",
                      }}
                    >
                      ☠️ Dùng Bình Độc
                    </button>
                  )}

                  <button
                    className="btn btn-secondary"
                    onClick={handleWitchSkip}
                    disabled={actionDone}
                    style={{ padding: "10px 18px", fontSize: "14px" }}
                  >
                    💤 Bỏ Qua Đêm Nay
                  </button>
                </div>
              </div>
            )}

            {/* B1.5 KẺ TRỘM XEM BÀI THỪA */}
            {nightPrompt.actionType === "THIEF_SWAP" && nightPrompt.centerCards && (
              <div style={{ marginBottom: "20px", width: "100%" }}>
                <div style={{ fontSize: "14px", color: "#f8fafc", marginBottom: "12px", fontWeight: "700" }}>
                  2 Lá bài thừa ngoài rìa bàn:
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "16px" }}>
                  {nightPrompt.centerCards.map((card, idx) => (
                    <div
                      key={idx}
                      className="glass-panel"
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        border: "1px solid rgba(56, 189, 248, 0.4)",
                        textAlign: "center",
                        width: "150px",
                      }}
                    >
                      <div style={{ fontSize: "32px", marginBottom: "6px" }}>
                        {card.team === "Sói" ? "🐺" : "🕊️"}
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: "800", color: "#f8fafc", marginBottom: "4px" }}>
                        {card.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "12px" }}>
                        {card.description}
                      </div>
                      <button
                        className="btn btn-primary"
                        disabled={actionDone}
                        onClick={() => handleThiefSwap(idx)}
                        style={{ width: "100%", padding: "8px", fontSize: "12px" }}
                      >
                        Đổi sang lá này
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-secondary"
                  disabled={actionDone}
                  onClick={() => handleThiefSwap(null)}
                  style={{ padding: "8px 20px", fontSize: "13px" }}
                >
                  Giữ nguyên vai Dân Làng
                </button>
              </div>
            )}

            {/* B2. LƯỚI NGƯỜI CHƠI CHỌN MỤC TIÊU */}
            {nightPrompt.availableTargets && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                  gap: "10px",
                  maxHeight: "340px",
                  overflowY: "auto",
                  padding: "4px",
                }}
              >
                {nightPrompt.availableTargets.map((charName) => {
                  const p = getPlayerInfo(charName);
                  const isSelected =
                    selectedTarget === charName || selectedPair.includes(charName);

                  // Đếm số Sói đang vote người này
                  const wolvesVoted = Object.entries(wolfVotes)
                    .filter(([wName, tName]) => tName === charName)
                    .map(([wName]) => wName);

                  return (
                    <button
                      key={charName}
                      disabled={actionDone}
                      onClick={() => {
                        if (nightPrompt.actionType === "WOLF_KILL") {
                          handleWolfVoteSelect(charName);
                        } else if (
                          nightPrompt.actionType === "CUPID_PAIR" ||
                          nightPrompt.actionType === "DARK_CUPID_PAIR" ||
                          nightPrompt.actionType === "TROUBLEMAKER_SWAP" ||
                          nightPrompt.actionType === "ARSONIST_ACTION"
                        ) {
                          if (selectedPair.includes(charName)) {
                            setSelectedPair(selectedPair.filter((n) => n !== charName));
                          } else if (selectedPair.length < 2) {
                            setSelectedPair([...selectedPair, charName]);
                          }
                        } else {
                          setSelectedTarget(charName);
                        }
                      }}
                      style={{
                        padding: "12px 10px",
                        borderRadius: "14px",
                        backgroundColor: isSelected
                          ? "rgba(56, 189, 248, 0.25)"
                          : "rgba(30, 41, 59, 0.7)",
                        border: isSelected
                          ? "2px solid #38bdf8"
                          : "1px solid rgba(148, 163, 184, 0.2)",
                        color: "#f8fafc",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        cursor: actionDone ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "800",
                          backgroundColor: "#334155",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          color: "#94a3b8",
                        }}
                      >
                        #{p.seatNumber || "?"}
                      </span>
                      <span style={{ fontSize: "14px", fontWeight: "700" }}>
                        {charName}
                      </span>

                      {/* Hiển thị vote của Sói thời gian thực */}
                      {wolvesVoted.length > 0 && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#f87171",
                            fontWeight: "700",
                            backgroundColor: "rgba(239, 68, 68, 0.2)",
                            padding: "2px 6px",
                            borderRadius: "8px",
                          }}
                        >
                          🐺 {wolvesVoted.length} phiếu
                        </div>
                      )}

                      {/* Badge đã dính xăng của Kẻ Độc Hành */}
                      {nightPrompt.dousedPlayers?.includes(charName) && (
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#f59e0b",
                            fontWeight: "800",
                            backgroundColor: "rgba(245, 158, 11, 0.2)",
                            padding: "2px 6px",
                            borderRadius: "6px",
                          }}
                        >
                          🛢️ Đã dính xăng
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* B3. NÚT LÂY NHIỄM CHO SÓI ĐẦU ĐÀN */}
            {nightPrompt.actionType === "WOLF_KILL" && nightPrompt.canInfect && (
              <div style={{ marginTop: "14px" }}>
                <button
                  className="btn"
                  onClick={handleAlphaWolfInfect}
                  disabled={!selectedTarget || actionDone}
                  style={{
                    backgroundColor: "#8b5cf6",
                    color: "#fff",
                    padding: "10px 20px",
                    fontWeight: "800",
                    fontSize: "13px",
                    borderRadius: "12px",
                    boxShadow: "0 0 15px rgba(139, 92, 246, 0.4)",
                  }}
                >
                  🧬 Kích Hoạt Lây Nhiễm (1 lần/ván)
                  {selectedTarget ? `: ${selectedTarget}` : " (Chọn mục tiêu trước)"}
                </button>
              </div>
            )}

            {/* B4. NÚT XÁC NHẬN CHO CÁC VAI THƯỜNG, THẦY TU, KẺ ĐỘC HÀNH & SÓI TRẮNG */}
            {nightPrompt.actionType !== "WOLF_KILL" &&
              nightPrompt.actionType !== "WITCH_ACTION" &&
              nightPrompt.actionType !== "THIEF_SWAP" && (
                <div style={{ marginTop: "16px", display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    className="btn btn-primary"
                    disabled={
                      actionDone ||
                      (nightPrompt.actionType === "CUPID_PAIR" ||
                      nightPrompt.actionType === "DARK_CUPID_PAIR" ||
                      nightPrompt.actionType === "TROUBLEMAKER_SWAP"
                        ? selectedPair.length !== 2
                        : nightPrompt.actionType === "ARSONIST_ACTION"
                        ? selectedPair.length === 0 && !selectedTarget
                        : !selectedTarget)
                    }
                    onClick={handleConfirmAction}
                    style={{
                      padding: "12px 32px",
                      fontSize: "15px",
                      fontWeight: "800",
                    }}
                  >
                    {actionDone
                      ? "✅ Đã gửi thao tác"
                      : nightPrompt.actionType === "ARSONIST_ACTION"
                      ? "🛢️ Tẩm Xăng Mục Tiêu Đã Chọn"
                      : nightPrompt.actionType === "PRIEST_BLESS"
                      ? "✝️ Ban Phước Lành"
                      : "Xác Nhận Hành Động"}
                  </button>

                  {/* Nút Châm Lửa Thiêu Rụi của Kẻ Độc Hành */}
                  {nightPrompt.actionType === "ARSONIST_ACTION" && (
                    <button
                      className="btn"
                      onClick={handleArsonistIgnite}
                      disabled={actionDone || !nightPrompt.canIgnite}
                      style={{
                        padding: "12px 24px",
                        fontSize: "15px",
                        fontWeight: "800",
                        backgroundColor: "#ef4444",
                        color: "#fff",
                        boxShadow: "0 0 15px rgba(239, 68, 68, 0.4)",
                      }}
                    >
                      🔥 Châm Lửa Thiêu Rụi ({nightPrompt.dousedPlayers?.length || 0} người)
                    </button>
                  )}

                  {nightPrompt.actionType === "WHITE_WOLF_KILL" && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedTarget(null);
                        const socket = getSocket();
                        socket.emit("submit_night_action", {
                          roomCode,
                          actionType: "WHITE_WOLF_KILL",
                          targetCharacterName: null,
                        });
                        setActionDone(true);
                      }}
                      disabled={actionDone}
                      style={{ padding: "12px 20px", fontSize: "14px" }}
                    >
                      🐺 Không Cắn Đêm Nay
                    </button>
                  )}
                </div>
              )}

            {/* Phù Thủy chọn mục tiêu độc */}
            {selectedTarget === "POISON_MODE" && (
              <div style={{ marginTop: "14px" }}>
                <p style={{ fontSize: "13px", color: "#fca5a5" }}>
                  Hãy bấm vào 1 người ở danh sách trên rồi bấm Xác Nhận Độc:
                </p>
                <button
                  className="btn"
                  onClick={handleWitchUsePoison}
                  disabled={!selectedTarget || selectedTarget === "POISON_MODE" || actionDone}
                  style={{
                    backgroundColor: "#ef4444",
                    color: "#fff",
                    padding: "10px 24px",
                    fontWeight: "800",
                  }}
                >
                  ☠️ Xác Nhận Đầu Độc
                </button>
              </div>
            )}
          </div>
        ) : (
          /* TRƯỜNG HỢP C: ĐANG CHỜ CÁC VAI TRÒ KHÁC (NGỦ SAY) */
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
            }}
          >
            <div
              style={{
                fontSize: "64px",
                marginBottom: "16px",
                animation: "pulse 2.5s infinite",
              }}
            >
              💤
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#e2e8f0",
                marginBottom: "8px",
              }}
            >
              Bạn đang ngủ say...
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#94a3b8",
                maxWidth: "360px",
                margin: "0 auto",
                lineHeight: "1.6",
              }}
            >
              Hãy giữ im lặng và quan sát. Tránh phát ra tiếng động kẻo đánh thức bầy Sói trong đêm tối!
            </p>
          </div>
        )}
      </div>

      {/* 3. Footer: Nút Đi Ngủ Sớm */}
      {isAlive && nightPrompt && !actionDone && (
        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleEarlySleep}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: "13px",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            ⚡ Bỏ qua lượt / Đi ngủ sớm
          </button>
        </div>
      )}
    </div>
  );
}
