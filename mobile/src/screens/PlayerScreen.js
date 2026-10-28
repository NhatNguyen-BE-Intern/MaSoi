import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { getTheme, typography, shapes, shadows } from '../constants/theme';
import { CARD_IMAGES, BACKGROUND_IMAGES, getCardArtwork } from '../constants/cardAssets';
import CustomButton from '../components/common/CustomButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 64, 300);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.48);

/**
 * Màn hình Thẻ Bài Người Chơi (PlayerScreen)
 * PHONG CÁCH: Dark Gothic & Huyết Nguyệt (Blood Moon Werewolf Tarot)
 * - Tích hợp lật thẻ bài 3D thời gian thực (Card Flip 3D)
 * - Minh họa Gothic Tarot nguyên bản, khung vàng cổ & đá rune
 * - Hiệu ứng sương mù khí quyển Huyết Nguyệt
 * - Bảng thử nghiệm (Dev Role Switcher) để người dùng duyệt toàn bộ thẻ bài ngay trên điện thoại
 */
export default function PlayerScreen({
  user,
  role,
  roomCode,
  isAlive = true,
  activeTimer = null,
  isNight = true,
  isHost = false,
  onLeaveRoom,
  onPlayAgain,
  onBroadcastSound,
  onStartTimer,
  onStopTimer,
  isPreview = false,
}) {
  const theme = getTheme(isNight);

  // Cho phép chuyển đổi vai trò xem trước khi thử nghiệm giao diện
  const [activeRole, setActiveRole] = useState(
    role || {
      name: 'Ma Sói',
      team: 'Sói',
      description:
        'Thức giấc vào ban đêm cùng đồng bọn để chọn 1 con mồi tiêu diệt. Ban ngày ẩn mình giữa dân làng và gieo rắc nghi ngờ.',
    }
  );
  const [aliveStatus, setAliveStatus] = useState(isAlive);

  // Đồng bộ trạng thái Sống/Chết thời gian thực từ Quản trò / Server
  useEffect(() => {
    setAliveStatus(isAlive);
  }, [isAlive]);

  // Đồng bộ vai trò khi ván mới được chia
  useEffect(() => {
    if (role) {
      setActiveRole(role);
    }
  }, [role]);

  // Trạng thái Lật Thẻ Bài 3D
  const [isFlipped, setIsFlipped] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Hiệu ứng nhịp thở phát sáng viền bài (Pulsing Glow)
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Xử lý Lật / Úp Thẻ Bài 3D
  const handleToggleFlip = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}

    if (isFlipped) {
      Animated.spring(animatedValue, {
        toValue: 0,
        friction: 8,
        tension: 12,
        useNativeDriver: true,
      }).start();
      setIsFlipped(false);
    } else {
      Animated.spring(animatedValue, {
        toValue: 180,
        friction: 8,
        tension: 12,
        useNativeDriver: true,
      }).start();
      setIsFlipped(true);
    }
  };

  // Úp bài khẩn cấp
  const handleSnapClose = () => {
    if (!isFlipped) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {}
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
    setIsFlipped(false);
  };

  // Tính toán góc xoay 3D
  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ perspective: 1200 }, { rotateY: frontInterpolate }],
  };
  const backAnimatedStyle = {
    transform: [{ perspective: 1200 }, { rotateY: backInterpolate }],
  };

  // Thông tin thẻ bài
  const roleName = activeRole.name || 'Dân Làng';
  const roleTeam = activeRole.team || 'Dân';
  const roleDesc =
    activeRole.description ||
    'Ngủ say khi màn đêm buông xuống. Ban ngày cùng thảo luận tìm ra ma sói.';

  const isLycanOrDoppel =
    activeRole.code === 'LYCAN' ||
    roleName.toLowerCase().includes('bán sói') ||
    roleName.toLowerCase().includes('lycan') ||
    activeRole.code === 'DOPPELGANGER' ||
    roleName.toLowerCase().includes('hóa sói') ||
    roleName.toLowerCase().includes('doppelganger');

  const isWolf =
    !isLycanOrDoppel &&
    (roleTeam === 'Sói' ||
      roleName.toLowerCase().includes('sói') ||
      roleName.toLowerCase().includes('wolf'));
  const isSeer =
    roleName.toLowerCase().includes('tiên tri') ||
    roleName.toLowerCase().includes('seer');
  const isGuard =
    roleName.toLowerCase().includes('bảo vệ') ||
    roleName.toLowerCase().includes('guard');
  const isWitch =
    roleName.toLowerCase().includes('phù thủy') ||
    roleName.toLowerCase().includes('witch');
  const isHunter =
    roleName.toLowerCase().includes('thợ săn') ||
    roleName.toLowerCase().includes('hunter');

  const getTeamInfo = () => {
    if (isWolf) {
      return {
        label: 'PHE MA SÓI',
        badgeColor: colors.factions.wolf,
        badgeBg: 'rgba(122, 0, 0, 0.45)',
        iconName: 'wolf',
        glowStyle: shadows.glowBlood,
      };
    }
    if (isSeer) {
      return {
        label: 'PHE DÂN LÀNG • TIÊN TRI',
        badgeColor: colors.factions.seer,
        badgeBg: 'rgba(3, 105, 161, 0.45)',
        iconName: 'crystal-ball',
        glowStyle: shadows.glowGold,
      };
    }
    if (isGuard) {
      return {
        label: 'PHE DÂN LÀNG • BẢO VỆ',
        badgeColor: colors.factions.guard,
        badgeBg: 'rgba(5, 150, 105, 0.45)',
        iconName: 'shield-star',
        glowStyle: shadows.glowGold,
      };
    }
    if (isWitch) {
      return {
        label: 'PHE DÂN LÀNG • PHÙ THỦY',
        badgeColor: colors.factions.witch,
        badgeBg: 'rgba(126, 34, 206, 0.45)',
        iconName: 'wizard-hat',
        glowStyle: shadows.glowGold,
      };
    }
    if (isHunter) {
      return {
        label: 'PHE DÂN LÀNG • THỢ SĂN',
        badgeColor: colors.factions.hunter,
        badgeBg: 'rgba(194, 65, 12, 0.45)',
        iconName: 'bow-arrow',
        glowStyle: shadows.glowGold,
      };
    }
    return {
      label: 'PHE DÂN LÀNG',
      badgeColor: colors.factions.villager,
      badgeBg: 'rgba(153, 115, 22, 0.45)',
      iconName: 'account-group',
      glowStyle: shadows.glowGold,
    };
  };

  const teamInfo = getTeamInfo();
  const cardArtwork = getCardArtwork(roleName, roleTeam);

  // Định dạng đồng hồ đếm ngược
  const formatTimer = (seconds) => {
    if (!seconds && seconds !== 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <ImageBackground
      source={BACKGROUND_IMAGES.bloodMoon}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Lớp gradient u tối để tôn vinh các khối giao diện */}
      <LinearGradient
        colors={[
          'rgba(5, 4, 7, 0.72)',
          'rgba(10, 7, 16, 0.88)',
          'rgba(5, 4, 7, 0.97)',
        ]}
        style={styles.vignetteOverlay}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. THANH ĐIỀU HƯỚNG TRÊN CÙNG (HUD TOPBAR) */}
          <View style={styles.topBar}>
            <View style={styles.roomPill}>
              <MaterialCommunityIcons name="door-open" size={16} color={colors.gold} />
              <Text style={styles.roomPillText}>PHÒNG: {roomCode || '---'}</Text>
            </View>

            <TouchableOpacity
              style={styles.leaveBtn}
              onPress={() => {
                Alert.alert(
                  'Rời phòng chơi?',
                  'Bạn có chắc muốn thoát khỏi phòng chơi hiện tại không?',
                  [
                    { text: 'Ở lại', style: 'cancel' },
                    { text: 'Rời phòng', style: 'destructive', onPress: onLeaveRoom },
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="exit-outline" size={15} color="#ef4444" />
              <Text style={styles.leaveBtnText}>Rời phòng</Text>
            </TouchableOpacity>
          </View>

          {/* 2. TRẠNG THÁI NẾU ĐÃ BỊ LOẠI */}
          {!aliveStatus && (
            <View style={styles.ghostBanner}>
              <View style={styles.ghostIconCircle}>
                <MaterialCommunityIcons name="skull" size={24} color="#f87171" />
              </View>
              <View style={styles.ghostTextBox}>
                <Text style={styles.ghostTitle}>💀 BẠN ĐÃ BỊ LOẠI</Text>
                <Text style={styles.ghostDesc}>
                  Bạn đã bị loại khỏi ván đấu. Vui lòng giữ bí mật vai trò và tiếp tục quan sát trận đấu!
                </Text>
              </View>
            </View>
          )}

          {/* 3. ĐỒNG HỒ ĐẾM NGƯỢC THẢO LUẬN (NẾU CÓ) */}
          {activeTimer && activeTimer.remaining > 0 && (
            <View
              style={[
                styles.timerBox,
                activeTimer.remaining <= 10 && styles.timerBoxDanger,
              ]}
            >
              <MaterialCommunityIcons
                name="timer-sand"
                size={22}
                color={activeTimer.remaining <= 10 ? '#ef4444' : colors.gold}
              />
              <Text style={styles.timerLabel}>
                {activeTimer.label || 'Thời gian thảo luận'}:
              </Text>
              <Text
                style={[
                  styles.timerCountdown,
                  activeTimer.remaining <= 10 && styles.timerCountdownDanger,
                ]}
              >
                {formatTimer(activeTimer.remaining)}
              </Text>
            </View>
          )}

          {/* 4. KHỐI TRUNG TÂM: LÁ BÀI 3D (3D FLIP CARD) */}
          <View style={styles.cardSection}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardSubTitle}>VAI TRÒ CỦA BẠN</Text>
              <Text style={styles.cardInstruction}>
                {isFlipped
                  ? 'Chạm vào thẻ để ÚP BÀI (giữ bí mật)'
                  : 'Chạm vào thẻ để LẬT BÀI xem vai trò'}
              </Text>
            </View>

            {/* Vùng Lá bài 3D có thể tương tác chạm */}
            <TouchableOpacity
              activeOpacity={0.96}
              onPress={handleToggleFlip}
              style={[styles.cardContainer, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
            >
              {/* === MẶT TRƯỚC (LÚC CHƯA LẬT / CARD BACK) === */}
              <Animated.View
                style={[
                  styles.cardFace,
                  frontAnimatedStyle,
                  { width: CARD_WIDTH, height: CARD_HEIGHT },
                ]}
              >
                <Image
                  source={CARD_IMAGES.back}
                  style={styles.cardImage}
                  resizeMode="cover"
                />

                {/* Khung viền kim loại */}
                <View
                  style={[
                    styles.goldFrameOverlay,
                    { borderColor: colors.gold },
                  ]}
                />

                {/* Banner chạm mở ở đáy lá bài */}
                <LinearGradient
                  colors={['transparent', 'rgba(10, 6, 16, 0.85)', 'rgba(5, 3, 8, 0.96)']}
                  style={styles.cardBackFooter}
                >
                  <MaterialCommunityIcons
                    name="shield-lock"
                    size={26}
                    color={colors.gold}
                  />
                  <Text style={styles.cardBackHint}>CHẠM ĐỂ LẬT BÀI</Text>
                  <Text style={styles.cardBackSubHint}>GIỮ BÍ MẬT VAI TRÒ</Text>
                </LinearGradient>
              </Animated.View>

              {/* === MẶT SAU (KHI ĐÃ LẬT MỞ / CARD REVEALED) === */}
              <Animated.View
                style={[
                  styles.cardFace,
                  styles.cardFaceBack,
                  backAnimatedStyle,
                  { width: CARD_WIDTH, height: CARD_HEIGHT },
                ]}
              >
                <Image
                  source={cardArtwork}
                  style={styles.cardImage}
                  resizeMode="cover"
                />

                {/* Khung viền hoàng kim Gothic cổ điển */}
                <View
                  style={[
                    styles.goldFrameOverlay,
                    { borderColor: teamInfo.badgeColor },
                  ]}
                />

                {/* Khối thông tin vai trò ở chân lá bài */}
                <LinearGradient
                  colors={[
                    'transparent',
                    'rgba(11, 7, 18, 0.88)',
                    'rgba(7, 4, 11, 0.98)',
                  ]}
                  style={styles.roleCardOverlay}
                >
                  {/* Huy hiệu phe phái */}
                  <View
                    style={[
                      styles.factionBadge,
                      {
                        backgroundColor: teamInfo.badgeBg,
                        borderColor: teamInfo.badgeColor,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={teamInfo.iconName}
                      size={15}
                      color={teamInfo.badgeColor}
                    />
                    <Text
                      style={[styles.factionBadgeText, { color: teamInfo.badgeColor }]}
                    >
                      {teamInfo.label}
                    </Text>
                  </View>

                  {/* Tên vai trò Gothic */}
                  <Text style={styles.roleNameText}>{roleName.toUpperCase()}</Text>

                  {/* Mô tả kỹ năng */}
                  <Text style={styles.roleDescText} numberOfLines={3}>
                    {roleDesc}
                  </Text>
                </LinearGradient>

                {/* Huy hiệu che mờ nếu đã bị loại */}
                {!aliveStatus && (
                  <View style={styles.cardDeadCover}>
                    <MaterialCommunityIcons name="skull" size={48} color="#ef4444" />
                    <Text style={styles.cardDeadText}>ĐÃ BỊ LOẠI</Text>
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>

            {/* NÚT THAO TÁC NHANH: ÚP BÀI & LẬT BÀI */}
            <View style={styles.actionRow}>
              {isFlipped ? (
                <CustomButton
                  title="ÚP BÀI (BẢO MẬT)"
                  variant="blood"
                  onPress={handleSnapClose}
                  icon={<Ionicons name="eye-off-outline" size={18} color="#fff" />}
                  style={styles.heroActionBtn}
                />
              ) : (
                <CustomButton
                  title="LẬT BÀI XEM VAI TRÒ"
                  variant="gold"
                  onPress={handleToggleFlip}
                  icon={<Ionicons name="eye-outline" size={18} color="#120B1A" />}
                  style={styles.heroActionBtn}
                />
              )}
            </View>

            {/* CÔNG CỤ CHỦ PHÒNG (CHO TRƯỜNG HỢP CHƠI KHÔNG CÓ QUẢN TRÒ RIÊNG) */}
            {isHost && (
              <View
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(21, 15, 30, 0.85)',
                  borderWidth: 1,
                  borderColor: 'rgba(212, 175, 55, 0.35)',
                  borderRadius: shapes.radius,
                  padding: 12,
                  marginTop: 14,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: colors.gold, fontFamily: typography.fontBodyBold, fontSize: 12 }}>
                    👑 CÔNG CỤ CHỦ PHÒNG
                  </Text>
                  <Text style={{ color: '#94a3b8', fontSize: 10 }}>Phát cho cả phòng</Text>
                </View>

                {/* Sound buttons */}
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                  <TouchableOpacity
                    style={[styles.roleChip, { flex: 1, alignItems: 'center', paddingVertical: 6 }]}
                    onPress={() => onBroadcastSound?.({ roomCode, soundType: 'wolf' })}
                  >
                    <Text style={styles.roleChipText}>🐺 Sói Hú</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleChip, { flex: 1, alignItems: 'center', paddingVertical: 6 }]}
                    onPress={() => onBroadcastSound?.({ roomCode, soundType: 'bell' })}
                  >
                    <Text style={styles.roleChipText}>🔔 Chuông Đêm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleChip, { flex: 1, alignItems: 'center', paddingVertical: 6 }]}
                    onPress={() => onBroadcastSound?.({ roomCode, soundType: 'morning' })}
                  >
                    <Text style={styles.roleChipText}>☀️ Trời Sáng</Text>
                  </TouchableOpacity>
                </View>

                {/* Timer buttons */}
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <Text style={{ color: '#94a3b8', fontSize: 11 }}>⏱️ Đếm giờ:</Text>
                  <TouchableOpacity
                    style={[styles.roleChip, { flex: 1, alignItems: 'center', paddingVertical: 5 }]}
                    onPress={() => onStartTimer?.({ roomCode, seconds: 60, label: 'Thảo luận ban ngày' })}
                  >
                    <Text style={styles.roleChipText}>60s</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleChip, { flex: 1, alignItems: 'center', paddingVertical: 5 }]}
                    onPress={() => onStartTimer?.({ roomCode, seconds: 120, label: 'Thảo luận ban ngày' })}
                  >
                    <Text style={styles.roleChipText}>120s</Text>
                  </TouchableOpacity>
                  {activeTimer ? (
                    <TouchableOpacity
                      style={[styles.roleChip, { flex: 1, alignItems: 'center', paddingVertical: 5, borderColor: '#ef4444' }]}
                      onPress={() => onStopTimer?.({ roomCode })}
                    >
                      <Text style={[styles.roleChipText, { color: '#ef4444' }]}>Dừng</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}

            {/* NÚT CHƠI VÁN MỚI (CHO CHẾ ĐỘ TỰ ĐỘNG HOẶC HẾT VÁN) */}
            {onPlayAgain ? (
              <View style={[styles.actionRow, { marginTop: 10 }]}>
                <CustomButton
                  title="CHƠI VÁN MỚI"
                  variant="secondary"
                  onPress={() => {
                    Alert.alert(
                      'Bắt đầu ván mới?',
                      'Bạn có muốn đưa cả phòng quay về Phòng chờ chuẩn bị chia bài mới?',
                      [
                        { text: 'Hủy', style: 'cancel' },
                        { text: 'Đồng ý', onPress: onPlayAgain },
                      ]
                    );
                  }}
                  icon={<Ionicons name="refresh" size={18} color={isNight ? colors.gold : '#120B1A'} />}
                  style={styles.heroActionBtn}
                />
              </View>
            ) : null}
          </View>

          {/* 5. KHỐI THỬ NGHIỆM GIAO DIỆN (CHỈ HIỂN THỊ TRONG CHẾ ĐỘ XEM TRƯỚC PREVIEW) */}
          {isPreview && (
            <View style={styles.devPanel}>
            <View style={styles.devPanelHeader}>
              <MaterialCommunityIcons name="cards-playing-outline" size={18} color={colors.gold} />
              <Text style={styles.devPanelTitle}>Duyệt thử các lá bài (Design Preview)</Text>
            </View>
            <Text style={styles.devPanelDesc}>
              Bấm vào từng nhân vật để xem minh họa Tarot Gothic và kiểm tra hiệu ứng lật bài 3D:
            </Text>

            <View style={styles.roleChipGrid}>
              {[
                {
                  name: 'Ma Sói',
                  team: 'Sói',
                  desc: 'Mỗi đêm thức giấc cùng đồng bọn chọn 1 nạn nhân để cắn xé. Ban ngày cải trang làm dân làng lương thiện.',
                },
                {
                  name: 'Tiên Tri',
                  team: 'Dân',
                  desc: 'Mỗi đêm thức dậy chỉ tay soi danh tính 1 người chơi để biết họ thuộc phe Sói hay phe Dân.',
                },
                {
                  name: 'Phù Thủy',
                  team: 'Dân',
                  desc: 'Sở hữu 2 bình độc dược quyền năng: 1 bình Cứu sống người bị sói cắn và 1 bình Độc giết chết 1 kẻ bất kỳ.',
                },
                {
                  name: 'Bảo Vệ',
                  team: 'Dân',
                  desc: 'Mỗi đêm chỉ định 1 người chơi bất kỳ để che chắn khỏi nanh vuốt sói dữ.',
                },
                {
                  name: 'Thợ Săn',
                  team: 'Dân',
                  desc: 'Khi bị loại (bị cắn chết hoặc treo cổ), lập tức giương cung bắn chết thêm 1 người bất kỳ.',
                },
                {
                  name: 'Dân Làng',
                  team: 'Dân',
                  desc: 'Không có quyền năng ban đêm, ban ngày cùng dân làng biểu quyết treo cổ kẻ bị nghi là ma sói.',
                },
              ].map((item) => {
                const isSelected = activeRole.name === item.name;
                return (
                  <TouchableOpacity
                    key={item.name}
                    style={[
                      styles.roleChip,
                      isSelected && styles.roleChipActive,
                    ]}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch (e) {}
                      setActiveRole(item);
                      if (!isFlipped) {
                        handleToggleFlip();
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        isSelected && styles.roleChipTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Toggle Sống / Chết để duyệt trạng thái Hồn Ma */}
            <View style={styles.statusToggleRow}>
              <Text style={styles.statusToggleLabel}>Thử nghiệm trạng thái:</Text>
              <TouchableOpacity
                style={[
                  styles.statusToggleBtn,
                  aliveStatus ? styles.statusBtnAlive : styles.statusBtnDead,
                ]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (e) {}
                  setAliveStatus(!aliveStatus);
                }}
              >
                <MaterialCommunityIcons
                  name={aliveStatus ? 'heart-pulse' : 'skull-crossbones'}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.statusToggleBtnText}>
                  {aliveStatus ? 'ĐANG SỐNG (Bình thường)' : 'ĐÃ BỊ LOẠI'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    paddingTop: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  roomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(21, 15, 30, 0.88)',
    borderWidth: 1.5,
    borderColor: colors.gold,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: shapes.radiusPill,
    ...shadows.glowGold,
  },
  roomPillText: {
    color: colors.goldLight,
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    letterSpacing: 1.2,
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(40, 10, 15, 0.75)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: shapes.radiusPill,
  },
  leaveBtnText: {
    color: '#f87171',
    fontSize: 12,
    fontFamily: typography.fontBodyMedium,
  },
  ghostBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 10, 15, 0.85)',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    borderRadius: shapes.radius,
    padding: 12,
    marginBottom: 14,
    gap: 12,
    ...shadows.glowBlood,
  },
  ghostIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostTextBox: {
    flex: 1,
  },
  ghostTitle: {
    color: '#f87171',
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    letterSpacing: 0.8,
  },
  ghostDesc: {
    color: '#fca5a5',
    fontSize: 12,
    fontFamily: typography.fontBody,
    lineHeight: 16,
    marginTop: 2,
  },
  timerBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21, 15, 30, 0.92)',
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderRadius: shapes.radius,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
    ...shadows.glowGold,
  },
  timerBoxDanger: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(45, 10, 15, 0.94)',
    ...shadows.glowBlood,
  },
  timerLabel: {
    color: '#f1f5f9',
    fontSize: 14,
    fontFamily: typography.fontBodyMedium,
  },
  timerCountdown: {
    color: colors.goldLight,
    fontFamily: typography.fontBodyBold,
    fontSize: 20,
    letterSpacing: 1.5,
  },
  timerCountdownDanger: {
    color: '#ef4444',
  },
  cardSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  cardSubTitle: {
    color: colors.gold,
    fontSize: 13,
    fontFamily: typography.fontBodyBold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cardInstruction: {
    color: '#cbd5e1',
    fontSize: 13,
    fontFamily: typography.fontBody,
    marginTop: 4,
  },
  cardContainer: {
    borderRadius: shapes.radiusCard,
    ...shadows.card,
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: shapes.radiusCard,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    backgroundColor: '#0c0714',
  },
  cardFaceBack: {
    backgroundColor: '#0c0714',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  goldFrameOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: shapes.radiusCard,
    borderWidth: 2.5,
  },
  cardBackFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 4,
  },
  cardBackHint: {
    color: colors.gold,
    fontFamily: typography.fontTitleBlack,
    fontSize: 15,
    letterSpacing: 1.5,
  },
  cardBackSubHint: {
    color: '#94a3b8',
    fontFamily: typography.fontBody,
    fontSize: 11,
    letterSpacing: 1,
  },
  roleCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 6,
  },
  factionBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: shapes.radiusPill,
    borderWidth: 1,
  },
  factionBadgeText: {
    fontSize: 11,
    fontFamily: typography.fontBodyBold,
    letterSpacing: 0.8,
  },
  roleNameText: {
    color: '#ffffff',
    fontFamily: typography.fontTitleBlack,
    fontSize: 22,
    letterSpacing: 1.2,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  roleDescText: {
    color: '#e2e8f0',
    fontFamily: typography.fontBody,
    fontSize: 12.5,
    lineHeight: 17,
  },
  cardDeadCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 7, 10, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  cardDeadText: {
    color: '#ef4444',
    fontFamily: typography.fontTitleBlack,
    fontSize: 22,
    letterSpacing: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  actionRow: {
    width: '100%',
    marginTop: 18,
  },
  heroActionBtn: {
    minHeight: 50,
  },
  devPanel: {
    width: '100%',
    backgroundColor: 'rgba(21, 15, 30, 0.88)',
    borderRadius: shapes.radiusCard,
    borderWidth: 1.5,
    borderColor: '#3D2B52',
    padding: 16,
    marginTop: 8,
    gap: 12,
    ...shadows.subtle,
  },
  devPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  devPanelTitle: {
    color: colors.gold,
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  devPanelDesc: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: typography.fontBody,
    lineHeight: 17,
  },
  roleChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: shapes.radiusPill,
    backgroundColor: 'rgba(10, 6, 16, 0.8)',
    borderWidth: 1,
    borderColor: '#3E2E50',
  },
  roleChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.goldLight,
  },
  roleChipText: {
    color: '#cbd5e1',
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
  },
  roleChipTextActive: {
    color: '#120B1A',
    fontFamily: typography.fontBodyBold,
  },
  statusToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2C1F3D',
  },
  statusToggleLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: typography.fontBody,
  },
  statusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: shapes.radiusPill,
  },
  statusBtnAlive: {
    backgroundColor: '#15803d',
  },
  statusBtnDead: {
    backgroundColor: '#b91c1c',
  },
  statusToggleBtnText: {
    color: '#ffffff',
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
  },
});
