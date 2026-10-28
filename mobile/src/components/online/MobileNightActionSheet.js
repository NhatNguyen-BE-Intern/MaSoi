import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
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
 * Màn Đêm & Bảng Hành Động Tự Động Pha Đêm trên Mobile (MobileNightActionSheet)
 * - Màn phủ tối ma mị trăng sao
 * - Lưới chọn mục tiêu kèm số ghế cho từng vai trò (Sói, Tiên Tri, Phù Thủy, Bảo Vệ, Cupid)
 * - Bầy Sói vote cắn sói thời gian thực kèm móng vuốt và cảnh báo hòa phiếu 5s
 * - Tiên Tri soi bài (lật mở báo phe Sói / phe Dân)
 * - Phù Thủy dùng bình Cứu / Độc
 * - Nút Đi ngủ sớm / Xong lượt (skip_night_turn)
 */
export default function MobileNightActionSheet({
  roomCode,
  user,
  role,
  players = [],
  isAlive = true,
  currentPhase = 'NIGHT_START',
}) {
  const [nightPrompt, setNightPrompt] = useState(null);
  const [wolfVotes, setWolfVotes] = useState({});
  const [tieWarning, setTieWarning] = useState('');
  const [seerResult, setSeerResult] = useState(null);
  const [fortuneTellerResult, setFortuneTellerResult] = useState(null);
  const [beholderResult, setBeholderResult] = useState(null);
  const [shadowHunterResult, setShadowHunterResult] = useState(null);
  const [manipulatedNotice, setManipulatedNotice] = useState('');
  const [witchData, setWitchData] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedPair, setSelectedPair] = useState([]);
  const [actionDone, setActionDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [phaseInfo, setPhaseInfo] = useState({
    title: '🌙 Màn Đêm Buông Xuống',
    instruction: 'Cả làng đang say ngủ trong tĩnh mịch...',
  });

  // Lắng nghe Socket Events pha đêm
  useEffect(() => {
    const socket = getSocket();

    const handlePhaseChanged = (data) => {
      if (data?.phase?.startsWith('NIGHT_')) {
        setPhaseInfo({
          title: data.title || '🌙 Màn Đêm',
          instruction: data.instruction || '',
        });
        setTimeLeft(data.duration || 20);
        setSelectedTarget(null);
        setSelectedPair([]);
        setTieWarning('');
        setActionDone(false);

        if (data.phase === 'NIGHT_START' || data.phase === 'NIGHT_END') {
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
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
    };

    const handleWolfVotesUpdated = (data) => {
      if (data?.votes) {
        setWolfVotes(data.votes);
      }
    };

    const handleWolfTieWarning = (msg) => {
      setTieWarning(msg);
      setTimeLeft(5);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
    };

    const handleSeerReveal = (result) => {
      setSeerResult(result);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    };

    const handleFortuneTellerReveal = (result) => {
      setFortuneTellerResult(result);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    };

    const handleBeholderReveal = (result) => {
      setBeholderResult(result);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    };

    const handleShadowHunterResult = (result) => {
      setShadowHunterResult(result);
      try {
        Haptics.notificationAsync(
          result?.success
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning
        );
      } catch (e) {}
    };

    const handleManipulatedNotice = (data) => {
      setManipulatedNotice(data?.message || 'Tâm trí bạn đã bị thao túng!');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
    };

    const handleWitchPrompt = (data) => {
      setWitchData(data);
      setNightPrompt({ actionType: 'WITCH_ACTION' });
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
    };

    const handleActionResult = () => {
      setActionDone(true);
    };

    socket.on('phase_changed', handlePhaseChanged);
    socket.on('night_action_prompt', handleActionPrompt);
    socket.on('wolf_votes_updated', handleWolfVotesUpdated);
    socket.on('wolf_vote_tie_warning', handleWolfTieWarning);
    socket.on('seer_reveal', handleSeerReveal);
    socket.on('fortune_teller_reveal', handleFortuneTellerReveal);
    socket.on('beholder_reveal', handleBeholderReveal);
    socket.on('shadow_hunter_result', handleShadowHunterResult);
    socket.on('manipulated_notice', handleManipulatedNotice);
    socket.on('witch_prompt', handleWitchPrompt);
    socket.on('night_action_result', handleActionResult);

    return () => {
      socket.off('phase_changed', handlePhaseChanged);
      socket.off('night_action_prompt', handleActionPrompt);
      socket.off('wolf_votes_updated', handleWolfVotesUpdated);
      socket.off('wolf_vote_tie_warning', handleWolfTieWarning);
      socket.off('seer_reveal', handleSeerReveal);
      socket.off('fortune_teller_reveal', handleFortuneTellerReveal);
      socket.off('beholder_reveal', handleBeholderReveal);
      socket.off('shadow_hunter_result', handleShadowHunterResult);
      socket.off('manipulated_notice', handleManipulatedNotice);
      socket.off('witch_prompt', handleWitchPrompt);
      socket.off('night_action_result', handleActionResult);
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

  // Thao tác Sói vote cắn
  const handleWolfVote = (targetCharName) => {
    if (actionDone) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}
    setSelectedTarget(targetCharName);
    const socket = getSocket();
    socket.emit('vote_wolf_kill', {
      roomCode,
      targetCharacterName: targetCharName,
    });
  };

  // Thao tác Submit hành động cá nhân
  const handleConfirmAction = () => {
    const socket = getSocket();
    if (!nightPrompt) return;

    if (nightPrompt.actionType === 'CUPID_PAIR') {
      if (selectedPair.length !== 2) {
        return Alert.alert('Lỗi', 'Thần Tình Yêu phải chọn đúng 2 người để ghép đôi!');
      }
      socket.emit('submit_night_action', {
        roomCode,
        actionType: 'CUPID_PAIR',
        targetPair: selectedPair,
      });
    } else if (nightPrompt.actionType === 'DARK_CUPID_PAIR') {
      if (selectedPair.length !== 2) {
        return Alert.alert('Chọn 2 người', 'Cupid Bóng Tối phải chọn đúng 2 người để kết đôi định mệnh!');
      }
      socket.emit('submit_night_action', {
        roomCode,
        actionType: 'DARK_CUPID_PAIR',
        targetPair: selectedPair,
      });
    } else if (nightPrompt.actionType === 'MANIPULATOR_TARGET') {
      if (!selectedTarget) return Alert.alert('Chọn mục tiêu', 'Vui lòng chọn 1 người để thao túng tâm trí!');
      socket.emit('submit_night_action', {
        roomCode,
        actionType: 'MANIPULATOR_TARGET',
        targetCharacterName: selectedTarget,
      });
    } else if (nightPrompt.actionType === 'FORTUNE_TELLER_INSPECT') {
      if (!selectedTarget) return Alert.alert('Chọn mục tiêu', 'Vui lòng chọn 1 người để soi thấu chân tướng!');
      socket.emit('submit_night_action', {
        roomCode,
        actionType: 'FORTUNE_TELLER_INSPECT',
        targetCharacterName: selectedTarget,
      });
    } else if (nightPrompt.actionType === 'GUARD_PROTECT') {
      if (!selectedTarget) return;
      socket.emit('submit_night_action', {
        roomCode,
        actionType: 'GUARD_PROTECT',
        targetCharacterName: selectedTarget,
      });
    } else if (
      nightPrompt.actionType === 'SEER_PEEK' ||
      nightPrompt.actionType === 'SEER_INSPECT'
    ) {
      if (!selectedTarget) return;
      socket.emit('submit_night_action', {
        roomCode,
        actionType: 'SEER_INSPECT',
        targetCharacterName: selectedTarget,
      });
    } else if (nightPrompt.actionType === 'WHITE_WOLF_KILL') {
      socket.emit('submit_night_action', {
        roomCode,
        actionType: 'WHITE_WOLF_KILL',
        targetCharacterName: selectedTarget,
      });
    } else if (nightPrompt.actionType === 'DOPPELGANGER_CHOOSE') {
      if (!selectedTarget) return Alert.alert('Chọn mục tiêu', 'Vui lòng chọn 1 người sống làm hình mẫu!');
      socket.emit('submit_night_action', {
        roomCode,
        actionType: 'DOPPELGANGER_CHOOSE',
        targetCharacterName: selectedTarget,
      });
    } else if (nightPrompt.actionType === 'TROUBLEMAKER_SWAP') {
      if (selectedPair.length !== 2) return Alert.alert('Chọn 2 người', 'Kẻ Đánh Tráo phải chọn đủ 2 người để hoán đổi!');
      socket.emit('submit_night_action', {
        roomCode,
        actionType: 'TROUBLEMAKER_SWAP',
        targetPair: selectedPair,
      });
    } else if (nightPrompt.actionType === 'SERIAL_KILLER_STAB') {
      if (!selectedTarget) return Alert.alert('Chọn mục tiêu', 'Vui lòng chọn 1 người để hạ sát!');
      socket.emit('submit_night_action', {
        roomCode,
        actionType: 'SERIAL_KILLER_STAB',
        targetCharacterName: selectedTarget,
      });
    } else if (nightPrompt.actionType === 'PRIEST_BLESS') {
      if (!selectedTarget) return Alert.alert('Chọn mục tiêu', 'Thầy Tu hãy chọn 1 người để ban phước lành!');
      socket.emit('submit_night_action', {
        roomCode,
        actionType: 'PRIEST_BLESS',
        targetCharacterName: selectedTarget,
      });
    } else if (nightPrompt.actionType === 'ARSONIST_ACTION') {
      const targets = selectedPair.length > 0 ? selectedPair : selectedTarget ? [selectedTarget] : [];
      if (targets.length === 0) return Alert.alert('Chọn mục tiêu', 'Vui lòng chọn 1-2 người để tẩm xăng hoặc bấm Châm Lửa!');
      socket.emit('submit_night_action', {
        roomCode,
        actionType: 'ARSONIST_ACTION',
        targetCharacterNames: targets,
      });
    } else if (nightPrompt.actionType === 'SHADOW_HUNTER_SHOOT') {
      if (!selectedTarget) return Alert.alert('Chọn mục tiêu', 'Vui lòng chọn 1 mục tiêu để nổ súng!');
      socket.emit('submit_night_action', {
        roomCode,
        actionType: 'SHADOW_HUNTER_SHOOT',
        targetCharacterName: selectedTarget,
      });
    } else if (nightPrompt.actionType === 'BEHOLDER_DONE') {
      socket.emit('submit_night_action', {
        roomCode,
        actionType: 'BEHOLDER_DONE',
      });
    }

    setActionDone(true);
  };

  // Thao tác Kẻ Độc Hành Châm Lửa
  const handleArsonistIgnite = () => {
    const socket = getSocket();
    socket.emit('submit_night_action', {
      roomCode,
      actionType: 'ARSONIST_ACTION',
      subAction: 'IGNITE',
      ignite: true,
    });
    setActionDone(true);
  };

  // Thao tác Kẻ Trộm đổi bài thừa
  const handleThiefSwap = (chosenCardIndex) => {
    const socket = getSocket();
    socket.emit('submit_night_action', {
      roomCode,
      actionType: 'THIEF_SWAP',
      chosenCardIndex,
    });
    setActionDone(true);
  };

  // Thao tác Sói Đầu Đàn Lây Nhiễm
  const handleAlphaWolfInfect = () => {
    if (!selectedTarget) {
      return Alert.alert('Chọn mục tiêu', 'Vui lòng chọn 1 người sống để lây nhiễm!');
    }
    const socket = getSocket();
    socket.emit('submit_night_action', {
      roomCode,
      actionType: 'ALPHA_WOLF_INFECT',
      targetCharacterName: selectedTarget,
    });
    setActionDone(true);
  };

  // Thao tác Phù Thủy
  const handleWitchAct = (useHeal, poisonTarget) => {
    const socket = getSocket();
    socket.emit('submit_night_action', {
      roomCode,
      actionType: 'WITCH_ACTION',
      witchAction: useHeal ? 'HEAL' : poisonTarget ? 'POISON' : 'SKIP',
      targetCharacterName: poisonTarget || null,
      useHeal: Boolean(useHeal),
      poisonTarget: poisonTarget || null,
    });
    setActionDone(true);
  };

  // Bỏ qua lượt / Đi ngủ sớm
  const handleSkip = () => {
    const socket = getSocket();
    socket.emit('skip_night_turn', { roomCode });
    setActionDone(true);
  };

  const isMyTurn = Boolean(nightPrompt) && isAlive;
  const availableTargets = nightPrompt?.availableTargets || [];

  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={['rgba(5, 3, 8, 0.96)', 'rgba(15, 8, 24, 0.98)', '#0A0512']}
        style={styles.sheetBox}
      >
        {/* Thanh đếm ngược & Tiêu đề pha đêm */}
        <View style={styles.sheetTopBar}>
          <View style={styles.phaseTitleRow}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={20} color={colors.gold} />
            <Text style={[styles.phaseTitleText, { fontFamily: typography.fontTitleBold }]}>
              {phaseInfo.title}
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

        {/* Cảnh báo hòa phiếu của Sói */}
        {tieWarning ? (
          <View style={styles.tieWarningBox}>
            <Ionicons name="warning" size={16} color="#FF4D6D" />
            <Text style={styles.tieWarningText}>{tieWarning}</Text>
          </View>
        ) : null}

        {/* Thông báo bị Thao Túng Tâm Trí */}
        {manipulatedNotice ? (
          <View
            style={[
              styles.tieWarningBox,
              { backgroundColor: 'rgba(168, 85, 247, 0.25)', borderColor: '#A855F7' },
            ]}
          >
            <MaterialCommunityIcons name="spider-web" size={16} color="#C084FC" />
            <Text style={[styles.tieWarningText, { color: '#E9D5FF' }]}>
              {manipulatedNotice}
            </Text>
          </View>
        ) : null}

        {/* TH1: Đang đến lượt hành động của mình */}
        {isMyTurn && !actionDone ? (
          <ScrollView style={styles.actionBody} showsVerticalScrollIndicator={false}>
            {/* Vai trò Sói */}
            {nightPrompt.actionType === 'WOLF_KILL' && (
              <View>
                {nightPrompt.doubleKill ? (
                  <View style={styles.frenzyBanner}>
                    <MaterialCommunityIcons name="fire" size={16} color="#FF6B7A" />
                    <Text style={styles.frenzyText}>
                      CƠN CUỒNG NỘ: Sói Con đã chết, bầy Sói được cắn 2 nạn nhân đêm nay!
                    </Text>
                  </View>
                ) : null}

                <Text style={styles.roleSubHeader}>🐺 HÃY CHỌN CON MỒI ĐỂ TIÊU DIỆT:</Text>
                <View style={styles.targetGrid}>
                  {availableTargets.map((targetName) => {
                    const isSelected = selectedTarget === targetName;
                    const votesForThis = Object.entries(wolfVotes).filter(([, v]) => v === targetName);

                    return (
                      <TouchableOpacity
                        key={targetName}
                        style={[styles.targetBtn, isSelected && styles.targetBtnWolfSelected]}
                        onPress={() => handleWolfVote(targetName)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name="knife-military"
                          size={20}
                          color={isSelected ? '#FF4D6D' : '#D4C8DE'}
                        />
                        <Text style={[styles.targetName, isSelected && { color: '#FF4D6D' }]}>
                          {targetName}
                        </Text>

                        {votesForThis.length > 0 && (
                          <View style={styles.wolfVotePill}>
                            <MaterialCommunityIcons name="paw" size={10} color="#FF6B7A" />
                            <Text style={styles.wolfVoteCount}>{votesForThis.length}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {nightPrompt.canInfect && selectedTarget && (
                  <TouchableOpacity
                    style={styles.infectBtn}
                    onPress={handleAlphaWolfInfect}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="dna" size={18} color="#FFFFFF" />
                    <Text style={styles.infectBtnText}>
                      LÂY NHIỄM {selectedTarget} (1 LẦN/VÁN)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Vai trò Sói Trắng (Đêm 2, 4...) */}
            {nightPrompt.actionType === 'WHITE_WOLF_KILL' && (
              <View>
                <Text style={styles.roleSubHeader}>🐺 SÓI TRẮNG: CHỌN 1 CON SÓI KHÁC ĐỂ XÉ XÁC:</Text>
                <View style={styles.targetGrid}>
                  {availableTargets.map((targetName) => {
                    const isSelected = selectedTarget === targetName;
                    return (
                      <TouchableOpacity
                        key={targetName}
                        style={[styles.targetBtn, isSelected && styles.targetBtnWolfSelected]}
                        onPress={() => setSelectedTarget(targetName)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name="skull-crossbones"
                          size={20}
                          color={isSelected ? '#FF4D6D' : '#E2E8F0'}
                        />
                        <Text style={[styles.targetName, isSelected && { color: '#FF4D6D' }]}>
                          {targetName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={styles.whiteWolfSkipBtn}
                  onPress={() => {
                    setSelectedTarget(null);
                    const socket = getSocket();
                    socket.emit('submit_night_action', {
                      roomCode,
                      actionType: 'WHITE_WOLF_KILL',
                      targetCharacterName: null,
                    });
                    setActionDone(true);
                  }}
                >
                  <Text style={styles.whiteWolfSkipText}>🐺 Không Cắn Đồng Loại Đêm Nay</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Vai trò Tiên Tri */}
            {(nightPrompt.actionType === 'SEER_PEEK' || nightPrompt.actionType === 'SEER_INSPECT') && (
              <View>
                <Text style={styles.roleSubHeader}>🔮 CHỌN 1 NGƯỜI ĐỂ SOI RÕ THÂN PHẬN:</Text>
                {seerResult ? (
                  <View style={styles.seerResultCard}>
                    <Text style={styles.seerResultTitle}>KẾT QUẢ SOI:</Text>
                    <Text style={styles.seerResultTarget}>{seerResult.targetCharacterName}</Text>
                    <View
                      style={[
                        styles.seerFactionBadge,
                        seerResult.team === 'Sói' ? styles.factionWolf : styles.factionGood,
                      ]}
                    >
                      <Text style={styles.seerFactionText}>
                        PHE: {seerResult.team === 'Sói' ? '🐺 MA SÓI (ÁC QUỶ)' : '✨ DÂN LÀNG (LƯƠNG THIỆN)'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.targetGrid}>
                    {availableTargets.map((targetName) => (
                      <TouchableOpacity
                        key={targetName}
                        style={[styles.targetBtn, selectedTarget === targetName && styles.targetBtnSeerSelected]}
                        onPress={() => setSelectedTarget(targetName)}
                      >
                        <MaterialCommunityIcons name="eye-outline" size={20} color="#38BDF8" />
                        <Text style={styles.targetName}>{targetName}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Vai trò Phù Thủy */}
            {nightPrompt.actionType === 'WITCH_ACTION' && witchData && (
              <View>
                <View style={styles.witchNoticeBox}>
                  <Text style={styles.witchNoticeLabel}>NẠN NHÂN BỊ SÓI CẮN ĐÊM NAY:</Text>
                  <Text style={styles.witchVictimName}>
                    {witchData.victim ? `🩸 ${witchData.victim}` : '✨ Đêm nay không ai bị cắn!'}
                  </Text>
                </View>

                {witchData.victim && witchData.canHeal && (
                  <TouchableOpacity
                    style={styles.witchHealBtn}
                    onPress={() => handleWitchAct(true, null)}
                  >
                    <MaterialCommunityIcons name="heart-plus" size={18} color="#FFFFFF" />
                    <Text style={styles.witchBtnText}>DÙNG BÌNH CỨU SỐNG</Text>
                  </TouchableOpacity>
                )}

                {witchData.canPoison && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.roleSubHeader}>HOẶC DÙNG BÌNH ĐỘC HẠ GỤC:</Text>
                    <View style={styles.targetGrid}>
                      {(witchData.alivePlayers || []).map((targetName) => (
                        <TouchableOpacity
                          key={targetName}
                          style={styles.targetBtn}
                          onPress={() => handleWitchAct(false, targetName)}
                        >
                          <MaterialCommunityIcons name="bottle-tonic-skull" size={18} color="#A855F7" />
                          <Text style={styles.targetName}>{targetName}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Vai trò Bảo Vệ */}
            {nightPrompt.actionType === 'GUARD_PROTECT' && (
              <View>
                <Text style={styles.roleSubHeader}>🛡️ CHỌN 1 NGƯỜI ĐỂ CHE CHẮN ĐÊM NAY:</Text>
                <View style={styles.targetGrid}>
                  {availableTargets.map((targetName) => (
                    <TouchableOpacity
                      key={targetName}
                      style={[styles.targetBtn, selectedTarget === targetName && styles.targetBtnGuardSelected]}
                      onPress={() => setSelectedTarget(targetName)}
                    >
                      <MaterialCommunityIcons name="shield-check" size={20} color="#34D399" />
                      <Text style={styles.targetName}>{targetName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Vai trò Cupid */}
            {nightPrompt.actionType === 'CUPID_PAIR' && (
              <View>
                <Text style={styles.roleSubHeader}>💘 CHỌN 2 NGƯỜI ĐỂ GHÉP ĐÔI TÌNH YÊU ({selectedPair.length}/2):</Text>
                <View style={styles.targetGrid}>
                  {availableTargets.map((targetName) => {
                    const isPicked = selectedPair.includes(targetName);
                    return (
                      <TouchableOpacity
                        key={targetName}
                        style={[styles.targetBtn, isPicked && styles.targetBtnCupidSelected]}
                        onPress={() => {
                          if (isPicked) {
                            setSelectedPair(selectedPair.filter((p) => p !== targetName));
                          } else if (selectedPair.length < 2) {
                            setSelectedPair([...selectedPair, targetName]);
                          }
                        }}
                      >
                        <MaterialCommunityIcons name="heart-multiple" size={18} color="#F472B6" />
                        <Text style={styles.targetName}>{targetName}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Vai trò Cupid Nâng Cao (Dark Cupid) */}
            {nightPrompt.actionType === 'DARK_CUPID_PAIR' && (
              <View>
                <Text style={styles.roleSubHeader}>
                  💘 CUPID BÓNG TỐI: CHỌN 2 NGƯỜI KẾT ĐÔI ĐỊNH MỆNH ({selectedPair.length}/2):
                </Text>
                <View style={styles.targetGrid}>
                  {availableTargets.map((targetName) => {
                    const isPicked = selectedPair.includes(targetName);
                    return (
                      <TouchableOpacity
                        key={targetName}
                        style={[styles.targetBtn, isPicked && styles.targetBtnCupidSelected]}
                        onPress={() => {
                          if (isPicked) {
                            setSelectedPair(selectedPair.filter((p) => p !== targetName));
                          } else if (selectedPair.length < 2) {
                            setSelectedPair([...selectedPair, targetName]);
                          }
                        }}
                      >
                        <MaterialCommunityIcons name="heart-broken" size={18} color="#C084FC" />
                        <Text style={styles.targetName}>{targetName}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Vai trò Phù Thủy Thao Túng (Manipulator Witch) */}
            {nightPrompt.actionType === 'MANIPULATOR_TARGET' && (
              <View>
                <Text style={styles.roleSubHeader}>
                  🕸️ PHÙ THỦY THAO TÚNG: CHỌN 1 NGƯỜI ĐỂ KHỐNG CHẾ TÂM TRÍ:
                </Text>
                <View style={styles.targetGrid}>
                  {availableTargets.map((targetName) => {
                    const isSelected = selectedTarget === targetName;
                    return (
                      <TouchableOpacity
                        key={targetName}
                        style={[
                          styles.targetBtn,
                          isSelected && {
                            backgroundColor: 'rgba(168, 85, 247, 0.3)',
                            borderColor: '#A855F7',
                          },
                        ]}
                        onPress={() => setSelectedTarget(targetName)}
                      >
                        <MaterialCommunityIcons name="spider-web" size={20} color="#C084FC" />
                        <Text style={styles.targetName}>{targetName}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Vai trò Thầy Bói (Fortune Teller) */}
            {nightPrompt.actionType === 'FORTUNE_TELLER_INSPECT' && (
              <View>
                <Text style={styles.roleSubHeader}>
                  🔮 THẦY BÓI: CHỌN 1 NGƯỜI ĐỂ SOI THẤU CHÂN TƯỚNG:
                </Text>
                {fortuneTellerResult ? (
                  <View
                    style={[
                      styles.seerResultCard,
                      {
                        borderColor: '#A855F7',
                        backgroundColor: 'rgba(26, 16, 43, 0.95)',
                      },
                    ]}
                  >
                    <Text style={styles.seerResultTitle}>CHÂN TƯỚNG VAI TRÒ CHI TIẾT:</Text>
                    <Text style={[styles.seerResultTarget, { color: '#E9D5FF' }]}>
                      {fortuneTellerResult.targetCharacterName}
                    </Text>
                    <View
                      style={[
                        styles.seerFactionBadge,
                        {
                          backgroundColor:
                            fortuneTellerResult.team === 'Sói'
                              ? 'rgba(220, 38, 38, 0.3)'
                              : 'rgba(56, 189, 248, 0.3)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.seerFactionText,
                          {
                            color:
                              fortuneTellerResult.team === 'Sói' ? '#FF6B7A' : '#38BDF8',
                            fontWeight: '800',
                          },
                        ]}
                      >
                        {fortuneTellerResult.roleName} (Phe {fortuneTellerResult.team})
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: '#D4C8DE',
                        fontSize: 12,
                        marginTop: 8,
                        textAlign: 'center',
                        lineHeight: 18,
                      }}
                    >
                      {fortuneTellerResult.description}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.targetGrid}>
                    {availableTargets.map((targetName) => (
                      <TouchableOpacity
                        key={targetName}
                        style={[
                          styles.targetBtn,
                          selectedTarget === targetName && {
                            backgroundColor: 'rgba(168, 85, 247, 0.3)',
                            borderColor: '#A855F7',
                          },
                        ]}
                        onPress={() => setSelectedTarget(targetName)}
                      >
                        <MaterialCommunityIcons name="crystal-ball" size={20} color="#C084FC" />
                        <Text style={styles.targetName}>{targetName}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Vai trò Doppelganger (Người Hóa Sói) */}
            {nightPrompt.actionType === 'DOPPELGANGER_CHOOSE' && (
              <View>
                <Text style={styles.roleSubHeader}>🎭 CHỌN 1 NGƯỜI LÀM HÌNH MẪU THỪA KẾ:</Text>
                <View style={styles.targetGrid}>
                  {availableTargets.map((targetName) => (
                    <TouchableOpacity
                      key={targetName}
                      style={[styles.targetBtn, selectedTarget === targetName && styles.targetBtnSeerSelected]}
                      onPress={() => setSelectedTarget(targetName)}
                    >
                      <MaterialCommunityIcons name="drama-masks" size={20} color="#F59E0B" />
                      <Text style={styles.targetName}>{targetName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Vai trò Kẻ Đánh Tráo (Troublemaker) */}
            {nightPrompt.actionType === 'TROUBLEMAKER_SWAP' && (
              <View>
                <Text style={styles.roleSubHeader}>🃏 CHỌN 2 NGƯỜI ĐỂ BÍ MẬT HOÁN ĐỔI VAI ({selectedPair.length}/2):</Text>
                <View style={styles.targetGrid}>
                  {availableTargets.map((targetName) => {
                    const isPicked = selectedPair.includes(targetName);
                    return (
                      <TouchableOpacity
                        key={targetName}
                        style={[styles.targetBtn, isPicked && styles.targetBtnSeerSelected]}
                        onPress={() => {
                          if (isPicked) {
                            setSelectedPair(selectedPair.filter((p) => p !== targetName));
                          } else if (selectedPair.length < 2) {
                            setSelectedPair([...selectedPair, targetName]);
                          }
                        }}
                      >
                        <MaterialCommunityIcons name="swap-horizontal" size={20} color="#38BDF8" />
                        <Text style={styles.targetName}>{targetName}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Vai trò Sát Thủ (Serial Killer) */}
            {nightPrompt.actionType === 'SERIAL_KILLER_STAB' && (
              <View>
                <Text style={styles.roleSubHeader}>🔪 CHỌN 1 NẠN NHÂN ĐỂ ĐÂM CHẾT (XUYÊN KHIÊN):</Text>
                <View style={styles.targetGrid}>
                  {availableTargets.map((targetName) => (
                    <TouchableOpacity
                      key={targetName}
                      style={[styles.targetBtn, selectedTarget === targetName && styles.targetBtnWolfSelected]}
                      onPress={() => setSelectedTarget(targetName)}
                    >
                      <MaterialCommunityIcons name="knife-military" size={20} color="#EF4444" />
                      <Text style={styles.targetName}>{targetName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Vai trò Thầy Tu (Priest) */}
            {nightPrompt.actionType === 'PRIEST_BLESS' && (
              <View>
                <Text style={styles.roleSubHeader}>✝️ THẦY TU: CHỌN 1 NGƯỜI ĐỂ BAN PHƯỚC LÀNH (CỨU SỐNG & GIẢI XĂNG):</Text>
                <View style={styles.targetGrid}>
                  {availableTargets.map((targetName) => (
                    <TouchableOpacity
                      key={targetName}
                      style={[
                        styles.targetBtn,
                        selectedTarget === targetName && {
                          backgroundColor: 'rgba(56, 189, 248, 0.3)',
                          borderColor: '#38BDF8',
                        },
                      ]}
                      onPress={() => setSelectedTarget(targetName)}
                    >
                      <MaterialCommunityIcons name="cross" size={20} color="#38BDF8" />
                      <Text style={styles.targetName}>{targetName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Vai trò Kẻ Độc Hành (Arsonist) */}
            {nightPrompt.actionType === 'ARSONIST_ACTION' && (
              <View>
                <Text style={styles.roleSubHeader}>
                  🔥 KẺ ĐỘC HÀNH: TẨM XĂNG 1-2 NGƯỜI ({selectedPair.length}/2) HOẶC BẤM CHÂM LỬA:
                </Text>

                {nightPrompt.canIgnite && (
                  <TouchableOpacity
                    style={[
                      styles.confirmBtn,
                      {
                        backgroundColor: '#EF4444',
                        marginBottom: 12,
                        paddingVertical: 12,
                      },
                    ]}
                    onPress={handleArsonistIgnite}
                  >
                    <Text style={[styles.confirmBtnText, { color: '#FFFFFF' }]}>
                      🔥 CHÂM LỬA THIÊU RỤI ({nightPrompt.dousedPlayers?.length || 0} NGƯỜI DÍNH XĂNG)
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={styles.targetGrid}>
                  {availableTargets.map((targetName) => {
                    const isPicked = selectedPair.includes(targetName) || selectedTarget === targetName;
                    const isDoused = nightPrompt.dousedPlayers?.includes(targetName);
                    return (
                      <TouchableOpacity
                        key={targetName}
                        style={[
                          styles.targetBtn,
                          isPicked && {
                            backgroundColor: 'rgba(245, 158, 11, 0.3)',
                            borderColor: '#F59E0B',
                          },
                        ]}
                        onPress={() => {
                          if (selectedPair.includes(targetName)) {
                            setSelectedPair(selectedPair.filter((p) => p !== targetName));
                          } else if (selectedPair.length < 2) {
                            setSelectedPair([...selectedPair, targetName]);
                          }
                          setSelectedTarget(targetName);
                        }}
                      >
                        <MaterialCommunityIcons
                          name={isDoused ? 'barrel' : 'gas-cylinder'}
                          size={18}
                          color={isDoused ? '#F59E0B' : '#FB923C'}
                        />
                        <Text style={styles.targetName}>{targetName}</Text>
                        {isDoused && (
                          <Text style={{ fontSize: 9, color: '#F59E0B', fontWeight: '800' }}>DÍNH XĂNG</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Vai trò Thợ Săn Bóng Đêm */}
            {nightPrompt.actionType === 'SHADOW_HUNTER_SHOOT' && (
              <View>
                <Text style={styles.roleSubHeader}>🏹 CHỌN 1 MỤC TIÊU ĐỂ BẮN (CHỈ HẠ PHE THỨ 3):</Text>
                <View style={styles.targetGrid}>
                  {availableTargets.map((targetName) => (
                    <TouchableOpacity
                      key={targetName}
                      style={[
                        styles.targetBtn,
                        selectedTarget === targetName && {
                          backgroundColor: 'rgba(251, 146, 60, 0.3)',
                          borderColor: '#FB923C',
                        },
                      ]}
                      onPress={() => setSelectedTarget(targetName)}
                    >
                      <MaterialCommunityIcons name="bow-arrow" size={20} color="#FB923C" />
                      <Text style={styles.targetName}>{targetName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Vai trò Kẻ Trộm (Thief) */}
            {nightPrompt.actionType === 'THIEF_SWAP' && nightPrompt.centerCards && (
              <View>
                <Text style={styles.roleSubHeader}>🎴 2 LÁ BÀI RÌA THỪA NGOÀI BÀN:</Text>
                <View style={{ gap: 10, marginTop: 8 }}>
                  {nightPrompt.centerCards.map((card, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.targetBtn, { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 }]}
                      onPress={() => handleThiefSwap(idx)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <MaterialCommunityIcons
                          name={card.team === 'Sói' ? 'paw' : 'account-cowboy-hat'}
                          size={24}
                          color={card.team === 'Sói' ? '#EF4444' : '#38BDF8'}
                        />
                        <View>
                          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>{card.name}</Text>
                          <Text style={{ color: '#94A3B8', fontSize: 11 }}>{card.description}</Text>
                        </View>
                      </View>
                      <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 12 }}>Đổi ➡️</Text>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={[styles.whiteWolfSkipBtn, { marginTop: 6 }]}
                    onPress={() => handleThiefSwap(null)}
                  >
                    <Text style={styles.whiteWolfSkipText}>Giữ Nguyên Vai Dân Làng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        ) : (
          /* TH2: Không phải lượt hoặc đã chọn xong */
          <View style={styles.idleView}>
            <MaterialCommunityIcons name="sleep" size={48} color="rgba(212, 175, 55, 0.4)" />
            <Text style={styles.idleText}>
              {actionDone
                ? '✨ Bạn đã hoàn thành lượt hành động đêm nay.'
                : 'Bạn đang say ngủ, hãy giữ im lặng cho đến bình minh...'}
            </Text>
          </View>
        )}

        {/* Thanh nút bấm hành động xác nhận */}
        <View style={styles.bottomBar}>
          {isMyTurn && !actionDone && nightPrompt.actionType !== 'THIEF_SWAP' && (
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                !selectedTarget && selectedPair.length !== 2 && styles.confirmBtnDisabled,
              ]}
              onPress={handleConfirmAction}
              disabled={!selectedTarget && selectedPair.length !== 2}
            >
              <Text style={styles.confirmBtnText}>Xác Nhận Lựa Chọn</Text>
            </TouchableOpacity>
          )}

          {isMyTurn && (
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipBtnText}>Đi Ngủ Sớm / Bỏ Qua</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  sheetBox: {
    maxHeight: '85%',
    minHeight: '45%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  sheetTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phaseTitleText: {
    color: colors.gold,
    fontSize: 15,
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
  tieWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: 10,
  },
  tieWarningText: {
    color: '#FFA8B2',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  actionBody: {
    maxHeight: 280,
  },
  roleSubHeader: {
    color: '#F5ECD7',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetBtn: {
    width: (SCREEN_WIDTH - 48) / 2,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(21, 15, 30, 0.8)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 82, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetBtnWolfSelected: {
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
    borderColor: '#EF4444',
  },
  targetBtnSeerSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.3)',
    borderColor: '#38BDF8',
  },
  targetBtnGuardSelected: {
    backgroundColor: 'rgba(52, 211, 153, 0.3)',
    borderColor: '#34D399',
  },
  targetBtnCupidSelected: {
    backgroundColor: 'rgba(244, 114, 182, 0.3)',
    borderColor: '#F472B6',
  },
  targetName: {
    color: '#F5ECD7',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  wolfVotePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(220, 38, 38, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  wolfVoteCount: {
    color: '#FFA8B2',
    fontSize: 10,
    fontWeight: '800',
  },
  seerResultCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
    padding: 16,
    alignItems: 'center',
  },
  seerResultTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  seerResultTarget: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginVertical: 6,
  },
  seerFactionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
  },
  factionWolf: {
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  factionGood: {
    backgroundColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  seerFactionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  witchNoticeBox: {
    backgroundColor: 'rgba(30, 20, 44, 0.8)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 82, 0.7)',
    marginBottom: 10,
  },
  witchNoticeLabel: {
    color: '#A79BB0',
    fontSize: 11,
  },
  witchVictimName: {
    color: '#FF6B7A',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  witchHealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
  },
  witchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  idleView: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  idleText: {
    color: '#A79BB0',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  confirmBtn: {
    flex: 1.5,
    backgroundColor: colors.gold,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: 'rgba(60, 45, 80, 0.5)',
  },
  confirmBtnText: {
    color: '#120B1A',
    fontSize: 13,
    fontWeight: '800',
  },
  skipBtn: {
    flex: 1,
    backgroundColor: 'rgba(21, 15, 30, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 82, 0.8)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  skipBtnText: {
    color: '#A79BB0',
    fontSize: 12,
  },
  frenzyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  frenzyText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  infectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  infectBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  whiteWolfSkipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'rgba(30, 20, 44, 0.7)',
    marginTop: 12,
  },
  whiteWolfSkipText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
});

