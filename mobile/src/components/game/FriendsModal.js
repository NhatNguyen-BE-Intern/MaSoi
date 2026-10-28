import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { getTheme, typography, shapes, shadows } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/config';

/**
 * Modal Quản Lý Bạn Bè (FriendsModal)
 * PHONG CÁCH: Quạ Truyền Tin & Minh Ước Đồng Minh (The Raven Post & Blood Oath) - Dark Gothic
 * - Gửi mật thư kết giao qua danh xưng hiệp sĩ
 * - Huy hiệu ấn tín sáp phong cho từng đồng minh
 * - Bảng thông báo trạng thái khắc đá cổ phát quang
 */
export default function FriendsModal({ visible, onClose, user, isNight = true }) {
  const [friends, setFriends] = useState([]);
  const [friendNameInput, setFriendNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [isInputFocused, setIsInputFocused] = useState(false);

  const theme = getTheme(isNight);

  useEffect(() => {
    if (visible && user?.characterName) {
      loadFriends();
      setStatusMsg({ text: '', type: '' });
      setFriendNameInput('');
    }
  }, [visible, user]);

  const loadFriends = async () => {
    if (!user?.characterName) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/friends/list/${encodeURIComponent(user.characterName)}`
      );
      const data = await res.json();
      if (res.ok && data.friends) {
        setFriends(data.friends);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách bạn bè:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    const trimmed = friendNameInput.trim();
    if (!trimmed) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
      return setStatusMsg({ text: 'Vui lòng nhập tên người chơi bạn muốn kết bạn!', type: 'error' });
    }

    if (trimmed.toLowerCase() === user?.characterName?.toLowerCase()) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
      return setStatusMsg({ text: 'Bạn không thể tự kết bạn với chính mình!', type: 'error' });
    }

    setAdding(true);
    setStatusMsg({ text: 'Đang gửi lời mời kết bạn...', type: 'info' });

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await fetch(`${API_BASE_URL}/api/friends/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          myName: user.characterName,
          friendName: trimmed,
          token: user?.token,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
        setStatusMsg({ text: data.message || `Đã kết bạn với ${trimmed}!`, type: 'success' });
        setFriendNameInput('');
        loadFriends();
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (e) {}
        setStatusMsg({ text: data.message || 'Không tìm thấy người chơi này!', type: 'error' });
      }
    } catch (err) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
      setStatusMsg({ text: 'Không thể kết nối tới máy chủ!', type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  const handleCopyName = async (name) => {
    try {
      await Clipboard.setStringAsync(name);
      try {
        Haptics.selectionAsync();
      } catch (e) {}
      setStatusMsg({ text: `Đã sao chép tên [${name}]!`, type: 'info' });
    } catch (e) {}
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 1. Header Quạ Truyền Tin */}
          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <View style={styles.headerIconFrame}>
                <MaterialCommunityIcons name="feather" size={22} color={colors.gold} />
              </View>
              <View>
                <Text style={styles.headerTitle}>DANH SÁCH BẠN BÈ</Text>
                <Text style={styles.headerSub}>
                  Kết bạn và xem danh sách bạn bè trong game
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (e) {}
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* 2. Khung Thêm Bạn Bè (Add Friend) */}
          <View style={styles.addCard}>
            <View style={styles.addCardHeader}>
              <MaterialCommunityIcons name="account-plus-outline" size={16} color={colors.gold} />
              <Text style={styles.addTitle}>THÊM BẠN MỚI:</Text>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  isInputFocused && styles.inputFocused,
                ]}
                placeholder="Nhập tên nhân vật cần kết bạn..."
                placeholderTextColor="rgba(245, 236, 215, 0.4)"
                value={friendNameInput}
                onChangeText={setFriendNameInput}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.sendRavenBtn, adding && { opacity: 0.6 }]}
                onPress={handleAddFriend}
                disabled={adding}
                activeOpacity={0.8}
              >
                {adding ? (
                  <ActivityIndicator size="small" color="#07050A" />
                ) : (
                  <View style={styles.sendRavenInner}>
                    <MaterialCommunityIcons name="account-plus" size={14} color="#07050A" />
                    <Text style={styles.sendRavenText}>Kết Bạn</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Thông báo trạng thái */}
            {statusMsg.text ? (
              <View
                style={[
                  styles.statusBanner,
                  statusMsg.type === 'success' && styles.statusSuccess,
                  statusMsg.type === 'error' && styles.statusError,
                  statusMsg.type === 'info' && styles.statusInfo,
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    statusMsg.type === 'success'
                      ? 'shield-check'
                      : statusMsg.type === 'error'
                      ? 'alert-circle'
                      : 'information'
                  }
                  size={15}
                  color={
                    statusMsg.type === 'success'
                      ? colors.success
                      : statusMsg.type === 'error'
                      ? colors.danger
                      : colors.gold
                  }
                />
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        statusMsg.type === 'success'
                          ? colors.success
                          : statusMsg.type === 'error'
                          ? '#fca5a5'
                          : colors.gold,
                    },
                  ]}
                >
                  {statusMsg.text}
                </Text>
              </View>
            ) : null}
          </View>

          {/* 3. Tiêu đề danh sách Bạn Bè */}
          <View style={styles.listSectionHeader}>
            <View style={styles.listHeaderBadge}>
              <MaterialCommunityIcons name="account-multiple" size={14} color={colors.gold} />
              <Text style={styles.listSectionTitle}>
                DANH SÁCH BẠN BÈ ({friends.length})
              </Text>
            </View>
            <Text style={styles.listSectionHint}>Chạm để sao chép tên</Text>
          </View>

          {/* 4. Nội dung danh sách Bạn Bè */}
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.gold} />
              <Text style={styles.loadingText}>Đang tải danh sách bạn bè...</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            >
              {friends.length > 0 ? (
                friends.map((friendName, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.friendCard}
                    onPress={() => handleCopyName(friendName)}
                    activeOpacity={0.8}
                  >
                    {/* Avatar bạn bè */}
                    <View style={styles.friendLeft}>
                      <View style={styles.waxSealAvatar}>
                        <View style={styles.waxSealInner}>
                          <Text style={styles.waxSealInitial}>
                            {friendName ? friendName.substring(0, 1).toUpperCase() : '👤'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.friendNameBox}>
                        <Text style={styles.friendName}>{friendName}</Text>
                        <Text style={styles.friendSubText}>
                          Bạn bè trong game
                        </Text>
                      </View>
                    </View>

                    {/* Huy hiệu Bạn Bè */}
                    <View style={styles.allyBadge}>
                      <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                      <Text style={styles.allyBadgeText}>BẠN BÈ</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.centerBox}>
                  <View style={styles.emptyIconRing}>
                    <MaterialCommunityIcons
                      name="account-search-outline"
                      size={42}
                      color="rgba(212, 175, 55, 0.4)"
                    />
                  </View>
                  <Text style={styles.emptyTitle}>Chưa có người bạn nào</Text>
                  <Text style={styles.emptyText}>
                    Bạn chưa thêm bạn bè nào vào danh sách.{'\n'}
                    Hãy nhập tên nhân vật ở ô phía trên để kết bạn cùng chơi nhé!
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '84%',
    backgroundColor: 'rgba(13, 9, 20, 0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    padding: 20,
    paddingBottom: 30,
    ...shadows.glowBlood,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.18)',
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconFrame: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1.5,
    borderColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glowGold,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.gold,
    letterSpacing: 1.2,
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(245, 236, 215, 0.65)',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCard: {
    backgroundColor: 'rgba(25, 17, 36, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  addCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    backgroundColor: 'rgba(7, 5, 10, 0.75)',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#F5ECD7',
  },
  inputFocused: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(7, 5, 10, 0.95)',
    ...shadows.glowGold,
  },
  sendRavenBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E5AB',
  },
  sendRavenInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sendRavenText: {
    color: '#07050A',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  statusError: {
    backgroundColor: 'rgba(196, 30, 58, 0.12)',
    borderColor: 'rgba(196, 30, 58, 0.4)',
  },
  statusInfo: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  listSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  listHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 0.8,
  },
  listSectionHint: {
    fontSize: 11,
    color: 'rgba(245, 236, 215, 0.45)',
  },
  listContainer: {
    gap: 10,
    paddingBottom: 24,
  },
  friendCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 17, 36, 0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  waxSealAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(158, 27, 38, 0.45)',
    borderWidth: 1.5,
    borderColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glowGold,
  },
  waxSealInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9E1B26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waxSealInitial: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  friendNameBox: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F5ECD7',
    letterSpacing: 0.5,
  },
  friendSubText: {
    fontSize: 10,
    color: 'rgba(245, 236, 215, 0.5)',
    marginTop: 2,
  },
  allyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  allyBadgeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 10,
  },
  emptyIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: 'rgba(245, 236, 215, 0.6)',
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingText: {
    fontSize: 13,
    color: colors.gold,
  },
});
