import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  TextInput,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { getTheme, typography, shapes, shadows } from '../constants/theme';
import { CARD_IMAGES, BACKGROUND_IMAGES } from '../constants/cardAssets';
import CustomButton from '../components/common/CustomButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RUNE_SLOT_COUNT = 6;

/**
 * Màn hình Sảnh Chờ (LobbyScreen)
 * PHONG CÁCH: Dark Gothic & Huyết Nguyệt (Blood Moon Werewolf RPG)
 * - Khung Tước Hiệu Hiệp Sĩ (Noble Crest Card) mạ vàng hoàng gia
 * - Khối Hero Đá Rune (Rune Monoliths) với ánh lửa Huyết Nguyệt
 * - Bộ nhập mã phòng Khắc Ấn Thạch (Rune Slot Input) từng ô ký tự phát sáng
 * - Nút 1-chạm dán mã phòng từ khay nhớ tạm (Paste Clipboard)
 * - Khối truy cập nhanh Thư Tịch Thần Bài & Liên Minh Hảo Hữu
 */
export default function LobbyScreen({
  user,
  onLogout,
  onCreateRoom,
  onJoinRoom,
  onOpenFriends,
  onOpenDictionary,
  isNight = true,
}) {
  const [roomCode, setRoomCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const inputRef = useRef(null);

  // Hiệu ứng nhịp thở phát sáng viền đá Rune
  const pulseAnim = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.45,
          duration: 1700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleJoinSubmit = () => {
    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
      return Alert.alert('Chưa nhập mã phòng', 'Vui lòng nhập mã phòng để tham gia!');
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}
    if (onJoinRoom) {
      onJoinRoom(cleanCode);
    }
  };

  // Dán nhanh mã phòng từ khay nhớ tạm
  const handlePasteClipboard = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const text = await Clipboard.getStringAsync();
      if (text) {
        // Lọc lấy các ký tự chữ và số
        const sanitized = text.replace(/[^a-zA-Z0-9]/g, '').slice(0, RUNE_SLOT_COUNT).toUpperCase();
        if (sanitized) {
          setRoomCode(sanitized);
        }
      }
    } catch (err) {
      console.log('Lỗi đọc clipboard:', err);
    }
  };

  // Render từng ô ký tự Khắc Ấn Thạch (Rune Slots)
  const renderRuneSlots = () => {
    const slots = [];
    const codeChars = roomCode.split('');

    for (let i = 0; i < RUNE_SLOT_COUNT; i++) {
      const char = codeChars[i] || '';
      const isCurrent = i === codeChars.length;
      const isFilled = Boolean(char);

      slots.push(
        <View
          key={i}
          style={[
            styles.runeSlot,
            isFilled && styles.runeSlotFilled,
            isCurrent && styles.runeSlotCurrent,
          ]}
        >
          <Text
            style={[
              styles.runeSlotText,
              isFilled && styles.runeSlotTextFilled,
            ]}
          >
            {char || '•'}
          </Text>
        </View>
      );
    }
    return slots;
  };

  return (
    <ImageBackground
      source={BACKGROUND_IMAGES.bloodMoon}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          'rgba(5, 4, 7, 0.75)',
          'rgba(12, 8, 18, 0.88)',
          'rgba(5, 4, 7, 0.98)',
        ]}
        style={styles.vignetteOverlay}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. THẺ TƯỚC HIỆU HIỆP SĨ (NOBLE CREST CARD) */}
          <View style={styles.nobleCard}>
            <View style={styles.avatarCrestWrap}>
              <View style={styles.avatarCrestCircle}>
                <MaterialCommunityIcons name="shield-crown" size={24} color={colors.gold} />
              </View>
              <Animated.View
                style={[
                  styles.avatarCrestGlow,
                  { opacity: pulseAnim },
                ]}
              />
            </View>

            <View style={styles.nobleInfo}>
              <View style={styles.nobleRankBadge}>
                <Text style={styles.nobleRankText}>NGƯỜI CHƠI</Text>
              </View>
              <Text style={styles.nobleName} numberOfLines={1}>
                {user?.characterName || user?.username || 'Người chơi'}
              </Text>
              <Text style={styles.nobleAccount}>
                Tài khoản: <Text style={styles.nobleAccountBold}>@{user?.username}</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.logoutPill}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (e) {}
                Alert.alert(
                  'Đăng xuất tài khoản?',
                  'Bạn có chắc chắn muốn đăng xuất tài khoản không?',
                  [
                    { text: 'Ở lại', style: 'cancel' },
                    { text: 'Đăng xuất', style: 'destructive', onPress: onLogout },
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={16} color="#ef4444" />
              <Text style={styles.logoutPillText}>Thoát</Text>
            </TouchableOpacity>
          </View>

          {/* 2. TIÊU ĐỀ SẢNH ĐÁ GOTHIC */}
          <View style={styles.hallBanner}>
            <View style={styles.castleIconEmblem}>
              <MaterialCommunityIcons name="castle" size={36} color={colors.gold} />
              <Animated.View
                style={[
                  styles.castleGlowRing,
                  { opacity: pulseAnim },
                ]}
              />
            </View>
            <Text style={styles.hallTitle}>SẢNH CHỜ TRÒ CHƠI</Text>
            <View style={styles.goldDividerLine} />
            <Text style={styles.hallSubtitle}>
              Tạo phòng riêng cùng bạn bè hoặc nhập mã phòng để tham gia
            </Text>
          </View>

          {/* 3. CẶP KHỐI HERO ĐÁ RUNE (RUNE MONOLITHS) */}
          <View style={styles.heroMonolithsContainer}>
            {/* Monolith 1: Khởi Tạo Phòng Chơi */}
            <TouchableOpacity
              style={styles.monolithCard}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                } catch (e) {}
                onCreateRoom();
              }}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['rgba(158, 27, 38, 0.85)', 'rgba(61, 0, 7, 0.95)']}
                style={styles.monolithGradient}
              >
                <View style={styles.monolithIconBox}>
                  <MaterialCommunityIcons name="campfire" size={32} color="#ffffff" />
                </View>

                <View style={styles.monolithContent}>
                  <Text style={styles.monolithTag}>DÀNH CHO CHỦ PHÒNG</Text>
                  <Text style={styles.monolithTitle}>TẠO PHÒNG MỚI</Text>
                  <Text style={styles.monolithDesc}>
                    Tạo phòng chơi riêng, tùy chọn các vai trò và mời bạn bè vào
                  </Text>
                </View>

                <View style={styles.monolithArrowCircle}>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Monolith 2: Tham Gia Bàn Chơi (Kích hoạt bộ nhập Rune) */}
            <TouchableOpacity
              style={[styles.monolithCard, styles.monolithCardGold]}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } catch (e) {}
                setShowJoinModal(true);
                setTimeout(() => inputRef.current?.focus(), 150);
              }}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['rgba(35, 25, 48, 0.92)', 'rgba(15, 10, 22, 0.98)']}
                style={styles.monolithGradient}
              >
                <View style={[styles.monolithIconBox, styles.monolithIconBoxGold]}>
                  <MaterialCommunityIcons name="shield-key" size={30} color={colors.gold} />
                </View>

                <View style={styles.monolithContent}>
                  <Text style={[styles.monolithTag, { color: colors.gold }]}>
                    THAM GIA PHÒNG
                  </Text>
                  <Text style={[styles.monolithTitle, { color: colors.goldLight }]}>
                    NHẬP MÃ VÀO PHÒNG
                  </Text>
                  <Text style={styles.monolithDesc}>
                    Nhập mã phòng 4-6 số từ bạn bè để vào chơi ngay
                  </Text>
                </View>

                <View style={[styles.monolithArrowCircle, styles.monolithArrowGold]}>
                  <Ionicons name="key-outline" size={18} color={colors.gold} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* 4. HỘP NHẬP KHẮC ẤN THẠCH RUNE (KHI BẤM VÀO PHÒNG) */}
          {showJoinModal && (
            <View style={styles.runeModalBox}>
              <View style={styles.runeModalHeader}>
                <MaterialCommunityIcons name="numeric" size={22} color={colors.gold} />
                <Text style={styles.runeModalTitle}>NHẬP MÃ PHÒNG CHƠI</Text>
                <TouchableOpacity
                  onPress={() => setShowJoinModal(false)}
                  style={styles.closeModalBtn}
                >
                  <Ionicons name="close" size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.runeModalInstruction}>
                Nhập mã phòng gồm 4-6 số hoặc dán từ khay nhớ tạm:
              </Text>

              {/* Dãy Khắc Ấn Thạch (Rune Slots) */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => inputRef.current?.focus()}
                style={styles.runeSlotsRow}
              >
                {renderRuneSlots()}
              </TouchableOpacity>

              {/* TextInput ẩn để đón bàn phím native */}
              <TextInput
                ref={inputRef}
                value={roomCode}
                onChangeText={(text) => {
                  try {
                    Haptics.selectionAsync();
                  } catch (e) {}
                  setRoomCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                }}
                autoCapitalize="characters"
                maxLength={RUNE_SLOT_COUNT}
                style={styles.hiddenInput}
                autoFocus={true}
              />

              {/* Nút thao tác bổ trợ */}
              <View style={styles.runeActionButtons}>
                <TouchableOpacity
                  style={styles.pasteClipboardBtn}
                  onPress={handlePasteClipboard}
                  activeOpacity={0.75}
                >
                  <Ionicons name="clipboard-outline" size={16} color={colors.gold} />
                  <Text style={styles.pasteClipboardText}>Dán mã đã chép</Text>
                </TouchableOpacity>

                {roomCode.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={() => setRoomCode('')}
                  >
                    <Text style={styles.clearBtnText}>Xóa</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.runeSubmitRow}>
                <CustomButton
                  title="VÀO PHÒNG CHƠI"
                  variant="gold"
                  onPress={handleJoinSubmit}
                  icon={<Ionicons name="enter-outline" size={18} color="#120B1A" />}
                  style={{ flex: 2 }}
                />
                <CustomButton
                  title="ĐÓNG"
                  variant="secondary"
                  onPress={() => setShowJoinModal(false)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {/* 5. CẶP KHỐI TRUY CẬP NHANH: TỪ ĐIỂN THẦN BÀI & HẢO HỮU */}
          <View style={styles.libraryRow}>
            {/* Card 1: Từ Điển Thần Bài Tarot */}
            <TouchableOpacity
              style={styles.libraryCard}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (e) {}
                onOpenDictionary();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(28, 20, 42, 0.9)', 'rgba(13, 9, 20, 0.98)']}
                style={styles.libraryGradient}
              >
                <View style={styles.libraryHeader}>
                  <View style={[styles.libraryIconBox, { borderColor: '#a855f7' }]}>
                    <MaterialCommunityIcons name="cards-playing" size={20} color="#c084fc" />
                  </View>
                  <View style={styles.miniCardPreview}>
                    <Image
                      source={CARD_IMAGES.back}
                      style={styles.miniCardImg}
                      resizeMode="cover"
                    />
                  </View>
                </View>

                <Text style={[styles.libraryTitle, { color: '#e9d5ff' }]}>
                  CÁC VAI TRÒ
                </Text>
                <Text style={styles.libraryDesc}>
                  Xem chi tiết kỹ năng và luật chơi của từng vai trò
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Card 2: Bạn Bè */}
            <TouchableOpacity
              style={styles.libraryCard}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (e) {}
                onOpenFriends();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(15, 30, 25, 0.9)', 'rgba(8, 18, 14, 0.98)']}
                style={styles.libraryGradient}
              >
                <View style={styles.libraryHeader}>
                  <View style={[styles.libraryIconBox, { borderColor: '#34d399' }]}>
                    <MaterialCommunityIcons name="account-group" size={20} color="#34d399" />
                  </View>
                  <View style={[styles.miniRavenBadge, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                    <MaterialCommunityIcons name="feather" size={18} color="#34d399" />
                  </View>
                </View>

                <Text style={[styles.libraryTitle, { color: '#a7f3d0' }]}>
                  BẠN BÈ
                </Text>
                <Text style={styles.libraryDesc}>
                  Thêm bạn bè và theo dõi danh sách bạn cùng chơi
                </Text>
              </LinearGradient>
            </TouchableOpacity>
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
  scrollContainer: {
    paddingVertical: 20,
    paddingHorizontal: 18,
    gap: 16,
    alignItems: 'center',
  },

  /* 1. Noble Crest Card */
  nobleCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 15, 30, 0.92)',
    borderRadius: shapes.radiusCard,
    borderWidth: 1.5,
    borderColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    ...shadows.glowGold,
  },
  avatarCrestWrap: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCrestCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    borderWidth: 1.5,
    borderColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  avatarCrestGlow: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: colors.goldLight,
    zIndex: 1,
  },
  nobleInfo: {
    flex: 1,
    gap: 2,
  },
  nobleRankBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: shapes.radiusPill,
    marginBottom: 2,
  },
  nobleRankText: {
    color: colors.goldLight,
    fontSize: 9.5,
    fontFamily: typography.fontBodyBold,
    letterSpacing: 0.8,
  },
  nobleName: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: typography.fontTitleBlack,
    letterSpacing: 0.6,
  },
  nobleAccount: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontFamily: typography.fontBody,
  },
  nobleAccountBold: {
    color: colors.gold,
    fontFamily: typography.fontBodyMedium,
  },
  logoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: shapes.radiusPill,
    backgroundColor: 'rgba(128, 12, 22, 0.4)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutPillText: {
    color: '#f87171',
    fontSize: 11.5,
    fontFamily: typography.fontBodyBold,
  },

  /* 2. Hall Banner */
  hallBanner: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  castleIconEmblem: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(21, 15, 30, 0.9)',
    borderWidth: 1.5,
    borderColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    ...shadows.glowGold,
  },
  castleGlowRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: colors.goldLight,
  },
  hallTitle: {
    color: colors.goldLight,
    fontSize: 20,
    fontFamily: typography.fontTitleBlack,
    letterSpacing: 2,
    textAlign: 'center',
  },
  goldDividerLine: {
    width: 60,
    height: 2,
    backgroundColor: colors.gold,
    marginVertical: 8,
    borderRadius: 1,
  },
  hallSubtitle: {
    color: '#cbd5e1',
    fontSize: 12.5,
    textAlign: 'center',
    paddingHorizontal: 18,
    lineHeight: 18,
    fontFamily: typography.fontBody,
  },

  /* 3. Hero Monoliths */
  heroMonolithsContainer: {
    width: '100%',
    gap: 12,
  },
  monolithCard: {
    width: '100%',
    borderRadius: shapes.radiusCard,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#c41e3a',
    ...shadows.glowBlood,
  },
  monolithCardGold: {
    borderColor: colors.gold,
    ...shadows.glowGold,
  },
  monolithGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  monolithIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monolithIconBoxGold: {
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
    borderColor: colors.gold,
  },
  monolithContent: {
    flex: 1,
    gap: 2,
  },
  monolithTag: {
    color: '#fca5a5',
    fontSize: 9.5,
    fontFamily: typography.fontBodyBold,
    letterSpacing: 1.2,
  },
  monolithTitle: {
    color: '#ffffff',
    fontSize: 16.5,
    fontFamily: typography.fontTitleBlack,
    letterSpacing: 1,
  },
  monolithDesc: {
    color: '#e2e8f0',
    fontSize: 11.5,
    fontFamily: typography.fontBody,
    lineHeight: 16,
    marginTop: 2,
  },
  monolithArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monolithArrowGold: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },

  /* 4. Rune Slot Input Modal */
  runeModalBox: {
    width: '100%',
    backgroundColor: 'rgba(18, 12, 26, 0.96)',
    borderRadius: shapes.radiusCard,
    borderWidth: 1.5,
    borderColor: colors.gold,
    padding: 18,
    gap: 14,
    ...shadows.card,
  },
  runeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  runeModalTitle: {
    color: colors.gold,
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    letterSpacing: 1,
    flex: 1,
  },
  closeModalBtn: {
    padding: 4,
  },
  runeModalInstruction: {
    color: '#cbd5e1',
    fontSize: 12,
    fontFamily: typography.fontBody,
  },
  runeSlotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    gap: 6,
  },
  runeSlot: {
    flex: 1,
    height: 52,
    borderRadius: shapes.radius,
    backgroundColor: 'rgba(7, 4, 11, 0.85)',
    borderWidth: 1.5,
    borderColor: '#3D2B52',
    justifyContent: 'center',
    alignItems: 'center',
  },
  runeSlotFilled: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(30, 20, 42, 0.95)',
    ...shadows.glowGold,
  },
  runeSlotCurrent: {
    borderColor: colors.goldLight,
  },
  runeSlotText: {
    color: '#64748b',
    fontSize: 16,
    fontFamily: typography.fontTitleBlack,
  },
  runeSlotTextFilled: {
    color: colors.goldLight,
    fontSize: 20,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0.01,
    width: 1,
    height: 1,
  },
  runeActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pasteClipboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pasteClipboardText: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: typography.fontBodyMedium,
    textDecorationLine: 'underline',
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearBtnText: {
    color: '#f87171',
    fontSize: 12,
    fontFamily: typography.fontBodyMedium,
  },
  runeSubmitRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },

  /* 5. Library & Friends Cards */
  libraryRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  libraryCard: {
    flex: 1,
    borderRadius: shapes.radiusCard,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#3D2B52',
  },
  libraryGradient: {
    padding: 14,
    gap: 8,
    minHeight: 124,
    justifyContent: 'space-between',
  },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  libraryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(10, 6, 16, 0.7)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCardPreview: {
    width: 24,
    height: 34,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gold,
    transform: [{ rotate: '8deg' }],
  },
  miniCardImg: {
    width: '100%',
    height: '100%',
  },
  miniRavenBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  libraryTitle: {
    fontSize: 13,
    fontFamily: typography.fontTitleBlack,
    letterSpacing: 0.5,
  },
  libraryDesc: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontFamily: typography.fontBody,
    lineHeight: 14,
  },
});
