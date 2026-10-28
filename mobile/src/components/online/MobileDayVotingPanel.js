import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/theme';
import { getSocket } from '../../services/socket';
import { SOCKET_EVENTS } from '../../constants/socketEvents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Bảng Biểu Quyết & Bục Biện Hộ Ban Ngày trên Mobile (MobileDayVotingPanel)
 * - Bầu Cử Trưởng Làng (Ngày 1)
 * - Vòng 1 Biểu quyết chỉ định nghi phạm + Nút lớn Bỏ Phiếu Trắng
 * - Vòng 2 Hiệp Phụ (Tie-breaker 15s) khi hòa phiếu
 * - Bục Biện Hộ Spotlight: Nghi phạm độc quyền phát biểu
 * - Phán Quyết Treo Cổ: [Có Tội 💀] vs [Vô Tội ✨]
 * - Thợ Săn nổ súng & Di chúc Trưởng Làng
 */
export default function MobileDayVotingPanel({
  roomCode,
  user,
  role,
  players = [],
  isAlive = true,
  currentPhase = 'DAY_DISCUSS',
}) {
  const [phaseInfo, setPhaseInfo] = useState(null);
  const [dayVotes, setDayVotes] = useState({});
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [myJudgementVote, setMyJudgementVote] = useState(null);
  const [actionSubmitted, setActionSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [judgeUsed, setJudgeUsed] = useState(false);
  const [judgePardonAlert, setJudgePardonAlert] = useState(null);

  // Lắng nghe Socket Events ban ngày
  useEffect(() => {
    const socket = getSocket();

    const handlePhaseChanged = (data) => {
      if (
        data?.phase === 'DAY_MAYOR_ELECTION' ||
        data?.phase === 'DAY_VOTE' ||
        data?.phase === 'DAY_VOTE_TIE_BREAKER' ||
        data?.phase === 'DAY_DEFENSE' ||
        data?.phase === 'DAY_JUDGEMENT' ||
        data?.phase === 'HUNTER_REVENGE' ||
        data?.phase === 'MAYOR_SUCCESSION'
      ) {
        setPhaseInfo(data);
        setTimeLeft(data.duration || 30);
        setSelectedTarget(null);
        setMyJudgementVote(null);
        setActionSubmitted(false);
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {}
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
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      setTimeout(() => setJudgePardonAlert(null), 5000);
    };

    socket.on('phase_changed', handlePhaseChanged);
    socket.on('day_votes_updated', handleDayVotesUpdated);
    socket.on('judge_pardon_announce', handleJudgePardonAnnounce);

    return () => {
      socket.off('phase_changed', handlePhaseChanged);
      socket.off('day_votes_updated', handleDayVotesUpdated);
      socket.off('judge_pardon_announce', handleJudgePardonAnnounce);
    };
  }, []);

  // Đếm ngược thời gian
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Nếu không ở trong phase liên quan đến vote/biện hộ/phán quyết -> Không hiển thị
  if (!phaseInfo) return null;

  const isMayor = phaseInfo?.mayor === user?.characterName;
  const isAccused = phaseInfo?.suspect === user?.characterName;
  const livingPlayers = players.filter((p) => p.isAlive !== false);
  const isJudge =
    role?.code === 'JUDGE' ||
    role?.name?.toLowerCase().includes('thẩm phán') ||
    role?.name?.toLowerCase().includes('judge');

  // Thẩm Phán gõ búa phủ quyết
  const handleJudgePardon = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    const socket = getSocket();
    socket.emit('judge_pardon', { roomCode });
    setJudgeUsed(true);
  };

  // Vote nghi phạm ban ngày
  const handleVoteSuspect = (targetName) => {
    if (!isAlive || actionSubmitted) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}
    setSelectedTarget(targetName);
    const socket = getSocket();
    socket.emit('cast_day_vote', {
      roomCode,
      targetCharacterName: targetName,
    });
    setActionSubmitted(true);
  };

  // Vote Phán Quyết Có Tội / Vô Tội
  const handleJudgementVote = (verdict) => {
    if (!isAlive || actionSubmitted) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}
    setMyJudgementVote(verdict);
    const socket = getSocket();
    socket.emit('cast_judgement_vote', {
      roomCode,
      vote: verdict,
    });
    setActionSubmitted(true);
  };

  // Thợ Săn nổ súng
  const handleHunterShoot = (targetName) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    const socket = getSocket();
    socket.emit('hunter_shoot', {
      roomCode,
      targetCharacterName: targetName,
    });
    setActionSubmitted(true);
  };

  // Di chúc Trưởng Làng
  const handleTransferMayor = (targetName) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Success);
    } catch (e) {}
    const socket = getSocket();
    socket.emit('transfer_mayor', {
      roomCode,
      targetCharacterName: targetName,
    });
    setActionSubmitted(true);
  };

  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={['rgba(8, 5, 14, 0.96)', 'rgba(18, 10, 30, 0.98)', '#0C0614']}
        style={styles.panelBox}
      >
        {/* Header Ban Ngày & Đồng Hồ */}
        <View style={styles.panelHeader}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="scale-balance" size={22} color={colors.gold} />
            <Text style={[styles.panelTitle, { fontFamily: typography.fontTitleBold }]}>
              {phaseInfo.title || '⚖️ BIỂU QUYẾT TOÀN LÀNG'}
            </Text>
          </View>

          <View style={[styles.timerBadge, timeLeft <= 5 && styles.timerBadgeAlert]}>
            <Ionicons name="timer-outline" size={14} color={timeLeft <= 5 ? '#FF4D6D' : colors.gold} />
            <Text style={[styles.timerText, timeLeft <= 5 && styles.timerTextAlert]}>
              {timeLeft}s
            </Text>
          </View>
        </View>

        <Text style={styles.instructionText}>{phaseInfo.instruction}</Text>

        {/* Banner Thông Báo Thẩm Phán Phủ Quyết */}
        {judgePardonAlert && (
          <View
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.25)',
              borderWidth: 1.5,
              borderColor: '#F59E0B',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FCD34D', fontWeight: '900', fontSize: 13, textAlign: 'center' }}>
              ⚖️ THẨM PHÁN ĐÃ GÕ BÚA PHỦ QUYẾT!
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
              {judgePardonAlert.message || `Nghi phạm ${judgePardonAlert.pardonedPlayer} đã được tha bổng!`}
            </Text>
          </View>
        )}

        {/* 1. PHA BẦU TRƯỞNG LÀNG */}
        {phaseInfo.phase === 'DAY_MAYOR_ELECTION' && (
          <ScrollView style={styles.scrollArea}>
            <Text style={styles.subTitle}>CHỌN 1 NGƯỜI LÀM TRƯỞNG LÀNG (PHIẾU X2):</Text>
            <View style={styles.targetGrid}>
              {livingPlayers.map((p) => {
                const isSelected = selectedTarget === p.characterName;
                return (
                  <TouchableOpacity
                    key={p.characterName}
                    style={[styles.targetBtn, isSelected && styles.targetBtnGold]}
                    onPress={() => handleVoteSuspect(p.characterName)}
                    disabled={actionSubmitted}
                  >
                    <MaterialCommunityIcons name="star-circle" size={18} color={colors.gold} />
                    <Text style={styles.targetName} numberOfLines={1}>
                      {p.characterName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* 2. PHA BIỂU QUYẾT CHỈ ĐỊNH (VÒNG 1) & TIE-BREAKER (VÒNG 2) */}
        {(phaseInfo.phase === 'DAY_VOTE' || phaseInfo.phase === 'DAY_VOTE_TIE_BREAKER') && (
          <ScrollView style={styles.scrollArea}>
            <Text style={styles.subTitle}>
              {phaseInfo.phase === 'DAY_VOTE_TIE_BREAKER'
                ? '⚡ VÒNG 2: CHỌN 1 TRONG CÁC NGHI PHẠM HÒA PHIẾU:'
                : 'CHỌN NGƯỜI LÊN BỤC BIỆN HỘ:'}
            </Text>

            <View style={styles.targetGrid}>
              {/* Danh sách người để vote */}
              {(phaseInfo.suspects || livingPlayers.map((p) => p.characterName)).map((charName) => {
                const isSelected = selectedTarget === charName;
                const voteCount = Object.values(dayVotes).filter((v) => v === charName).length;

                return (
                  <TouchableOpacity
                    key={charName}
                    style={[styles.targetBtn, isSelected && styles.targetBtnBlood]}
                    onPress={() => handleVoteSuspect(charName)}
                    disabled={actionSubmitted}
                  >
                    <MaterialCommunityIcons name="gavel" size={18} color="#FF6B7A" />
                    <Text style={styles.targetName} numberOfLines={1}>
                      {charName}
                    </Text>
                    {voteCount > 0 && (
                      <View style={styles.voteCountBadge}>
                        <Text style={styles.voteCountText}>{voteCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Nút Lớn: Bỏ Phiếu Trắng */}
            <TouchableOpacity
              style={[styles.abstainBtn, selectedTarget === 'ABSTAIN' && styles.abstainBtnActive]}
              onPress={() => handleVoteSuspect('ABSTAIN')}
              disabled={actionSubmitted}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="dove" size={20} color="#38BDF8" />
              <Text style={styles.abstainBtnText}>BỎ PHIẾU TRẮNG (THA BỔNG) 🕊️</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* 3. PHA BỤC BIỆN HỘ SPOTLIGHT */}
        {phaseInfo.phase === 'DAY_DEFENSE' && (
          <View style={styles.defenseBox}>
            <View style={styles.spotlightRing}>
              <MaterialCommunityIcons name="microphone-variant" size={36} color={colors.gold} />
            </View>
            <Text style={styles.suspectCallout}>
              NGHI PHẠM: <Text style={{ color: '#FF6B7A', fontWeight: '900' }}>{phaseInfo.suspect}</Text>
            </Text>
            <Text style={styles.defenseDesc}>
              {isAccused
                ? '🎤 Bạn đang trên Bục Biện Hộ! Toàn bộ dân làng đang lắng nghe lời khai của bạn qua khung Chat.'
                : `Toàn bộ ngôi làng đang tạm khóa chat để lắng nghe lời biện hộ của ${phaseInfo.suspect}.`}
            </Text>

            {/* QUYỀN PHỦ QUYẾT CỦA THẨM PHÁN (PHASE BIỆN HỘ) */}
            {isJudge && isAlive && !judgeUsed && (
              <TouchableOpacity
                style={{
                  marginTop: 14,
                  backgroundColor: '#F59E0B',
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
                onPress={handleJudgePardon}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                  ⚖️ GÕ BÚA PHỦ QUYẾT (THA BỔNG NGAY - 1 LẦN/VÁN)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 4. PHA PHÁN QUYẾT TREO CỔ [CÓ TỘI] VS [VÔ TỘI] */}
        {phaseInfo.phase === 'DAY_JUDGEMENT' && (
          <View style={styles.judgementBox}>
            <Text style={styles.judgementTargetTitle}>
              PHÁN QUYẾT CHO: <Text style={{ color: '#FF6B7A', fontWeight: '900' }}>{phaseInfo.suspect}</Text>
            </Text>

            {isAccused ? (
              <View style={styles.accusedLockedBox}>
                <Ionicons name="lock-closed" size={20} color="#FF6B7A" />
                <Text style={styles.accusedLockedText}>
                  Bạn là nghi phạm trên giàn treo cổ và không được quyền tự bỏ phiếu cho bản thân!
                </Text>
              </View>
            ) : (
              <View style={styles.judgementActionsRow}>
                {/* Nút Có Tội */}
                <TouchableOpacity
                  style={[styles.judgeBtn, styles.judgeBtnGuilty, myJudgementVote === 'GUILTY' && styles.judgeBtnActive]}
                  onPress={() => handleJudgementVote('GUILTY')}
                  disabled={actionSubmitted}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="skull" size={24} color="#FFFFFF" />
                  <Text style={styles.judgeBtnText}>CÓ TỘI 💀</Text>
                  <Text style={styles.judgeBtnSub}>Treo Cổ</Text>
                </TouchableOpacity>

                {/* Nút Vô Tội */}
                <TouchableOpacity
                  style={[styles.judgeBtn, styles.judgeBtnInnocent, myJudgementVote === 'INNOCENT' && styles.judgeBtnActive]}
                  onPress={() => handleJudgementVote('INNOCENT')}
                  disabled={actionSubmitted}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="sparkles" size={24} color="#FFFFFF" />
                  <Text style={styles.judgeBtnText}>VÔ TỘI ✨</Text>
                  <Text style={styles.judgeBtnSub}>Tha Bổng</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* QUYỀN PHỦ QUYẾT CỦA THẨM PHÁN (PHASE PHÁN QUYẾT) */}
            {isJudge && isAlive && !judgeUsed && (
              <TouchableOpacity
                style={{
                  marginTop: 14,
                  backgroundColor: '#F59E0B',
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
                onPress={handleJudgePardon}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                  ⚖️ GÕ BÚA PHỦ QUYẾT (THA BỔNG NGAY - 1 LẦN/VÁN)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 5. PHA THỢ SĂN NỔ SÚNG */}
        {phaseInfo.phase === 'HUNTER_REVENGE' && (
          <ScrollView style={styles.scrollArea}>
            <Text style={[styles.subTitle, { color: '#FF8A96' }]}>
              🏹 BẠN LÀ THỢ SĂN ĐÃ CHẾT! HÃY BẮN 1 PHÁT SÚNG CUỐI CÙNG:
            </Text>
            <View style={styles.targetGrid}>
              {livingPlayers.map((p) => (
                <TouchableOpacity
                  key={p.characterName}
                  style={styles.targetBtn}
                  onPress={() => handleHunterShoot(p.characterName)}
                  disabled={actionSubmitted}
                >
                  <MaterialCommunityIcons name="target" size={18} color="#FF4D6D" />
                  <Text style={styles.targetName}>{p.characterName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* 6. PHA DI CHÚC TRƯỞNG LÀNG */}
        {phaseInfo.phase === 'MAYOR_SUCCESSION' && (
          <ScrollView style={styles.scrollArea}>
            <Text style={[styles.subTitle, { color: colors.gold }]}>
              👑 BẠN ĐÃ TỬ NẠN! HÃY CHỌN NGƯỜI SỐNG KẾ VỊ HUY HIỆU TRƯỞNG LÀNG:
            </Text>
            <View style={styles.targetGrid}>
              {livingPlayers.map((p) => (
                <TouchableOpacity
                  key={p.characterName}
                  style={styles.targetBtn}
                  onPress={() => handleTransferMayor(p.characterName)}
                  disabled={actionSubmitted}
                >
                  <MaterialCommunityIcons name="crown" size={18} color={colors.gold} />
                  <Text style={styles.targetName}>{p.characterName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Trạng thái đã gửi vote */}
        {actionSubmitted && (
          <View style={styles.submittedAlert}>
            <Ionicons name="checkmark-done-circle" size={16} color="#4ADE80" />
            <Text style={styles.submittedAlertText}>Đã ghi nhận lựa chọn của bạn vào hệ thống!</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(5, 7, 15, 0.88)',
    justifyContent: 'flex-end',
    zIndex: 950,
  },
  panelBox: {
    maxHeight: '85%',
    minHeight: '40%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panelTitle: {
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  timerBadgeAlert: {
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
    borderColor: '#EF4444',
  },
  timerText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  timerTextAlert: {
    color: '#FF6B7A',
  },
  instructionText: {
    color: '#A79BB0',
    fontSize: 12,
    marginBottom: 12,
  },
  subTitle: {
    color: '#F5ECD7',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  scrollArea: {
    maxHeight: 280,
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  targetBtn: {
    width: (SCREEN_WIDTH - 48) / 2,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(21, 15, 30, 0.85)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 82, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetBtnGold: {
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    borderColor: colors.gold,
  },
  targetBtnBlood: {
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
    borderColor: '#EF4444',
  },
  targetName: {
    color: '#F5ECD7',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  voteCountBadge: {
    backgroundColor: 'rgba(220, 38, 38, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  voteCountText: {
    color: '#FF8A96',
    fontSize: 11,
    fontWeight: '800',
  },
  abstainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    marginTop: 4,
  },
  abstainBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.3)',
    borderColor: '#38BDF8',
  },
  abstainBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
  },
  defenseBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  spotlightRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 2,
    borderColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  suspectCallout: {
    color: '#F5ECD7',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  defenseDesc: {
    color: '#A79BB0',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  judgementBox: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  judgementTargetTitle: {
    color: '#F5ECD7',
    fontSize: 14,
    marginBottom: 16,
  },
  judgementActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  judgeBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  judgeBtnGuilty: {
    backgroundColor: '#800C16',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  judgeBtnInnocent: {
    backgroundColor: '#065F46',
    borderWidth: 1.5,
    borderColor: '#34D399',
  },
  judgeBtnActive: {
    opacity: 0.9,
    transform: [{ scale: 1.03 }],
  },
  judgeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  judgeBtnSub: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    marginTop: 2,
  },
  accusedLockedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  accusedLockedText: {
    color: '#FFA8B2',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  submittedAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  submittedAlertText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '700',
  },
});
