"use client";

import React, { useState, useEffect } from "react";
import { getSocket } from "../../lib/socket";

/**
 * BẢNG BIỂU QUYẾT & BỤC BIỆN HỘ BAN NGÀY (DAY VOTING PANEL)
 * Bao quát: Bầu Trưởng Làng, Bỏ phiếu Vòng 1 & Vòng 2 Hiệp Phụ kèm Phiếu Trắng,
 * Bục Biện Hộ Spotlight, Phán Quyết Treo Cổ (Có Tội / Vô Tội), Thợ Săn nổ súng & Di chúc Trưởng Làng.
 */
export default function DayVotingPanel({
  roomCode,
  user,
  role,
  players = [],
  isAlive = true,
  currentPhase = "DAY_DISCUSS",
}) {
  const [phaseInfo, setPhaseInfo] = useState(null);
  const [dayVotes, setDayVotes] = useState({});
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [myJudgementVote, setMyJudgementVote] = useState(null);
  const [actionSubmitted, setActionSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [judgeUsed, setJudgeUsed] = useState(false);
  const [judgePardonAlert, setJudgePardonAlert] = useState(null);

  // 1. Lắng nghe socket events của Ban Ngày
  useEffect(() => {
    const socket = getSocket();

    const handlePhaseChanged = (data) => {
      if (
        data?.phase === "DAY_MAYOR_ELECTION" ||
        data?.phase === "DAY_VOTE" ||
        data?.phase === "DAY_VOTE_TIE_BREAKER" ||
        data?.phase === "DAY_DEFENSE" ||
        data?.phase === "DAY_JUDGEMENT" ||
        data?.phase === "HUNTER_REVENGE" ||
        data?.phase === "MAYOR_SUCCESSION"
      ) {
        setPhaseInfo(data);
        setTimeLeft(data.duration || 30);
        setSelectedTarget(null);
        setMyJudgementVote(null);
        setActionSubmitted(false);
      } else {
        setPhaseInfo(null);
      }
    };

    const handleDayVotesUpdated = (data) => {
      if (data?.votes) {
        setDayVotes(data.votes);
      }
    };

    const handleJudgePardonAnnounce = (data) => {
      setJudgePardonAlert(data);
      setTimeout(() => setJudgePardonAlert(null), 5000);
    };

    socket.on("phase_changed", handlePhaseChanged);
    socket.on("day_votes_updated", handleDayVotesUpdated);
    socket.on("judge_pardon_announce", handleJudgePardonAnnounce);

    return () => {
      socket.off("phase_changed", handlePhaseChanged);
      socket.off("day_votes_updated", handleDayVotesUpdated);
      socket.off("judge_pardon_announce", handleJudgePardonAnnounce);
    };
  }, []);

  // 2. Bộ đếm ngược thời gian
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Helper tìm thông tin người chơi
  const getPlayerInfo = (charName) => {
    return (
      players.find((p) => p.characterName === charName) || {
        characterName: charName,
      }
    );
  };

  // Helper danh sách người còn sống
  const livingPlayers = players.filter((p) => p.isAlive !== false);

  // 3. Xử lý các hành động
  const handleVoteSuspect = (targetName) => {
    if (!isAlive || actionSubmitted) return;
    setSelectedTarget(targetName);
    const socket = getSocket();
    socket.emit("cast_day_vote", {
      roomCode,
      targetCharacterName: targetName,
    });
    setActionSubmitted(true);
  };

  const handleJudgementVote = (voteType) => {
    if (!isAlive || actionSubmitted) return;
    setMyJudgementVote(voteType);
    const socket = getSocket();
    socket.emit("cast_judgement_vote", {
      roomCode,
      vote: voteType,
    });
    setActionSubmitted(true);
  };

  const handleHunterShoot = (targetName) => {
    const socket = getSocket();
    socket.emit("hunter_shoot", {
      roomCode,
      targetCharacterName: targetName,
    });
    setActionSubmitted(true);
  };

  const handleTransferMayor = (targetName) => {
    const socket = getSocket();
    socket.emit("transfer_mayor", {
      roomCode,
      targetCharacterName: targetName,
    });
    setActionSubmitted(true);
  };

  const handleJudgePardon = () => {
    const socket = getSocket();
    socket.emit("judge_pardon", { roomCode });
    setJudgeUsed(true);
  };

  // Chỉ hiển thị khi đang ở các phase liên quan đến biểu quyết / sự kiện ban ngày
  if (!phaseInfo) return null;

  const isMayor = phaseInfo?.mayor === user?.characterName;
  const isAccused = phaseInfo?.suspect === user?.characterName;
  const isJudge =
    role?.code === "JUDGE" ||
    role?.name?.toLowerCase().includes("thẩm phán") ||
    role?.name?.toLowerCase().includes("judge");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 7, 15, 0.90)",
        backdropFilter: "blur(12px)",
        zIndex: 900,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 16px",
        color: "#f8fafc",
        animation: "fadeIn 0.3s ease",
      }}
    >
      {/* Alert Thông báo Phủ Quyết của Thẩm Phán */}
      {judgePardonAlert && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            zIndex: 999,
            backgroundColor: "#f59e0b",
            color: "#fff",
            padding: "14px 24px",
            borderRadius: "16px",
            fontWeight: "800",
            fontSize: "15px",
            boxShadow: "0 0 30px rgba(245, 158, 11, 0.6)",
            animation: "pulse 1s infinite",
          }}
        >
          {judgePardonAlert.message || "⚖️ Thẩm Phán đã gõ búa Phủ Quyết tha bổng nghi phạm!"}
        </div>
      )}

      {/* 1. Header: Đồng hồ đếm ngược và Tiêu đề Phase */}
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          textAlign: "center",
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
            marginBottom: "10px",
          }}
        >
          <span style={{ fontSize: "18px" }}>⏳</span>
          <span
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: timeLeft <= 5 ? "#ef4444" : "#eab308",
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
            color: "#fde047",
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

        {isMayor && (
          <div
            style={{
              marginTop: "8px",
              display: "inline-block",
              backgroundColor: "rgba(234, 179, 8, 0.2)",
              color: "#fde047",
              padding: "4px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "700",
              border: "1px solid #eab308",
            }}
          >
            👑 Bạn là Trưởng Làng: Phiếu biểu quyết của bạn tính x2!
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
        {/* PHẦN A: BỤC BIỆN HỘ SPOTLIGHT (DAY_DEFENSE) */}
        {phaseInfo.phase === "DAY_DEFENSE" && (
          <div
            className="glass-panel"
            style={{
              padding: "32px 24px",
              textAlign: "center",
              borderRadius: "24px",
              border: "2px solid #eab308",
              boxShadow: "0 0 45px rgba(234, 179, 8, 0.4)",
              maxWidth: "420px",
              width: "100%",
            }}
          >
            <div style={{ fontSize: "56px", marginBottom: "8px" }}>🎤</div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "4px",
              }}
            >
              Spotlight Biện Hộ
            </div>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "900",
                color: "#fde047",
                marginBottom: "14px",
              }}
            >
              {phaseInfo.suspect}
            </h3>

            {isAccused ? (
              <p style={{ color: "#34d399", fontSize: "14px", lineHeight: "1.6" }}>
                ✨ <strong>Bạn đang đứng trên bục biện hộ!</strong> Hãy sử dụng kênh
                chat Làng để thuyết phục dân làng tin vào sự trong sạch của bạn!
              </p>
            ) : (
              <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6" }}>
                Toàn bộ dân làng khác bị tạm khóa chat để lắng nghe nghi phạm giải
                trình. Chuẩn bị tinh thần cho phiên phán quyết treo cổ sắp tới!
              </p>
            )}

            {/* QUYỀN PHỦ QUYẾT CỦA THẨM PHÁN (PHASE BIỆN HỘ) */}
            {isJudge && isAlive && !judgeUsed && (
              <div style={{ marginTop: "16px" }}>
                <button
                  className="btn"
                  onClick={handleJudgePardon}
                  style={{
                    padding: "12px 20px",
                    borderRadius: "14px",
                    backgroundColor: "#f59e0b",
                    color: "#fff",
                    fontWeight: "800",
                    fontSize: "14px",
                    boxShadow: "0 0 16px rgba(245, 158, 11, 0.5)",
                    border: "1px solid #fbbf24",
                    cursor: "pointer",
                  }}
                >
                  ⚖️ Gõ Búa Phủ Quyết (Tha Bổng Ngay - 1 lần/ván)
                </button>
              </div>
            )}
          </div>
        )}

        {/* PHẦN B: PHÁN QUYẾT TREO CỔ (DAY_JUDGEMENT) */}
        {phaseInfo.phase === "DAY_JUDGEMENT" && (
          <div
            className="glass-panel"
            style={{
              padding: "28px 24px",
              textAlign: "center",
              borderRadius: "24px",
              border: "2px solid #ef4444",
              boxShadow: "0 0 40px rgba(239, 68, 68, 0.35)",
              maxWidth: "440px",
              width: "100%",
            }}
          >
            <div style={{ fontSize: "52px", marginBottom: "8px" }}>⚖️</div>
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#f87171", marginBottom: "6px" }}>
              Phán Quyết Cho {phaseInfo.suspect}
            </h3>
            <p style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "20px" }}>
              Nếu [Có Tội] nhiều hơn [Vô Tội], nghi phạm sẽ bị đưa lên giàn treo cổ!
            </p>

            {isAccused ? (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                  color: "#fca5a5",
                  fontWeight: "700",
                  fontSize: "14px",
                }}
              >
                🔒 Bạn là nghi phạm và bị khóa quyền biểu quyết cho bản thân!
              </div>
            ) : isAlive ? (
              <div style={{ display: "flex", gap: "14px", justifyContent: "center" }}>
                <button
                  className="btn"
                  onClick={() => handleJudgementVote("GUILTY")}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: "16px",
                    backgroundColor:
                      myJudgementVote === "GUILTY" ? "#ef4444" : "rgba(239, 68, 68, 0.3)",
                    border: myJudgementVote === "GUILTY" ? "2px solid #fff" : "1px solid #ef4444",
                    color: "#fff",
                    fontWeight: "800",
                    fontSize: "15px",
                    cursor: "pointer",
                  }}
                >
                  💀 Có Tội
                </button>

                <button
                  className="btn"
                  onClick={() => handleJudgementVote("INNOCENT")}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: "16px",
                    backgroundColor:
                      myJudgementVote === "INNOCENT" ? "#10b981" : "rgba(16, 185, 129, 0.3)",
                    border:
                      myJudgementVote === "INNOCENT" ? "2px solid #fff" : "1px solid #10b981",
                    color: "#fff",
                    fontWeight: "800",
                    fontSize: "15px",
                    cursor: "pointer",
                  }}
                >
                  ✨ Vô Tội
                </button>
              </div>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: "14px" }}>
                Bạn đã tử nạn và chỉ đang quan sát phiên tòa.
              </div>
            )}

            {/* QUYỀN PHỦ QUYẾT CỦA THẨM PHÁN (PHASE PHÁN QUYẾT) */}
            {isJudge && isAlive && !judgeUsed && (
              <div style={{ marginTop: "20px" }}>
                <button
                  className="btn"
                  onClick={handleJudgePardon}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "14px",
                    backgroundColor: "#f59e0b",
                    color: "#fff",
                    fontWeight: "900",
                    fontSize: "14px",
                    boxShadow: "0 0 16px rgba(245, 158, 11, 0.5)",
                    border: "1px solid #fbbf24",
                    cursor: "pointer",
                  }}
                >
                  ⚖️ Gõ Búa Phủ Quyết (Tha Bổng Ngay - 1 lần/ván)
                </button>
              </div>
            )}
          </div>
        )}

        {/* PHẦN C: THỢ SĂN NỔ SÚNG KÉO THEO (HUNTER_REVENGE) */}
        {phaseInfo.phase === "HUNTER_REVENGE" && (
          <div style={{ width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>🎯</div>
            {phaseInfo.shooter === user?.characterName ? (
              <div>
                <p style={{ color: "#f87171", fontWeight: "700", marginBottom: "16px" }}>
                  Hãy chọn 1 người sống để kéo theo phát đạn báo thù cuối cùng:
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {livingPlayers
                    .filter((p) => p.characterName !== user?.characterName)
                    .map((p) => (
                      <button
                        key={p.characterName}
                        onClick={() => handleHunterShoot(p.characterName)}
                        style={{
                          padding: "12px",
                          borderRadius: "14px",
                          backgroundColor: "rgba(239, 68, 68, 0.25)",
                          border: "1px solid #ef4444",
                          color: "#fff",
                          fontWeight: "800",
                          cursor: "pointer",
                        }}
                      >
                        🔫 {p.characterName} (#{p.seatNumber})
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <p style={{ color: "#cbd5e1", fontSize: "15px" }}>
                Thợ Săn {phaseInfo.shooter} đang lựa chọn mục tiêu trong cơn thịnh nộ...
              </p>
            )}
          </div>
        )}

        {/* PHẦN D: DI CHÚC KẾ VỊ TRƯỞNG LÀNG (MAYOR_SUCCESSION) */}
        {phaseInfo.phase === "MAYOR_SUCCESSION" && (
          <div style={{ width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>👑</div>
            <p style={{ color: "#fde047", fontWeight: "700", marginBottom: "16px" }}>
              Hãy chọn 1 người sống xứng đáng để trao lại huy hiệu Trưởng Làng:
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: "10px",
              }}
            >
              {livingPlayers
                .filter((p) => p.characterName !== user?.characterName)
                .map((p) => (
                  <button
                    key={p.characterName}
                    onClick={() => handleTransferMayor(p.characterName)}
                    style={{
                      padding: "12px",
                      borderRadius: "14px",
                      backgroundColor: "rgba(234, 179, 8, 0.25)",
                      border: "1px solid #eab308",
                      color: "#fff",
                      fontWeight: "800",
                      cursor: "pointer",
                    }}
                  >
                    👑 {p.characterName} (#{p.seatNumber})
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* PHẦN E: BỎ PHIẾU VÒNG 1 & VÒNG 2 & BẦU TRƯỞNG LÀNG */}
        {(phaseInfo.phase === "DAY_VOTE" ||
          phaseInfo.phase === "DAY_VOTE_TIE_BREAKER" ||
          phaseInfo.phase === "DAY_MAYOR_ELECTION") && (
          <div style={{ width: "100%" }}>
            {/* Lưới danh sách ứng viên / nghi phạm */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: "10px",
                maxHeight: "320px",
                overflowY: "auto",
                padding: "4px",
                marginBottom: "14px",
              }}
            >
              {livingPlayers
                .filter((p) => {
                  // Nếu là vòng Hiệp Phụ -> Chỉ hiển thị những người bị hòa phiếu
                  if (phaseInfo.phase === "DAY_VOTE_TIE_BREAKER" && phaseInfo.suspects) {
                    return phaseInfo.suspects.includes(p.characterName);
                  }
                  return true;
                })
                .map((p) => {
                  const isSelected = selectedTarget === p.characterName;

                  // Đếm số phiếu của người này
                  const voterNames = Object.entries(dayVotes)
                    .filter(([vName, tName]) => tName === p.characterName)
                    .map(([vName]) => vName);

                  return (
                    <button
                      key={p.characterName}
                      disabled={!isAlive}
                      onClick={() => handleVoteSuspect(p.characterName)}
                      style={{
                        padding: "12px 10px",
                        borderRadius: "14px",
                        backgroundColor: isSelected
                          ? "rgba(234, 179, 8, 0.3)"
                          : "rgba(30, 41, 59, 0.7)",
                        border: isSelected
                          ? "2px solid #eab308"
                          : "1px solid rgba(148, 163, 184, 0.2)",
                        color: "#f8fafc",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        cursor: isAlive ? "pointer" : "not-allowed",
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
                        {p.characterName}
                      </span>

                      {/* Hiển thị số vote */}
                      {voterNames.length > 0 && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#fde047",
                            fontWeight: "800",
                            backgroundColor: "rgba(234, 179, 8, 0.2)",
                            padding: "2px 6px",
                            borderRadius: "8px",
                          }}
                        >
                          🗳️ {voterNames.length} phiếu
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>

            {/* Nút BỎ PHIẾU TRẮNG (Chỉ xuất hiện trong Vòng 1 và Vòng 2) */}
            {phaseInfo.phase !== "DAY_MAYOR_ELECTION" && isAlive && (
              <div style={{ textAlign: "center" }}>
                <button
                  className="btn"
                  onClick={() => handleVoteSuspect("ABSTAIN")}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "14px",
                    backgroundColor:
                      selectedTarget === "ABSTAIN"
                        ? "rgba(148, 163, 184, 0.4)"
                        : "rgba(51, 65, 85, 0.6)",
                    border:
                      selectedTarget === "ABSTAIN"
                        ? "2px solid #38bdf8"
                        : "1px solid rgba(148, 163, 184, 0.3)",
                    color: "#f8fafc",
                    fontWeight: "800",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  🕊️ Bỏ Phiếu Trắng (Không nghi ngờ ai)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Footer */}
      <div style={{ textAlign: "center", fontSize: "12px", color: "#94a3b8" }}>
        {actionSubmitted
          ? "✅ Bạn đã hoàn thành lượt biểu quyết của mình."
          : "Bấm vào thẻ người chơi hoặc chọn Phiếu Trắng để biểu quyết."}
      </div>
    </div>
  );
}
