import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { getTheme, typography } from '../constants/theme';
import { getSocket } from '../services/socket';
import { SOCKET_EVENTS } from '../constants/socketEvents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Màn hình Phòng Chờ Bàn Tròn Online (OnlineRoomLobbyScreen)
 * PHONG CÁCH: Dark Gothic & Huyết Nguyệt (Blood Moon Council Chamber)
 * - Đánh số ghế bàn tròn #1 đến #N
 * - Cơ chế Ready Check bắt buộc
 * - Cài đặt phòng chuyên biệt cho Host (Chế độ bài, Giấu bài khi chết)
 * - Nút Bắt Đầu Ván Đấu bị khóa khi chưa đủ 100% Ready
 */
export default function OnlineRoomLobbyScreen({
  roomCode,
  players = [],
  metadata,
  user,
  isHost,
  onStartGame,
  onLeaveRoom,
  isNight = true,
}) {
  const theme = getTheme(isNight);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentSettings = metadata?.settings || {
    deckMode: 'auto',
    roleRevealOnDeath: 'open',
    discussionTime: 90,
  };

  const currentUser = players.find(
    (p) => p.characterName?.toLowerCase() === user?.characterName?.toLowerCase()
  );

  const isUserReady = Boolean(currentUser?.isReady);
  const totalPlayers = players.length;
  const readyPlayersCount = players.filter((p) => p.isReady).length;
  const canStartGame = totalPlayers >= 5 && readyPlayersCount === totalPlayers;

  // Sao chép mã phòng
  const handleCopyCode = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Clipboard.setStringAsync(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  // Bật/tắt trạng thái Sẵn Sàng
  const handleToggleReady = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.TOGGLE_READY, roomCode);
  };

  // Host cập nhật cài đặt
  const handleUpdateSetting = (key, value) => {
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.UPDATE_ROOM_SETTINGS, {
      roomCode,
      settings: { [key]: value },
    });
  };

  // Bắt đầu game
  const handleStart = () => {
    if (!canStartGame) {
      if (totalPlayers < 5) {
        return Alert.alert('Chưa đủ người', 'Cần tối thiểu 5 người chơi để bắt đầu ván đấu Online!');
      }
      return Alert.alert('Chưa sẵn sàng', 'Tất cả người chơi trong phòng phải bấm SẴN SÀNG trước khi bắt đầu!');
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    if (onStartGame) {
      onStartGame({
        roomCode,
        mode: currentSettings.deckMode || 'auto',
        moderatorMode: 'none', // Online mode: Server làm Quản trò tự động
      });
    } else {
      const socket = getSocket();
      socket.emit(SOCKET_EVENTS.CLIENT.START_GAME, {
        roomCode,
        mode: currentSettings.deckMode || 'auto',
        moderatorMode: 'none',
      });
    }
  };

  // Host kick người chơi
  const handleKick = (charName) => {
    Alert.alert(
      'Mời ra khỏi phòng?',
      `Bạn có chắc muốn mời ${charName} ra khỏi phòng không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Mời ra',
          style: 'destructive',
          onPress: () => {
            const socket = getSocket();
            socket.emit(SOCKET_EVENTS.CLIENT.KICK_PLAYER, {
              roomCode,
              targetCharacterName: charName,
            });
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#040307', '#0E0817', '#180C26']}
      style={styles.container}
    >
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.roomCodeContainer}>
          <Text style={styles.roomCodeLabel}>PHÒNG:</Text>
          <Text style={styles.roomCodeText}>{roomCode}</Text>
          <TouchableOpacity onPress={handleCopyCode} style={styles.copyBtn}>
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={16}
              color={copied ? '#4ADE80' : colors.gold}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.headerRightBtns}>
          {isHost && (
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => setIsSettingsOpen(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={17} color={colors.gold} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.leaveBtn}
            onPress={onLeaveRoom}
            activeOpacity={0.7}
          >
            <Ionicons name="exit-outline" size={17} color="#FF6B7A" />
            <Text style={styles.leaveBtnText}>Rời</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Thông tin phòng & Bộ đếm Ready */}
      <View style={styles.roomInfoBar}>
        <View>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {metadata?.roomName || `Bàn Tròn #${roomCode}`}
          </Text>
          <Text style={styles.roomSubtitle}>
            {currentSettings.deckMode === 'auto' ? '🤖 Máy tự chọn bài' : '🎴 Bộ bài tự chọn'} •{' '}
            {currentSettings.roleRevealOnDeath === 'open' ? 'Công khai bài khi chết' : '🎭 Giấu bài khi chết'}
          </Text>
        </View>

        <View style={styles.readyTallyBadge}>
          <Text style={styles.readyTallyText}>
            Sẵn Sàng: <Text style={{ color: readyPlayersCount === totalPlayers ? '#4ADE80' : '#FBBF24', fontWeight: '800' }}>
              {readyPlayersCount}/{totalPlayers}
            </Text>
          </Text>
        </View>
      </View>

      {/* Danh sách Bàn Tròn Đánh Số Ghế */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.councilTitle}>⚔️ HỘI ĐỒNG BÀN TRÒN MA SÓI ({totalPlayers}/18)</Text>

        <View style={styles.seatsGrid}>
          {players.map((p, idx) => {
            const isMe = p.characterName?.toLowerCase() === user?.characterName?.toLowerCase();
            const seatNum = p.seatNumber || idx + 1;

            return (
              <View
                key={p.characterName || idx}
                style={[
                  styles.seatCard,
                  isMe && styles.seatCardMe,
                  p.isReady ? styles.seatCardReady : styles.seatCardNotReady,
                ]}
              >
                {/* Số ghế */}
                <View style={[styles.seatNumberCircle, p.isReady && styles.seatNumberCircleReady]}>
                  <Text style={styles.seatNumberText}>#{seatNum}</Text>
                </View>

                {/* Avatar / Tên */}
                <View style={styles.seatAvatarBox}>
                  <MaterialCommunityIcons
                    name={p.isHost ? 'crown' : 'account'}
                    size={26}
                    color={p.isHost ? colors.gold : '#E2D9EB'}
                  />
                </View>

                <Text style={styles.seatPlayerName} numberOfLines={1}>
                  {p.characterName} {isMe ? '(Tôi)' : ''}
                </Text>

                {/* Trạng thái Ready */}
                <View style={[styles.statusBadge, p.isReady ? styles.statusReady : styles.statusWait]}>
                  <Ionicons
                    name={p.isReady ? 'checkmark-circle' : 'time-outline'}
                    size={12}
                    color={p.isReady ? '#4ADE80' : '#A79BB0'}
                  />
                  <Text style={[styles.statusText, { color: p.isReady ? '#4ADE80' : '#A79BB0' }]}>
                    {p.isReady ? 'SẴN SÀNG' : 'CHỜ...'}
                  </Text>
                </View>

                {/* Nút kick nếu là Host */}
                {isHost && !isMe && (
                  <TouchableOpacity
                    style={styles.kickBtn}
                    onPress={() => handleKick(p.characterName)}
                  >
                    <Ionicons name="close-circle" size={16} color="#FF6B7A" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Thông báo điều kiện bắt đầu ván */}
        <View style={styles.hintNoticeBox}>
          <Ionicons name="information-circle-outline" size={18} color="#FFD166" />
          <Text style={styles.hintNoticeText}>
            Yêu cầu bắt đầu: Tối thiểu <Text style={{ color: colors.gold, fontWeight: '700' }}>5 người</Text> và{' '}
            <Text style={{ color: colors.gold, fontWeight: '700' }}>100%</Text> thành viên bấm SẴN SÀNG.
          </Text>
        </View>
      </ScrollView>

      {/* Thanh Điều Khiển Cố Định Dưới Cùng */}
      <View style={styles.bottomControlBar}>
        {/* Nút Ready cho thành viên */}
        <TouchableOpacity
          style={[styles.readyToggleBtn, isUserReady ? styles.readyToggleBtnCancel : styles.readyToggleBtnActive]}
          onPress={handleToggleReady}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isUserReady ? 'close-circle' : 'checkmark-circle'}
            size={18}
            color={isUserReady ? '#FF6B7A' : '#120B1A'}
          />
          <Text style={[styles.readyToggleText, { color: isUserReady ? '#FF6B7A' : '#120B1A' }]}>
            {isUserReady ? 'HỦY SẴN SÀNG' : 'BẤM SẴN SÀNG'}
          </Text>
        </TouchableOpacity>

        {/* Nút Start cho Host */}
        {isHost && (
          <TouchableOpacity
            style={[styles.startBtn, !canStartGame && styles.startBtnDisabled]}
            onPress={handleStart}
            disabled={!canStartGame}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="play-circle" size={20} color={canStartGame ? '#FFFFFF' : '#8A7B94'} />
            <Text style={[styles.startBtnText, { color: canStartGame ? '#FFFFFF' : '#8A7B94' }]}>
              BẮT ĐẦU VÁN ĐẤU
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal Cài Đặt Phòng cho Host */}
      <Modal
        visible={isSettingsOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsSettingsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontFamily: typography.fontTitleBold }]}>
                ⚙️ CÀI ĐẶT PHÒNG ĐẤU ONLINE
              </Text>
              <TouchableOpacity onPress={() => setIsSettingsOpen(false)}>
                <Ionicons name="close" size={22} color="#A79BB0" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* 1. Chế độ chọn bài */}
              <Text style={styles.settingLabel}>CHẾ ĐỘ THIẾT LẬP BÀI:</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity
                  style={[styles.optionBtn, currentSettings.deckMode === 'auto' && styles.optionBtnActive]}
                  onPress={() => handleUpdateSetting('deckMode', 'auto')}
                >
                  <Text style={[styles.optionText, currentSettings.deckMode === 'auto' && styles.optionTextActive]}>
                    🤖 Máy Tự Chọn (Chuẩn)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionBtn, currentSettings.deckMode === 'custom' && styles.optionBtnActive]}
                  onPress={() => handleUpdateSetting('deckMode', 'custom')}
                >
                  <Text style={[styles.optionText, currentSettings.deckMode === 'custom' && styles.optionTextActive]}>
                    🎴 Tự Chọn Bài
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 2. Hiển thị bài khi chết */}
              <Text style={[styles.settingLabel, { marginTop: 16 }]}>KHI NGƯỜI CHƠI TỬ NẠN:</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity
                  style={[styles.optionBtn, currentSettings.roleRevealOnDeath === 'open' && styles.optionBtnActive]}
                  onPress={() => handleUpdateSetting('roleRevealOnDeath', 'open')}
                >
                  <Text style={[styles.optionText, currentSettings.roleRevealOnDeath === 'open' && styles.optionTextActive]}>
                    🎴 Công Khai Bài (Open)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionBtn, currentSettings.roleRevealOnDeath === 'hidden' && styles.optionBtnActiveBlood]}
                  onPress={() => handleUpdateSetting('roleRevealOnDeath', 'hidden')}
                >
                  <Text style={[styles.optionText, currentSettings.roleRevealOnDeath === 'hidden' && styles.optionTextActiveBlood]}>
                    🎭 Giấu Bài (Hidden)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 3. Thời gian thảo luận ban ngày */}
              <Text style={[styles.settingLabel, { marginTop: 16 }]}>THỜI GIAN THẢO LUẬN NGÀY:</Text>
              <View style={styles.optionRow}>
                {[60, 90, 120].map((sec) => (
                  <TouchableOpacity
                    key={sec}
                    style={[styles.timeBtn, currentSettings.discussionTime === sec && styles.optionBtnActive]}
                    onPress={() => handleUpdateSetting('discussionTime', sec)}
                  >
                    <Text style={[styles.optionText, currentSettings.discussionTime === sec && styles.optionTextActive]}>
                      {sec}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsSettingsOpen(false)}
            >
              <Text style={styles.modalCloseBtnText}>Đã Xong</Text>
            </TouchableOpacity>
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  roomCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(21, 15, 30, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  roomCodeLabel: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
  },
  roomCodeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  copyBtn: {
    paddingLeft: 4,
  },
  headerRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: 'rgba(21, 15, 30, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
  },
  leaveBtnText: {
    color: '#FF6B7A',
    fontSize: 12,
    fontWeight: '700',
  },
  roomInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(10, 6, 16, 0.6)',
  },
  roomTitle: {
    color: '#F5ECD7',
    fontSize: 14,
    fontWeight: '700',
    maxWidth: SCREEN_WIDTH * 0.6,
  },
  roomSubtitle: {
    color: '#9E8FA8',
    fontSize: 11,
    marginTop: 2,
  },
  readyTallyBadge: {
    backgroundColor: 'rgba(21, 15, 30, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 82, 0.8)',
  },
  readyTallyText: {
    color: '#D4C8DE',
    fontSize: 11,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 90,
  },
  councilTitle: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  seatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  seatCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(21, 15, 30, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 82, 0.7)',
    alignItems: 'center',
    position: 'relative',
  },
  seatCardMe: {
    borderColor: colors.gold,
  },
  seatCardReady: {
    backgroundColor: 'rgba(16, 36, 26, 0.85)',
    borderColor: 'rgba(74, 222, 128, 0.45)',
  },
  seatCardNotReady: {
    backgroundColor: 'rgba(21, 15, 30, 0.85)',
  },
  seatNumberCircle: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(61, 43, 82, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatNumberCircleReady: {
    backgroundColor: 'rgba(74, 222, 128, 0.3)',
  },
  seatNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  seatAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  seatPlayerName: {
    color: '#F5ECD7',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    maxWidth: '90%',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusReady: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
  },
  statusWait: {
    backgroundColor: 'rgba(158, 143, 168, 0.15)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  kickBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 2,
  },
  hintNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    padding: 12,
    marginTop: 16,
  },
  hintNoticeText: {
    color: '#E2D9EB',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  bottomControlBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0B0612',
    borderTopWidth: 1,
    borderTopColor: 'rgba(61, 43, 82, 0.6)',
  },
  readyToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  readyToggleBtnActive: {
    backgroundColor: colors.gold,
  },
  readyToggleBtnCancel: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderWidth: 1,
    borderColor: '#FF6B7A',
  },
  readyToggleText: {
    fontSize: 13,
    fontWeight: '800',
  },
  startBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#C41E3A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF4D6D',
  },
  startBtnDisabled: {
    backgroundColor: 'rgba(40, 20, 30, 0.6)',
    borderColor: 'rgba(80, 40, 60, 0.4)',
  },
  startBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
    borderColor: 'rgba(212, 175, 55, 0.4)',
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
    fontSize: 14,
    letterSpacing: 0.5,
  },
  modalBody: {
    maxHeight: 320,
    marginBottom: 16,
  },
  settingLabel: {
    color: '#D4C8DE',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0A0610',
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 82, 0.8)',
    alignItems: 'center',
  },
  timeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0A0610',
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 82, 0.8)',
    alignItems: 'center',
  },
  optionBtnActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
    borderColor: colors.gold,
  },
  optionBtnActiveBlood: {
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
    borderColor: '#DC2626',
  },
  optionText: {
    fontSize: 11,
    color: '#9E8FA8',
    fontWeight: '600',
  },
  optionTextActive: {
    color: colors.gold,
    fontWeight: '800',
  },
  optionTextActiveBlood: {
    color: '#FF6B7A',
    fontWeight: '800',
  },
  modalCloseBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#120B1A',
    fontSize: 13,
    fontWeight: '800',
  },
});
