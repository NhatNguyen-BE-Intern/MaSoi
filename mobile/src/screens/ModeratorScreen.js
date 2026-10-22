import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { getTheme, typography, shapes, shadows } from '../constants/theme';
import { CARD_IMAGES, BACKGROUND_IMAGES, getCardArtwork } from '../constants/cardAssets';
import CustomButton from '../components/common/CustomButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Màn hình Bảng Điều Khiển Quản Trò (ModeratorScreen)
 * PHONG CÁCH: Tactical GM HUD - Dark Gothic & Huyết Nguyệt
 * Thiết kế cho Quản Trò thao tác cực nhanh bằng một ngón tay trong bóng tối:
 * - Ma Trận Nhân Mạng (Life & Death Matrix) kèm ảnh bài Tarot thu nhỏ
 * - Kịch bản gọi đêm (Night Sequence HUD) có ảnh đại diện vai trò và lời thoại gợi ý
 * - Bàn phím âm thanh & Rung xúc giác thời gian thực (Tactical Soundboard)
 * - Đồng hồ đếm ngược thảo luận ban ngày phong cách Gothic
 */
export default function ModeratorScreen({
  moderatorData,
  roomCode,
  isNight = true,
  onTogglePlayerStatus,
  onBroadcastSound,
  onStartTimer,
  onStopTimer,
  onPlayAgain,
  onLeaveRoom,
}) {
  const theme = getTheme(isNight);
  const players = moderatorData?.players || [];
  const nightOrder = moderatorData?.nightOrder || [];

  // Trạng thái kịch bản đêm
  const [completedSteps, setCompletedSteps] = useState({});

  // Trạng thái timer đếm ngược
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Hiệu ứng nhịp thở phát sáng viền đá Rune
  const pulseAnim = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.45,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch (e) {}
            Alert.alert('⏰ Hết giờ thảo luận!', 'Thời gian thảo luận ban ngày đã kết thúc. Quản trò hãy tiến hành biểu quyết treo cổ!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerRemaining]);

  const toggleStep = (stepIdx) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setCompletedSteps((prev) => ({
      ...prev,
      [stepIdx]: !prev[stepIdx],
    }));
  };

  const handleStartTimerLocal = (seconds) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    setTimerRemaining(seconds);
    setIsTimerRunning(true);
    if (onStartTimer) {
      onStartTimer({ roomCode, seconds, label: 'Thảo luận ban ngày' });
    }
  };

  const handleSoundTrigger = (soundType) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}
    if (onBroadcastSound) {
      onBroadcastSound({ roomCode, soundType });
    }
  };

  // Thống kê nhanh
  const alivePlayers = players.filter((p) => p.isAlive);
  const deadPlayers = players.filter((p) => !p.isAlive);
  const wolfPlayers = players.filter(
    (p) => p.role && (p.role.team === 'Sói' || p.role.name?.includes('Sói'))
  );

  return (
    <ImageBackground
      source={BACKGROUND_IMAGES.bloodMoon}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          'rgba(5, 4, 7, 0.82)',
          'rgba(14, 9, 20, 0.92)',
          'rgba(5, 4, 7, 0.98)',
        ]}
        style={styles.vignetteOverlay}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. THANH TOPBAR HUD */}
          <View style={styles.topBar}>
            <View style={styles.modBadgeWrap}>
              <MaterialCommunityIcons name="crown" size={15} color="#120B1A" />
              <Text style={styles.modBadgeText}>BẢNG ĐIỀU KHIỂN QUẢN TRÒ</Text>
            </View>

            <View style={styles.roomCodePill}>
              <Text style={styles.roomCodeText}>PHÒNG: <Text style={{ color: colors.goldLight, fontWeight: '800' }}>{roomCode}</Text></Text>
            </View>

            <TouchableOpacity
              style={styles.leaveBtn}
              onPress={() => {
                Alert.alert(
                  'Rời phòng Quản trò?',
                  'Bạn có chắc chắn muốn rời khỏi phòng chơi hiện tại không?',
                  [
                    { text: 'Ở lại', style: 'cancel' },
                    { text: 'Rời phòng', style: 'destructive', onPress: onLeaveRoom },
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="exit-outline" size={14} color="#ef4444" />
              <Text style={styles.leaveBtnText}>Thoát</Text>
            </TouchableOpacity>
          </View>

          {/* 2. THỐNG KÊ NGƯỜI CHƠI (PLAYER COUNTERS) */}
          <View style={styles.statsMatrix}>
            <View style={styles.statCell}>
              <MaterialCommunityIcons name="account-group" size={16} color="#94a3b8" />
              <Text style={styles.statVal}>{players.length}</Text>
              <Text style={styles.statLabel}>TỔNG</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCell}>
              <Ionicons name="heart" size={16} color="#34d399" />
              <Text style={[styles.statVal, { color: '#34d399' }]}>{alivePlayers.length}</Text>
              <Text style={styles.statLabel}>SỐNG</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCell}>
              <MaterialCommunityIcons name="skull" size={16} color="#ef4444" />
              <Text style={[styles.statVal, { color: '#ef4444' }]}>{deadPlayers.length}</Text>
              <Text style={styles.statLabel}>BỊ LOẠI</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCell}>
              <MaterialCommunityIcons name="wolf" size={16} color="#f87171" />
              <Text style={[styles.statVal, { color: '#f87171' }]}>{wolfPlayers.length}</Text>
              <Text style={styles.statLabel}>PHE SÓI</Text>
            </View>
          </View>

          {/* 3. BÀN PHÍM HIỆU ỨNG ÂM THANH */}
          <View style={styles.panelCard}>
            <View style={styles.panelHeader}>
              <MaterialCommunityIcons name="volume-high" size={18} color={colors.gold} />
              <Text style={styles.panelTitle}>HIỆU ỨNG ÂM THANH & RUNG</Text>
            </View>

            <View style={styles.soundGrid}>
              <TouchableOpacity
                style={[styles.soundBtn, styles.soundBtnWolf]}
                onPress={() => handleSoundTrigger('wolf')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="wolf" size={24} color="#f87171" />
                <Text style={[styles.soundBtnText, { color: '#fca5a5' }]}>Sói Hú Đêm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.soundBtn, styles.soundBtnBell]}
                onPress={() => handleSoundTrigger('bell')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="bell-ring" size={24} color="#c084fc" />
                <Text style={[styles.soundBtnText, { color: '#e9d5ff' }]}>Chuông Đêm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.soundBtn, styles.soundBtnSun]}
                onPress={() => handleSoundTrigger('morning')}
                activeOpacity={0.8}
              >
                <Ionicons name="sunny" size={24} color={colors.gold} />
                <Text style={[styles.soundBtnText, { color: colors.goldLight }]}>Bình Minh</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.soundBtn, styles.soundBtnDeath]}
                onPress={() => handleSoundTrigger('death')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="skull-crossbones" size={24} color="#ef4444" />
                <Text style={[styles.soundBtnText, { color: '#f87171' }]}>Hồi Chuông Tử</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4. ĐỒNG HỒ ĐẾM NGƯỢC THẢO LUẬN */}
          <View style={styles.panelCard}>
            <View style={styles.panelHeaderBetween}>
              <View style={styles.panelHeader}>
                <MaterialCommunityIcons name="timer-sand" size={18} color={colors.gold} />
                <Text style={styles.panelTitle}>ĐỒNG HỒ THẢO LUẬN</Text>
              </View>

              {timerRemaining > 0 && (
                <View
                  style={[
                    styles.timerCountdownBadge,
                    timerRemaining <= 10 && styles.timerCountdownDanger,
                  ]}
                >
                  <Text style={styles.timerCountdownText}>
                    {Math.floor(timerRemaining / 60)}:{timerRemaining % 60 < 10 ? '0' : ''}{timerRemaining % 60}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.timerPresetsRow}>
              {[30, 60, 90, 120].map((sec) => (
                <TouchableOpacity
                  key={sec}
                  style={styles.timerPresetBtn}
                  onPress={() => handleStartTimerLocal(sec)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.timerPresetText}>{sec}s</Text>
                </TouchableOpacity>
              ))}

              {isTimerRunning && (
                <TouchableOpacity
                  style={styles.timerStopBtn}
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch (e) {}
                    setIsTimerRunning(false);
                    setTimerRemaining(0);
                    if (onStopTimer) {
                      onStopTimer({ roomCode });
                    }
                  }}
                  activeOpacity={0.75}
                >
                  <Ionicons name="stop" size={13} color="#ef4444" />
                  <Text style={styles.timerStopText}>Dừng</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 5. KỊCH BẢN GỌI ĐÊM (THEO THỨ TỰ) */}
          <View style={styles.panelCard}>
            <View style={styles.panelHeaderBetween}>
              <View style={styles.panelHeader}>
                <Ionicons name="moon" size={18} color="#c084fc" />
                <Text style={[styles.panelTitle, { color: '#e9d5ff' }]}>
                  KỊCH BẢN GỌI ĐÊM (THEO THỨ TỰ)
                </Text>
              </View>

              <TouchableOpacity
                style={styles.resetNightBtn}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } catch (e) {}
                  setCompletedSteps({});
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={12} color={colors.gold} />
                <Text style={styles.resetNightText}>Làm mới</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.nightStepsList}>
              {nightOrder.map((step, idx) => {
                const isDone = !!completedSteps[idx];
                const stepCardArt = getCardArtwork(step.roleName, step.team);

                return (
                  <TouchableOpacity
                    key={step.step || idx}
                    style={[
                      styles.nightStepCard,
                      isDone && styles.nightStepCardDone,
                    ]}
                    onPress={() => toggleStep(idx)}
                    activeOpacity={0.8}
                  >
                    {/* Tranh minh họa vai trò thu nhỏ */}
                    <View style={styles.stepThumbBox}>
                      <Image
                        source={stepCardArt}
                        style={styles.stepThumbImg}
                        resizeMode="cover"
                      />
                    </View>

                    <View style={styles.stepContent}>
                      <View style={styles.stepTitleRow}>
                        <Ionicons
                          name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                          size={17}
                          color={isDone ? '#34d399' : colors.gold}
                        />
                        <Text
                          style={[
                            styles.stepTitleText,
                            isDone && styles.stepTitleTextDone,
                          ]}
                        >
                          {step.title}
                        </Text>
                      </View>

                      <Text style={styles.stepInstructionText} numberOfLines={2}>
                        {step.instruction}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 6. DANH SÁCH NGƯỜI CHƠI: XEM VAI TRÒ & ĐỔI TRẠNG THÁI */}
          <View style={styles.panelCard}>
            <View style={styles.panelHeader}>
              <MaterialCommunityIcons name="shield-account" size={18} color={colors.gold} />
              <Text style={styles.panelTitle}>
                DANH SÁCH NGƯỜI CHƠI (CHẠM ĐỔI SỐNG / BỊ LOẠI)
              </Text>
            </View>

            <View style={styles.playersMatrixList}>
              {players.map((p, idx) => {
                const isWolfRole =
                  p.role?.team === 'Sói' || p.role?.name?.includes('Sói');
                const pCardArt = getCardArtwork(p.role?.name, p.role?.team);

                return (
                  <TouchableOpacity
                    key={p.socketId || `${p.characterName}_${idx}`}
                    style={[
                      styles.playerMatrixCard,
                      !p.isAlive && styles.playerMatrixCardDead,
                    ]}
                    onPress={() => {
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      } catch (e) {}
                      if (onTogglePlayerStatus) {
                        onTogglePlayerStatus({
                          roomCode,
                          targetCharacterName: p.characterName,
                          targetSocketId: p.socketId,
                        });
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    {/* Ảnh Tarot thu nhỏ của người chơi */}
                    <View style={styles.playerThumbBox}>
                      <Image
                        source={pCardArt}
                        style={styles.playerThumbImg}
                        resizeMode="cover"
                      />
                    </View>

                    <View style={styles.playerDetailsCol}>
                      <Text
                        style={[
                          styles.playerCharacterName,
                          !p.isAlive && styles.playerCharacterNameDead,
                        ]}
                        numberOfLines={1}
                      >
                        {p.characterName}
                      </Text>

                      <View style={styles.playerRoleBadgeRow}>
                        <Text
                          style={[
                            styles.playerRoleName,
                            { color: isWolfRole ? '#f87171' : '#38bdf8' },
                          ]}
                        >
                          {p.role?.name || 'Chưa chia bài'}
                        </Text>
                        <Text style={styles.playerTeamName}>
                          ({p.role?.team || 'Dân'})
                        </Text>
                      </View>
                    </View>

                    {/* Nút Trạng Thái 1-Chạm */}
                    <View
                      style={[
                        styles.lifeStatusPill,
                        p.isAlive ? styles.lifeStatusAlive : styles.lifeStatusDead,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={p.isAlive ? 'heart-pulse' : 'skull-crossbones'}
                        size={15}
                        color="#ffffff"
                      />
                      <Text style={styles.lifeStatusText}>
                        {p.isAlive ? 'SỐNG' : 'BỊ LOẠI'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 7. NÚT CHƠI VÁN MỚI */}
          <View style={styles.bottomActions}>
            <CustomButton
              title="CHƠI VÁN MỚI"
              variant="gold"
              onPress={() => {
                Alert.alert(
                  'Bắt đầu ván mới?',
                  'Toàn bộ phòng sẽ quay về Phòng chờ để chuẩn bị chia bài ván tiếp theo!',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Đồng ý', onPress: onPlayAgain },
                  ]
                );
              }}
              icon={<Ionicons name="refresh" size={18} color="#120B1A" />}
              style={styles.playAgainBtn}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  vignetteOverlay: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.gold,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: shapes.radiusPill,
    ...shadows.glowGold,
  },
  modBadgeText: {
    color: '#120B1A',
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  roomCodePill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: shapes.radiusPill,
    backgroundColor: 'rgba(21, 15, 30, 0.85)',
    borderWidth: 1,
    borderColor: '#3D2B52',
  },
  roomCodeText: {
    color: '#cbd5e1',
    fontSize: 11.5,
    fontFamily: typography.fontBodyMedium,
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: shapes.radiusPill,
    backgroundColor: 'rgba(128, 12, 22, 0.35)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  leaveBtnText: {
    color: '#f87171',
    fontSize: 11.5,
    fontFamily: typography.fontBodyBold,
  },

  /* Stats Matrix */
  statsMatrix: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 15, 30, 0.92)',
    borderRadius: shapes.radiusCard,
    borderWidth: 1.5,
    borderColor: colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 8,
    ...shadows.glowGold,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statVal: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: typography.fontTitleBlack,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontFamily: typography.fontBodyBold,
    letterSpacing: 0.8,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#3D2B52',
  },

  /* Panel Card */
  panelCard: {
    width: '100%',
    backgroundColor: 'rgba(21, 15, 30, 0.94)',
    borderRadius: shapes.radiusCard,
    borderWidth: 1.5,
    borderColor: '#3D2B52',
    padding: 14,
    gap: 12,
    ...shadows.card,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panelHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    color: colors.goldLight,
    fontFamily: typography.fontTitleBlack,
    fontSize: 12.5,
    letterSpacing: 0.8,
  },

  /* Soundboard */
  soundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  soundBtn: {
    width: (SCREEN_WIDTH - 72) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: shapes.radius,
    backgroundColor: 'rgba(10, 6, 16, 0.85)',
    borderWidth: 1.5,
  },
  soundBtnWolf: {
    borderColor: '#c41e3a',
    backgroundColor: 'rgba(128, 12, 22, 0.3)',
  },
  soundBtnBell: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(126, 34, 206, 0.25)',
  },
  soundBtnSun: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  soundBtnDeath: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(77, 0, 8, 0.4)',
  },
  soundBtnText: {
    fontSize: 12.5,
    fontFamily: typography.fontBodyBold,
    letterSpacing: 0.5,
  },

  /* Timer */
  timerPresetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timerPresetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: shapes.radius,
    backgroundColor: 'rgba(10, 6, 16, 0.8)',
    borderWidth: 1,
    borderColor: '#3D2B52',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerPresetText: {
    color: colors.goldLight,
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
  },
  timerStopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: shapes.radius,
    backgroundColor: 'rgba(128, 12, 22, 0.5)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  timerStopText: {
    color: '#f87171',
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
  },
  timerCountdownBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: shapes.radiusPill,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  timerCountdownDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderColor: '#ef4444',
  },
  timerCountdownText: {
    color: colors.goldLight,
    fontFamily: typography.fontTitleBlack,
    fontSize: 15,
    letterSpacing: 1,
  },

  /* Night Order Steps */
  resetNightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: shapes.radiusPill,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  resetNightText: {
    color: colors.goldLight,
    fontSize: 10.5,
    fontFamily: typography.fontBodyMedium,
  },
  nightStepsList: {
    gap: 8,
  },
  nightStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: shapes.radius,
    backgroundColor: 'rgba(10, 6, 16, 0.75)',
    borderWidth: 1,
    borderColor: '#3D2B52',
  },
  nightStepCardDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#34d399',
  },
  stepThumbBox: {
    width: 32,
    height: 48,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  stepThumbImg: {
    width: '100%',
    height: '100%',
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepTitleText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: typography.fontBodyBold,
  },
  stepTitleTextDone: {
    color: '#34d399',
    textDecorationLine: 'line-through',
  },
  stepInstructionText: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: typography.fontBody,
    lineHeight: 15,
  },

  /* Life & Death Matrix */
  playersMatrixList: {
    gap: 8,
  },
  playerMatrixCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: shapes.radius,
    backgroundColor: 'rgba(10, 6, 16, 0.85)',
    borderWidth: 1.5,
    borderColor: '#3D2B52',
  },
  playerMatrixCardDead: {
    backgroundColor: 'rgba(40, 10, 16, 0.75)',
    borderColor: '#991b1b',
  },
  playerThumbBox: {
    width: 32,
    height: 48,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  playerThumbImg: {
    width: '100%',
    height: '100%',
  },
  playerDetailsCol: {
    flex: 1,
    gap: 2,
  },
  playerCharacterName: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: typography.fontBodyBold,
  },
  playerCharacterNameDead: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  playerRoleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playerRoleName: {
    fontSize: 12,
    fontFamily: typography.fontBodyBold,
  },
  playerTeamName: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: typography.fontBody,
  },
  lifeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: shapes.radiusPill,
    borderWidth: 1,
  },
  lifeStatusAlive: {
    backgroundColor: '#15803d',
    borderColor: '#22c55e',
    ...shadows.glowGold,
  },
  lifeStatusDead: {
    backgroundColor: '#991b1b',
    borderColor: '#ef4444',
    ...shadows.glowBlood,
  },
  lifeStatusText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: typography.fontBodyBold,
    letterSpacing: 0.5,
  },

  /* Bottom Actions */
  bottomActions: {
    width: '100%',
    marginTop: 4,
  },
  playAgainBtn: {
    minHeight: 50,
  },
});
