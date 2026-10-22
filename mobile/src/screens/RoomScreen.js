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
  Share,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { getTheme, typography, shapes, shadows } from '../constants/theme';
import { API_BASE_URL } from '../constants/config';
import { CARD_IMAGES, BACKGROUND_IMAGES, getCardArtwork } from '../constants/cardAssets';
import CustomButton from '../components/common/CustomButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Màn hình Phòng Chờ (RoomScreen)
 * PHONG CÁCH: Dark Gothic & Huyết Nguyệt (Blood Moon Council Room)
 * - Biển hiệu Mã phòng Thạch Ấn (Rune Stone Monolith) với viền phát sáng
 * - Bàn Tròn Hội Đồng (Council Round Table) xếp chỗ người chơi kèm bài úp mini
 * - Khu vực Chỉ Huy Chủ Phòng: Cài đặt Quản trò & Bộ Bài Custom Deck kèm Artwork Tarot
 * - Nút 1-chạm sao chép & chia sẻ qua tin nhắn
 */
export default function RoomScreen({
  user,
  roomCode,
  players = [],
  isNight = true,
  onLeaveRoom,
  onStartGame,
}) {
  const theme = getTheme(isNight);

  // Cài đặt Quản trò & Chế độ chia bài
  const [moderatorMode, setModeratorMode] = useState('host'); // 'host' | 'none' | 'select'
  const [selectedModName, setSelectedModName] = useState('');
  const [gameMode, setGameMode] = useState('auto'); // 'auto' | 'custom'
  const [allCards, setAllCards] = useState([]);
  const [customDeck, setCustomDeck] = useState({});

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

  // Kiểm tra quyền Chủ phòng
  const isHost = players.some(
    (p) => p.characterName === user?.characterName && p.isHost
  );

  useEffect(() => {
    if (isHost) {
      loadCardList();
    }
  }, [isHost]);

  const loadCardList = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cards`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setAllCards(data);
        const initDeck = {};
        data.forEach((c) => {
          initDeck[c._id] = 0;
        });
        setCustomDeck(initDeck);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách bài:', err);
    }
  };

  const updateCardCount = (cardId, delta) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setCustomDeck((prev) => {
      const current = prev[cardId] || 0;
      const nextVal = Math.max(0, current + delta);
      return { ...prev, [cardId]: nextVal };
    });
  };

  const totalCustomSelected = Object.values(customDeck).reduce((a, b) => a + b, 0);

  // Số lượng người nhận bài (không tính Quản trò)
  const receivingPlayerCount =
    moderatorMode === 'none' ? players.length : Math.max(0, players.length - 1);

  // Sao chép mã phòng
  const handleCopyCode = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Clipboard.setStringAsync(roomCode);
      Alert.alert('📋 Đã sao chép!', `Mã phòng ${roomCode} đã được lưu vào khay nhớ tạm.`);
    } catch (e) {}
  };

  // Chia sẻ phòng
  const handleShareRoom = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share({
        message: `🐺 Vào bàn chơi Ma Sói với tôi nhé! Mã phòng: ${roomCode}`,
      });
    } catch (error) {
      console.log('Lỗi chia sẻ:', error);
    }
  };

  // Khởi chạy ván game
  const handleStartGameClick = () => {
    if (players.length < 2 && moderatorMode !== 'none') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
      return Alert.alert(
        'Cần thêm người chơi',
        'Khi có Quản trò, phòng cần ít nhất 2 người (1 Quản trò và 1 người nhận bài).\n\nNếu muốn thử nghiệm 1 mình, hãy chọn "Không có Quản trò".'
      );
    }

    if (gameMode === 'custom' && totalCustomSelected !== receivingPlayerCount) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
      return Alert.alert(
        'Số lượng bài chưa khớp',
        `Bạn đã chọn ${totalCustomSelected} lá bài, nhưng có ${receivingPlayerCount} người nhận bài.\n\nHãy điều chỉnh lại số lượng bài sao cho đúng bằng ${receivingPlayerCount} lá!`
      );
    }

    const effectiveMod =
      moderatorMode === 'select'
        ? (players.find((p) => p.characterName === selectedModName) || players.find((p) => !p.isHost))
        : undefined;
    const effectiveModId = effectiveMod?.socketId;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}

    if (onStartGame) {
      onStartGame({
        roomCode,
        mode: gameMode,
        customDeck: gameMode === 'custom' ? customDeck : undefined,
        moderatorMode,
        moderatorSocketId: effectiveModId,
      });
    }
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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. THANH TOPBAR HUD */}
          <View style={styles.topBar}>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>PHÒNG CHỜ TRỰC TUYẾN</Text>
            </View>

            <TouchableOpacity
              style={styles.leaveBtn}
              onPress={() => {
                Alert.alert(
                  'Rời phòng chờ?',
                  'Bạn có chắc chắn muốn rời khỏi phòng chờ hiện tại không?',
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

          {/* 2. BIỂN HIỆU MÃ PHÒNG */}
          <View style={styles.runeStoneCard}>
            <View style={styles.runeStoneHeader}>
              <MaterialCommunityIcons name="door-open" size={22} color={colors.gold} />
              <Text style={styles.runeStoneTitle}>MÃ PHÒNG CHƠI</Text>
            </View>

            {/* Khung Mã Phòng Lớn Rõ Ràng */}
            <View style={styles.codeDisplayBox}>
              <Text style={styles.codeDisplayText}>{roomCode}</Text>
            </View>

            {/* Cặp nút Sao chép & Chia sẻ */}
            <View style={styles.codeActionsRow}>
              <TouchableOpacity
                style={styles.codeBtn}
                onPress={handleCopyCode}
                activeOpacity={0.8}
              >
                <Ionicons name="copy-outline" size={15} color={colors.gold} />
                <Text style={styles.codeBtnText}>Sao chép mã</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.codeBtn, styles.codeBtnShare]}
                onPress={handleShareRoom}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social-outline" size={15} color="#ffffff" />
                <Text style={[styles.codeBtnText, { color: '#ffffff' }]}>Chia sẻ phòng</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.codeSubtitle}>
              Chia sẻ mã phòng này để bạn bè cùng tham gia chơi
            </Text>
          </View>

          {/* 3. DANH SÁCH NGƯỜI CHƠI TRONG PHÒNG */}
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-group" size={20} color={colors.gold} />
            <Text style={styles.sectionTitle}>
              DANH SÁCH NGƯỜI CHƠI ({players.length})
            </Text>
          </View>

          <View style={styles.councilGrid}>
            {players.map((player, index) => {
              const isMe = player.characterName === user?.characterName;

              return (
                <View
                  key={player.socketId || `${player.characterName}_${index}`}
                  style={[
                    styles.councilSeat,
                    isMe && styles.councilSeatMe,
                  ]}
                >
                  {/* Lá bài úp mini trên ghế ngồi */}
                  <View style={styles.seatCardBack}>
                    <Image
                      source={CARD_IMAGES.back}
                      style={styles.seatCardBackImg}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Thông tin người chơi */}
                  <View style={styles.seatInfo}>
                    <View style={styles.seatAvatarRow}>
                      <View
                        style={[
                          styles.seatAvatarCircle,
                          player.isHost && styles.seatAvatarHost,
                        ]}
                      >
                        {player.isHost ? (
                          <MaterialCommunityIcons name="crown" size={16} color={colors.gold} />
                        ) : (
                          <Ionicons name="person" size={14} color="#94a3b8" />
                        )}
                      </View>

                      {isMe && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>BẠN</Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.seatPlayerName,
                        isMe && styles.seatPlayerNameMe,
                      ]}
                      numberOfLines={1}
                    >
                      {player.characterName || player.username}
                    </Text>

                    <Text style={styles.seatRoleLabel}>
                      {player.isHost ? '👑 Chủ phòng' : 'Người chơi'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* 4. KHU VỰC CÀI ĐẶT PHÒNG (DÀNH CHO CHỦ PHÒNG) */}
          {isHost ? (
            <View style={styles.hostSanctum}>
              <View style={styles.sanctumHeader}>
                <MaterialCommunityIcons name="cog" size={20} color={colors.gold} />
                <Text style={styles.sanctumTitle}>CÀI ĐẶT VÁN ĐẤU (CHỦ PHÒNG)</Text>
              </View>

              {/* 4.1 Cài đặt Quản trò */}
              <View style={styles.controlBox}>
                <Text style={styles.controlBoxLabel}>CHỌN QUẢN TRÒ:</Text>
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.optionChip,
                      moderatorMode === 'host' && styles.optionChipActive,
                    ]}
                    onPress={() => setModeratorMode('host')}
                  >
                    <MaterialCommunityIcons
                      name="crown"
                      size={15}
                      color={moderatorMode === 'host' ? '#120B1A' : colors.gold}
                    />
                    <Text
                      style={[
                        styles.optionChipText,
                        moderatorMode === 'host' && styles.optionChipTextActive,
                      ]}
                    >
                      Tôi làm Quản trò
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionChip,
                      moderatorMode === 'select' && styles.optionChipActive,
                    ]}
                    onPress={() => setModeratorMode('select')}
                  >
                    <MaterialCommunityIcons
                      name="account-switch"
                      size={15}
                      color={moderatorMode === 'select' ? '#120B1A' : colors.gold}
                    />
                    <Text
                      style={[
                        styles.optionChipText,
                        moderatorMode === 'select' && styles.optionChipTextActive,
                      ]}
                    >
                      Chỉ định Quản trò
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionChip,
                      moderatorMode === 'none' && styles.optionChipActive,
                    ]}
                    onPress={() => setModeratorMode('none')}
                  >
                    <MaterialCommunityIcons
                      name="robot"
                      size={15}
                      color={moderatorMode === 'none' ? '#120B1A' : colors.gold}
                    />
                    <Text
                      style={[
                        styles.optionChipText,
                        moderatorMode === 'none' && styles.optionChipTextActive,
                      ]}
                    >
                      Tự động (Không Quản trò)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Danh sách chọn GM nếu chế độ Chỉ định */}
                {moderatorMode === 'select' && (
                  <View style={styles.modSelectWrap}>
                    <Text style={styles.modSelectHint}>Chọn người chơi làm Quản trò:</Text>
                    <View style={styles.modCandidateRow}>
                      {players.map((p) => {
                        const isSelected = selectedModName
                          ? selectedModName === p.characterName
                          : (!p.isHost && p === players.find((x) => !x.isHost));
                        return (
                          <TouchableOpacity
                            key={p.socketId || p.characterName}
                            style={[
                              styles.modCandidateChip,
                              isSelected && styles.modCandidateChipActive,
                            ]}
                            onPress={() => setSelectedModName(p.characterName)}
                          >
                            <Text
                              style={[
                                styles.modCandidateChipText,
                                isSelected && styles.modCandidateChipTextActive,
                              ]}
                            >
                              {p.characterName} {p.isHost ? '(Chủ phòng)' : ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              {/* 4.2 Cài đặt Chế độ chia bài */}
              <View style={styles.controlBox}>
                <Text style={styles.controlBoxLabel}>CHẾ ĐỘ CHIA BÀI:</Text>
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.optionChip,
                      gameMode === 'auto' && styles.optionChipActive,
                    ]}
                    onPress={() => setGameMode('auto')}
                  >
                    <MaterialCommunityIcons
                      name="dice-5"
                      size={15}
                      color={gameMode === 'auto' ? '#120B1A' : colors.gold}
                    />
                    <Text
                      style={[
                        styles.optionChipText,
                        gameMode === 'auto' && styles.optionChipTextActive,
                      ]}
                    >
                      Tự động chia bài
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionChip,
                      gameMode === 'custom' && styles.optionChipActive,
                    ]}
                    onPress={() => setGameMode('custom')}
                  >
                    <MaterialCommunityIcons
                      name="cards-playing-outline"
                      size={15}
                      color={gameMode === 'custom' ? '#120B1A' : colors.gold}
                    />
                    <Text
                      style={[
                        styles.optionChipText,
                        gameMode === 'custom' && styles.optionChipTextActive,
                      ]}
                    >
                      Tùy chọn số lượng thẻ
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* BỘ CHỌN BÀI CUSTOM DECK BUILDER KÈM TRANH MINH HỌA */}
                {gameMode === 'custom' && (
                  <View style={styles.customDeckContainer}>
                    <View style={styles.deckStatusRow}>
                      <Text style={styles.deckStatusLabel}>Số lượng thẻ bài đã chọn:</Text>
                      <View
                        style={[
                          styles.deckStatusPill,
                          totalCustomSelected === receivingPlayerCount
                            ? styles.deckStatusPillMatch
                            : styles.deckStatusPillError,
                        ]}
                      >
                        <Text style={styles.deckStatusPillText}>
                          {totalCustomSelected} / {receivingPlayerCount} lá
                        </Text>
                      </View>
                    </View>

                    {allCards.map((c) => {
                      const count = customDeck[c._id] || 0;
                      const cardArt = getCardArtwork(c.name, c.team);

                      return (
                        <View key={c._id} style={styles.tarotCardRow}>
                          {/* Ảnh Tarot thu nhỏ */}
                          <View style={styles.tarotThumbBox}>
                            <Image
                              source={cardArt}
                              style={styles.tarotThumbImg}
                              resizeMode="cover"
                            />
                          </View>

                          {/* Thông tin vai trò */}
                          <View style={styles.tarotInfoCol}>
                            <Text style={styles.tarotCardName}>{c.name}</Text>
                            <Text style={styles.tarotCardTeam}>Phe: {c.team}</Text>
                          </View>

                          {/* Bộ đếm (+ / -) */}
                          <View style={styles.stepperBox}>
                            <TouchableOpacity
                              style={styles.stepperBtn}
                              onPress={() => updateCardCount(c._id, -1)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.stepperBtnText}>-</Text>
                            </TouchableOpacity>

                            <Text style={styles.stepperValue}>{count}</Text>

                            <TouchableOpacity
                              style={[styles.stepperBtn, styles.stepperBtnPlus]}
                              onPress={() => updateCardCount(c._id, 1)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.stepperBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 4.3 Nút Bắt Đầu Ván Game Hero */}
              <CustomButton
                title={`BẮT ĐẦU VÁN ĐẤU (${receivingPlayerCount} người${
                  moderatorMode !== 'none' ? ' + 1 Quản trò' : ''
                })`}
                variant="blood"
                onPress={handleStartGameClick}
                icon={<MaterialCommunityIcons name="play-circle-outline" size={20} color="#fff" />}
                style={styles.startGameBtn}
              />
            </View>
          ) : (
            /* Khối chờ dành cho Thành viên */
            <View style={styles.waitingSanctum}>
              <MaterialCommunityIcons name="timer-sand" size={32} color={colors.gold} />
              <Text style={styles.waitingTitle}>ĐANG CHỜ CHỦ PHÒNG BẮT ĐẦU</Text>
              <Text style={styles.waitingSubtitle}>
                Chủ phòng đang thiết lập ván chơi. Trận đấu sẽ bắt đầu trong giây lát!
              </Text>
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
  },
  scrollContent: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 16,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(21, 15, 30, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: shapes.radiusPill,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34d399',
  },
  onlineText: {
    color: '#a7f3d0',
    fontSize: 10.5,
    fontFamily: typography.fontBodyBold,
    letterSpacing: 0.8,
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(128, 12, 22, 0.35)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: shapes.radiusPill,
  },
  leaveBtnText: {
    color: '#f87171',
    fontSize: 11.5,
    fontFamily: typography.fontBodyMedium,
  },

  /* 2. Rune Stone Card */
  runeStoneCard: {
    width: '100%',
    backgroundColor: 'rgba(21, 15, 30, 0.92)',
    borderRadius: shapes.radiusCard,
    borderWidth: 1.5,
    borderColor: colors.gold,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 12,
    ...shadows.glowGold,
  },
  runeStoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  runeStoneTitle: {
    color: colors.gold,
    fontSize: 13,
    fontFamily: typography.fontBodyBold,
    letterSpacing: 1.5,
  },
  codeDisplayBox: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: shapes.radius,
    backgroundColor: 'rgba(8, 4, 12, 0.95)',
    borderWidth: 1.5,
    borderColor: colors.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeDisplayText: {
    color: colors.goldLight,
    fontFamily: typography.fontTitleBlack,
    fontSize: 30,
    letterSpacing: 6,
  },
  codeGlowFrame: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: shapes.radius,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  codeActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  codeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: shapes.radiusPill,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  codeBtnShare: {
    backgroundColor: 'rgba(158, 27, 38, 0.7)',
    borderColor: '#c41e3a',
  },
  codeBtnText: {
    color: colors.goldLight,
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
  },
  codeSubtitle: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontFamily: typography.fontBody,
  },

  /* 3. Council Seats Grid */
  sectionHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.goldLight,
    fontSize: 13,
    fontFamily: typography.fontBodyBold,
    letterSpacing: 1,
  },
  councilGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  councilSeat: {
    width: (SCREEN_WIDTH - 42) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: shapes.radius,
    backgroundColor: 'rgba(21, 15, 30, 0.88)',
    borderWidth: 1.5,
    borderColor: '#3D2B52',
    gap: 10,
  },
  councilSeatMe: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(32, 22, 45, 0.95)',
    ...shadows.glowGold,
  },
  seatCardBack: {
    width: 32,
    height: 48,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  seatCardBackImg: {
    width: '100%',
    height: '100%',
  },
  seatInfo: {
    flex: 1,
    gap: 2,
  },
  seatAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seatAvatarCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatAvatarHost: {
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
  },
  youBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: shapes.radiusPill,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  youBadgeText: {
    color: colors.goldLight,
    fontSize: 9,
    fontFamily: typography.fontBodyBold,
  },
  seatPlayerName: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: typography.fontBodyBold,
  },
  seatPlayerNameMe: {
    color: colors.goldLight,
  },
  seatRoleLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: typography.fontBody,
  },

  /* 4. Host Sanctum */
  hostSanctum: {
    width: '100%',
    backgroundColor: 'rgba(21, 15, 30, 0.94)',
    borderRadius: shapes.radiusCard,
    borderWidth: 1.5,
    borderColor: colors.gold,
    padding: 16,
    gap: 14,
    ...shadows.card,
  },
  sanctumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sanctumTitle: {
    color: colors.gold,
    fontSize: 13,
    fontFamily: typography.fontTitleBlack,
    letterSpacing: 1,
  },
  controlBox: {
    gap: 8,
  },
  controlBoxLabel: {
    color: '#cbd5e1',
    fontSize: 11.5,
    fontFamily: typography.fontBodyBold,
    letterSpacing: 0.8,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: shapes.radius,
    backgroundColor: 'rgba(10, 6, 16, 0.8)',
    borderWidth: 1,
    borderColor: '#3D2B52',
  },
  optionChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.goldLight,
    ...shadows.glowGold,
  },
  optionChipText: {
    color: '#cbd5e1',
    fontSize: 11.5,
    fontFamily: typography.fontBodyMedium,
  },
  optionChipTextActive: {
    color: '#120B1A',
    fontFamily: typography.fontBodyBold,
  },
  modSelectWrap: {
    marginTop: 6,
    gap: 6,
  },
  modSelectHint: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: typography.fontBody,
  },
  modCandidateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modCandidateChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: shapes.radiusPill,
    backgroundColor: 'rgba(10, 6, 16, 0.7)',
    borderWidth: 1,
    borderColor: '#3D2B52',
  },
  modCandidateChipActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  modCandidateChipText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontFamily: typography.fontBody,
  },
  modCandidateChipTextActive: {
    color: colors.goldLight,
    fontFamily: typography.fontBodyBold,
  },

  /* Custom Deck Builder */
  customDeckContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(10, 6, 16, 0.8)',
    borderRadius: shapes.radius,
    borderWidth: 1,
    borderColor: '#3D2B52',
    padding: 12,
    gap: 10,
  },
  deckStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#251B33',
  },
  deckStatusLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontFamily: typography.fontBodyMedium,
  },
  deckStatusPill: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: shapes.radiusPill,
  },
  deckStatusPillMatch: {
    backgroundColor: '#15803d',
  },
  deckStatusPillError: {
    backgroundColor: '#b91c1c',
  },
  deckStatusPillText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: typography.fontBodyBold,
  },
  tarotCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  tarotThumbBox: {
    width: 32,
    height: 48,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  tarotThumbImg: {
    width: '100%',
    height: '100%',
  },
  tarotInfoCol: {
    flex: 1,
  },
  tarotCardName: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: typography.fontBodyBold,
  },
  tarotCardTeam: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: typography.fontBody,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(21, 15, 30, 0.9)',
    borderRadius: shapes.radiusPill,
    borderWidth: 1,
    borderColor: '#3D2B52',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnPlus: {
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
  },
  stepperBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  stepperValue: {
    color: colors.goldLight,
    fontFamily: typography.fontBodyBold,
    fontSize: 15,
    minWidth: 16,
    textAlign: 'center',
  },
  startGameBtn: {
    marginTop: 6,
    minHeight: 52,
  },

  /* Waiting Sanctum for non-host */
  waitingSanctum: {
    width: '100%',
    backgroundColor: 'rgba(21, 15, 30, 0.92)',
    borderRadius: shapes.radiusCard,
    borderWidth: 1.5,
    borderColor: '#3D2B52',
    padding: 24,
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  waitingTitle: {
    color: colors.goldLight,
    fontFamily: typography.fontTitleBlack,
    fontSize: 15,
    letterSpacing: 1,
    textAlign: 'center',
  },
  waitingSubtitle: {
    color: '#94a3b8',
    fontSize: 12.5,
    fontFamily: typography.fontBody,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
