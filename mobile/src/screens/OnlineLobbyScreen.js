import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { getTheme, typography } from '../constants/theme';
import { getSocket } from '../services/socket';
import { SOCKET_EVENTS } from '../constants/socketEvents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Màn hình Sảnh Chơi Online (OnlineLobbyScreen)
 * PHONG CÁCH: Dark Gothic & Huyết Nguyệt (Blood Moon Werewolf Online Portal)
 * - Nút Lớn Ghép Nhanh (Smart Quick Match) với animation lửa ma mị
 * - Modal Tạo phòng Online (Công khai / Riêng tư có mã PIN 4 số)
 * - Modal Nhập mã phòng 4 số trực tiếp
 * - Danh sách các phòng Public thời gian thực với Pull-to-refresh
 */
export default function OnlineLobbyScreen({
  user,
  onJoinRoom,
  onCreateOnlineRoom,
  onSwitchMode,
  onOpenFriends,
  onOpenDictionary,
  isNight = true,
}) {
  const theme = getTheme(isNight);
  const [publicRooms, setPublicRooms] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isQuickMatching, setIsQuickMatching] = useState(false);

  // Modal tạo phòng Online
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [roomName, setRoomName] = useState(`Phòng của ${user?.characterName || 'Tôi'}`);
  const [isPublic, setIsPublic] = useState(true);
  const [pinCode, setPinCode] = useState('');

  // Modal tham gia phòng bằng mã 4 số
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinPinInput, setJoinPinInput] = useState('');

  // Animation pulse cho nút Ghép nhanh
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Lắng nghe socket danh sách phòng công khai
  useEffect(() => {
    const socket = getSocket();

    const handleRoomsList = (rooms) => {
      console.log('📋 [Mobile] Nhận danh sách phòng Online:', rooms?.length);
      setPublicRooms(Array.isArray(rooms) ? rooms : []);
      setIsRefreshing(false);
    };

    const handleQuickMatchFound = ({ roomCode }) => {
      console.log('⚡ [Mobile] Đã tìm thấy phòng Ghép Nhanh:', roomCode);
      setIsQuickMatching(false);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      if (onJoinRoom) {
        onJoinRoom(roomCode);
      }
    };

    socket.on(SOCKET_EVENTS.SERVER.PUBLIC_ROOMS_LIST, handleRoomsList);
    socket.on('quick_match_found', handleQuickMatchFound);

    // Lấy danh sách phòng khi vào màn hình
    socket.emit(SOCKET_EVENTS.CLIENT.GET_PUBLIC_ROOMS);
    const interval = setInterval(() => {
      socket.emit(SOCKET_EVENTS.CLIENT.GET_PUBLIC_ROOMS);
    }, 5000);

    return () => {
      socket.off(SOCKET_EVENTS.SERVER.PUBLIC_ROOMS_LIST, handleRoomsList);
      socket.off('quick_match_found', handleQuickMatchFound);
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.GET_PUBLIC_ROOMS);
  };

  // 1. Thao tác Ghép Nhanh
  const handleQuickMatch = () => {
    if (!user) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}
    setIsQuickMatching(true);
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.QUICK_MATCH, user);

    // Timeout 10s nếu không thấy phản hồi
    setTimeout(() => {
      setIsQuickMatching(false);
    }, 10000);
  };

  // 2. Thao tác Tạo Phòng Online
  const handleConfirmCreateRoom = () => {
    if (!roomName.trim()) {
      return Alert.alert('Lỗi', 'Vui lòng đặt tên cho phòng chơi!');
    }
    if (!isPublic && pinCode.trim().length !== 4) {
      return Alert.alert('Lỗi', 'Phòng riêng tư bắt buộc có mã PIN gồm 4 số!');
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    const payload = {
      user,
      roomName: roomName.trim(),
      isPublic,
      pinCode: isPublic ? null : pinCode.trim(),
    };

    setIsCreateModalOpen(false);
    if (onCreateOnlineRoom) {
      onCreateOnlineRoom(payload);
    } else {
      const socket = getSocket();
      socket.emit(SOCKET_EVENTS.CLIENT.CREATE_ONLINE_ROOM, payload);
    }
  };

  // 3. Thao tác Nhập mã phòng 4 số
  const handleConfirmJoinCode = () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code || code.length !== 4) {
      return Alert.alert('Lỗi', 'Mã phòng hợp lệ gồm 4 chữ số!');
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    setIsJoinCodeModalOpen(false);
    if (onJoinRoom) {
      onJoinRoom(code, joinPinInput.trim() || null);
    }
    setJoinCodeInput('');
    setJoinPinInput('');
  };

  return (
    <LinearGradient
      colors={['#050308', '#0F0918', '#170E24']}
      style={styles.container}
    >
      {/* Top Banner Navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.btnSwitchMode}
          onPress={onSwitchMode}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={16} color={colors.gold} />
          <Text style={styles.btnSwitchModeText}>Đổi Chế Độ</Text>
        </TouchableOpacity>

        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineBadgeText}>SẢNH ONLINE</Text>
        </View>

        <View style={styles.topRightBtns}>
          {onOpenDictionary && (
            <TouchableOpacity style={styles.iconBtn} onPress={onOpenDictionary}>
              <MaterialCommunityIcons name="book-open-outline" size={18} color={colors.gold} />
            </TouchableOpacity>
          )}
          {onOpenFriends && (
            <TouchableOpacity style={styles.iconBtn} onPress={onOpenFriends}>
              <MaterialCommunityIcons name="account-group-outline" size={18} color={colors.gold} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.gold}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Nút Hero Lớn: Ghép Trận Nhanh */}
        <Animated.View style={[styles.quickMatchWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={styles.quickMatchCard}
            onPress={handleQuickMatch}
            disabled={isQuickMatching}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#9E1B26', '#6E0D16', '#3D070C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickMatchGradient}
            >
              <View style={styles.quickMatchLeft}>
                <View style={styles.boltIconCircle}>
                  {isQuickMatching ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <MaterialCommunityIcons name="lightning-bolt" size={28} color="#FFD166" />
                  )}
                </View>
                <View>
                  <Text style={[styles.quickMatchTitle, { fontFamily: typography.fontTitleBold }]}>
                    {isQuickMatching ? 'ĐANG TÌM PHÒNG...' : 'GHÉP TRẬN NHANH'}
                  </Text>
                  <Text style={styles.quickMatchSub}>
                    {isQuickMatching
                      ? 'Đang kết nối vào phòng đông nhất...'
                      : 'Vào ngay phòng Public có đông người nhất'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FFA8B2" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* 2 Nút Hành Động Phụ: Tạo Phòng & Nhập Mã */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnCreate]}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (e) {}
              setIsCreateModalOpen(true);
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.25)', 'rgba(21, 15, 30, 0.9)']}
              style={styles.actionBtnGradient}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={22} color={colors.gold} />
              <Text style={[styles.actionBtnText, { color: colors.gold }]}>Tạo Phòng Mới</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnJoin]}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (e) {}
              setIsJoinCodeModalOpen(true);
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(56, 189, 248, 0.2)', 'rgba(15, 23, 42, 0.9)']}
              style={styles.actionBtnGradient}
            >
              <MaterialCommunityIcons name="key-outline" size={22} color="#38BDF8" />
              <Text style={[styles.actionBtnText, { color: '#38BDF8' }]}>Nhập Mã Phòng</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Danh Sách Phòng Công Khai */}
        <View style={styles.roomListSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="format-list-bulleted" size={18} color={colors.gold} />
              <Text style={[styles.sectionTitle, { fontFamily: typography.fontTitleBold }]}>
                Phòng Chờ Công Khai ({publicRooms.length})
              </Text>
            </View>
            <TouchableOpacity onPress={handleRefresh} style={styles.btnRefresh}>
              <Ionicons name="refresh" size={15} color="#A79BB0" />
              <Text style={styles.btnRefreshText}>Làm mới</Text>
            </TouchableOpacity>
          </View>

          {publicRooms.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="moon-waning-crescent" size={42} color="rgba(158, 143, 168, 0.4)" />
              <Text style={styles.emptyTitle}>Chưa có phòng công khai nào</Text>
              <Text style={styles.emptySub}>
                Hãy là người đầu tiên tạo phòng mới hoặc bấm Ghép Trận Nhanh để máy chủ tự động khởi tạo!
              </Text>
            </View>
          ) : (
            <View style={styles.roomCardsList}>
              {publicRooms.map((room) => (
                <View key={room.roomCode} style={styles.roomCard}>
                  <View style={styles.roomCardHeader}>
                    <View style={styles.roomCardTitleCol}>
                      <Text style={styles.roomCardName} numberOfLines={1}>
                        {room.roomName || `Phòng #${room.roomCode}`}
                      </Text>
                      <View style={styles.roomBadgeRow}>
                        <View style={styles.roomCodeBadge}>
                          <Text style={styles.roomCodeBadgeText}>#{room.roomCode}</Text>
                        </View>
                        {room.hasPin && (
                          <View style={styles.pinBadge}>
                            <Ionicons name="lock-closed" size={10} color="#F59E0B" />
                            <Text style={styles.pinBadgeText}>Có PIN</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.playerCountBadge}>
                      <Ionicons name="people" size={13} color={colors.gold} />
                      <Text style={styles.playerCountText}>
                        {room.playerCount}/{room.maxPlayers || 18}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.btnJoinRoomCard}
                    onPress={() => {
                      if (room.hasPin) {
                        setJoinCodeInput(room.roomCode);
                        setIsJoinCodeModalOpen(true);
                      } else if (onJoinRoom) {
                        onJoinRoom(room.roomCode);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnJoinRoomCardText}>
                      {room.hasPin ? '🔑 Nhập PIN Vào' : 'Vào Chơi ➡️'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal 1: Tạo Phòng Mới */}
      <Modal
        visible={isCreateModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontFamily: typography.fontTitleBold }]}>
                🏰 TẠO PHÒNG ONLINE MỚI
              </Text>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                <Ionicons name="close" size={22} color="#A79BB0" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Tên phòng:</Text>
              <TextInput
                style={styles.textInput}
                value={roomName}
                onChangeText={setRoomName}
                placeholder="Nhập tên phòng..."
                placeholderTextColor="#6E5D78"
                maxLength={30}
              />

              <Text style={styles.fieldLabel}>Quyền riêng tư:</Text>
              <View style={styles.privacyOptionRow}>
                <TouchableOpacity
                  style={[styles.privacyOption, isPublic && styles.privacyOptionActive]}
                  onPress={() => setIsPublic(true)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="earth"
                    size={18}
                    color={isPublic ? colors.gold : '#9E8FA8'}
                  />
                  <Text style={[styles.privacyOptionText, isPublic && styles.privacyOptionTextActive]}>
                    🌐 Công Khai (Public)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.privacyOption, !isPublic && styles.privacyOptionActiveBlood]}
                  onPress={() => setIsPublic(false)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={18}
                    color={!isPublic ? '#FF6B7A' : '#9E8FA8'}
                  />
                  <Text style={[styles.privacyOptionText, !isPublic && styles.privacyOptionTextActiveBlood]}>
                    🔒 Riêng Tư (Có PIN)
                  </Text>
                </TouchableOpacity>
              </View>

              {!isPublic && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.fieldLabel}>Mã PIN phòng (4 số):</Text>
                  <TextInput
                    style={styles.textInput}
                    value={pinCode}
                    onChangeText={setPinCode}
                    placeholder="Ví dụ: 1234"
                    placeholderTextColor="#6E5D78"
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsCreateModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmCreateRoom}
              >
                <Text style={styles.modalConfirmText}>Khởi Tạo Phòng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Nhập Mã Phòng / PIN Trực Tiếp */}
      <Modal
        visible={isJoinCodeModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsJoinCodeModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontFamily: typography.fontTitleBold }]}>
                🔑 NHẬP MÃ PHÒNG CHƠI
              </Text>
              <TouchableOpacity onPress={() => setIsJoinCodeModalOpen(false)}>
                <Ionicons name="close" size={22} color="#A79BB0" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Mã phòng (4 chữ số):</Text>
              <TextInput
                style={[styles.textInput, styles.codeSlotInput]}
                value={joinCodeInput}
                onChangeText={setJoinCodeInput}
                placeholder="Ví dụ: 4892"
                placeholderTextColor="#6E5D78"
                keyboardType="number-pad"
                maxLength={4}
                autoFocus={true}
              />

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Mã PIN bảo mật (nếu có):</Text>
              <TextInput
                style={styles.textInput}
                value={joinPinInput}
                onChangeText={setJoinPinInput}
                placeholder="Để trống nếu là phòng công khai"
                placeholderTextColor="#6E5D78"
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsJoinCodeModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: '#38BDF8', borderColor: '#7DD3FC' }]}
                onPress={handleConfirmJoinCode}
              >
                <Text style={[styles.modalConfirmText, { color: '#032030' }]}>Vào Phòng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  btnSwitchMode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(21, 15, 30, 0.8)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  btnSwitchModeText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  onlineBadgeText: {
    color: '#FF8A96',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  topRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: 'rgba(21, 15, 30, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  quickMatchWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  quickMatchCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E63946',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  quickMatchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  quickMatchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  boltIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.5)',
  },
  quickMatchTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 1,
  },
  quickMatchSub: {
    color: '#FFA8B2',
    fontSize: 11,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  actionBtnCreate: {
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  actionBtnJoin: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  roomListSection: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: '#F5ECD7',
    fontSize: 15,
  },
  btnRefresh: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btnRefreshText: {
    color: '#A79BB0',
    fontSize: 12,
  },
  emptyCard: {
    padding: 30,
    borderRadius: 12,
    backgroundColor: 'rgba(21, 15, 30, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 82, 0.5)',
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#D4C8DE',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    color: '#8A7B94',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  roomCardsList: {
    gap: 10,
  },
  roomCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(21, 15, 30, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 82, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomCardHeader: {
    flex: 1,
    marginRight: 12,
  },
  roomCardTitleCol: {
    marginBottom: 6,
  },
  roomCardName: {
    color: '#F5ECD7',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  roomBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roomCodeBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  roomCodeBadgeText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pinBadgeText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '600',
  },
  playerCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playerCountText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  btnJoinRoomCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  btnJoinRoomCardText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    backgroundColor: '#150F1E',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(61, 43, 82, 0.5)',
    paddingBottom: 10,
  },
  modalTitle: {
    color: colors.gold,
    fontSize: 15,
    letterSpacing: 1,
  },
  modalBody: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: '#D4C8DE',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#0A0610',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 82, 0.8)',
    color: '#F5ECD7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  codeSlotInput: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
    color: colors.gold,
    borderColor: colors.gold,
  },
  privacyOptionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  privacyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0A0610',
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 82, 0.8)',
  },
  privacyOptionActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: colors.gold,
  },
  privacyOptionActiveBlood: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderColor: '#DC2626',
  },
  privacyOptionText: {
    fontSize: 11,
    color: '#9E8FA8',
    fontWeight: '600',
  },
  privacyOptionTextActive: {
    color: colors.gold,
    fontWeight: '700',
  },
  privacyOptionTextActiveBlood: {
    color: '#FF6B7A',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalCancelText: {
    color: '#A79BB0',
    fontSize: 13,
  },
  modalConfirmBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F3E5AB',
  },
  modalConfirmText: {
    color: '#120B1A',
    fontSize: 13,
    fontWeight: '800',
  },
});
