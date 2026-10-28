import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { getTheme, typography } from '../../constants/theme';
import { getSocket } from '../../services/socket';
import { SOCKET_EVENTS } from '../../constants/socketEvents';

const QUICK_PRESETS = [
  'Tôi là Dân Làng lương thiện! 🌾',
  'Tôi vô tội, xin đừng vote tôi! 🙏',
  'Tôi nghi ngờ người số [Ghế]! 🧐',
  'Đề nghị cả làng bỏ phiếu trắng hôm nay! 🕊️',
  'Ai có chức năng hãy lên tiếng dẫn dắt! 🔮',
  'Hãy cẩn thận kẻ giả danh! 🐺',
];

/**
 * Khung Chat 4 Kênh Thời Gian Thực trên Mobile (MobileChatDrawer)
 * - 4 Tab: Làng (Town), Sói (Wolf), Cặp Đôi (Lovers), Hồn Ma (Ghost)
 * - Thanh phím Chat Nhanh 1-chạm
 * - Cooldown 1.5s per message
 */
export default function MobileChatDrawer({
  visible,
  onClose,
  roomCode,
  user,
  players = [],
  role,
  isAlive = true,
  currentPhase = 'LOBBY',
  loverPartner = null,
  isNight = true,
}) {
  const theme = getTheme(isNight);
  const [activeTab, setActiveTab] = useState('town');
  const [messages, setMessages] = useState({
    town: [],
    wolf: [],
    lovers: [],
    ghost: [],
  });
  const [inputText, setInputText] = useState('');
  const [lastSentTime, setLastSentTime] = useState(0);

  const flatListRef = useRef(null);

  const isLycanOrDoppel =
    role?.code === 'LYCAN' ||
    role?.name?.toLowerCase().includes('bán sói') ||
    role?.name?.toLowerCase().includes('lycan') ||
    role?.code === 'DOPPELGANGER' ||
    role?.name?.toLowerCase().includes('hóa sói') ||
    role?.name?.toLowerCase().includes('doppelganger');

  const isWolf =
    !isLycanOrDoppel &&
    (role?.team === 'Sói' ||
      role?.name?.toLowerCase().includes('sói') ||
      role?.name?.toLowerCase().includes('wolf'));

  const isLover = Boolean(loverPartner);

  // Tự động chuyển tab thông minh theo phase
  useEffect(() => {
    if (!isAlive) {
      setActiveTab('ghost');
    } else if (currentPhase?.startsWith('NIGHT_') && isWolf) {
      setActiveTab('wolf');
    } else {
      setActiveTab('town');
    }
  }, [currentPhase, isAlive, isWolf]);

  // Lắng nghe tin nhắn chat từ socket
  useEffect(() => {
    const socket = getSocket();

    const handleReceiveChat = (msg) => {
      setMessages((prev) => {
        const chan = msg.channel || 'town';
        const currentList = prev[chan] || [];
        // Tránh trùng lặp id
        if (currentList.some((m) => m.id === msg.id)) return prev;
        return {
          ...prev,
          [chan]: [...currentList, msg],
        };
      });

      try {
        Haptics.selectionAsync();
      } catch (e) {}
    };

    const handleChatHistory = (history) => {
      if (history) {
        setMessages({
          town: history.town || [],
          wolf: history.wolf || [],
          lovers: history.lovers || [],
          ghost: history.ghost || [],
        });
      }
    };

    const handleChatError = (errMsg) => {
      Alert.alert('Không thể gửi tin', errMsg);
    };

    socket.on(SOCKET_EVENTS.SERVER.RECEIVE_CHAT_MESSAGE, handleReceiveChat);
    socket.on(SOCKET_EVENTS.SERVER.CHAT_HISTORY, handleChatHistory);
    socket.on(SOCKET_EVENTS.SERVER.CHAT_ERROR, handleChatError);

    // Lấy lịch sử tin nhắn
    if (roomCode) {
      socket.emit(SOCKET_EVENTS.CLIENT.GET_CHAT_HISTORY, { roomCode });
    }

    return () => {
      socket.off(SOCKET_EVENTS.SERVER.RECEIVE_CHAT_MESSAGE, handleReceiveChat);
      socket.off(SOCKET_EVENTS.SERVER.CHAT_HISTORY, handleChatHistory);
      socket.off(SOCKET_EVENTS.SERVER.CHAT_ERROR, handleChatError);
    };
  }, [roomCode]);

  // Cuộn xuống tin mới nhất
  useEffect(() => {
    if (visible && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages, activeTab, visible]);

  // Gửi tin nhắn
  const handleSendMessage = (textToSend) => {
    const finalMsg = (textToSend || inputText).trim();
    if (!finalMsg || !roomCode) return;

    const now = Date.now();
    if (now - lastSentTime < 1500) {
      return Alert.alert('Gửi quá nhanh', 'Vui lòng chờ 1.5 giây giữa các tin nhắn!');
    }

    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.SEND_CHAT_MESSAGE, {
      roomCode,
      channel: activeTab,
      message: finalMsg,
    });

    setLastSentTime(now);
    setInputText('');
  };

  const currentList = messages[activeTab] || [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header & Nút Đóng */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="chat-processing-outline" size={20} color={colors.gold} />
              <Text style={[styles.sheetTitle, { fontFamily: typography.fontTitleBold }]}>
                KHUNG GIAO TIẾP ({activeTab.toUpperCase()})
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#A79BB0" />
            </TouchableOpacity>
          </View>

          {/* 4 Tabs: Làng, Sói, Cặp Đôi, Hồn Ma */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'town' && styles.tabItemActiveTown]}
              onPress={() => setActiveTab('town')}
            >
              <Text style={[styles.tabText, activeTab === 'town' && styles.tabTextActiveTown]}>
                🌾 Làng
              </Text>
            </TouchableOpacity>

            {isWolf && (
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'wolf' && styles.tabItemActiveWolf]}
                onPress={() => setActiveTab('wolf')}
              >
                <Text style={[styles.tabText, activeTab === 'wolf' && styles.tabTextActiveWolf]}>
                  🐺 Ma Sói
                </Text>
              </TouchableOpacity>
            )}

            {isLover && (
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'lovers' && styles.tabItemActiveLovers]}
                onPress={() => setActiveTab('lovers')}
              >
                <Text style={[styles.tabText, activeTab === 'lovers' && styles.tabTextActiveLovers]}>
                  💖 Cặp Đôi
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'ghost' && styles.tabItemActiveGhost]}
              onPress={() => setActiveTab('ghost')}
            >
              <Text style={[styles.tabText, activeTab === 'ghost' && styles.tabTextActiveGhost]}>
                💀 Hồn Ma
              </Text>
            </TouchableOpacity>
          </View>

          {/* Danh Sách Tin Nhắn */}
          <FlatList
            ref={flatListRef}
            data={currentList}
            keyExtractor={(item) => item.id || `${item.timestamp}_${Math.random()}`}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            renderItem={({ item }) => {
              const isMe = item.senderName?.toLowerCase() === user?.characterName?.toLowerCase();

              return (
                <View style={[styles.messageBubbleRow, isMe && styles.messageBubbleRowMe]}>
                  <View
                    style={[
                      styles.messageBubble,
                      isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
                      item.channel === 'wolf' && styles.bubbleWolf,
                      item.channel === 'lovers' && styles.bubbleLovers,
                      item.channel === 'ghost' && styles.bubbleGhost,
                    ]}
                  >
                    {!isMe && (
                      <Text style={styles.senderHeader}>
                        {item.senderName} {item.seatNumber ? `(#${item.seatNumber})` : ''}
                      </Text>
                    )}
                    <Text style={styles.messageText}>{item.text}</Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Text style={styles.emptyMessagesText}>Chưa có tin nhắn nào trong kênh này...</Text>
              </View>
            }
          />

          {/* Thanh Chat Nhanh 1-Chạm */}
          <View style={styles.quickPresetBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
              {QUICK_PRESETS.map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.presetChip}
                  onPress={() => handleSendMessage(preset)}
                >
                  <Text style={styles.presetChipText}>{preset}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Ô Nhập Tin Nhắn & Nút Gửi */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.chatInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập nội dung trò chuyện..."
              placeholderTextColor="#6E5D78"
              maxLength={200}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={17} color={inputText.trim() ? '#120B1A' : '#7A6B85'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '75%',
    backgroundColor: '#120B1C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(61, 43, 82, 0.6)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    color: colors.gold,
    fontSize: 13,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 6, 16, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(61, 43, 82, 0.4)',
    gap: 6,
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(21, 15, 30, 0.6)',
  },
  tabItemActiveTown: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  tabItemActiveWolf: {
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  tabItemActiveLovers: {
    backgroundColor: 'rgba(236, 72, 153, 0.25)',
    borderWidth: 1,
    borderColor: '#F472B6',
  },
  tabItemActiveGhost: {
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  tabText: {
    fontSize: 12,
    color: '#9E8FA8',
    fontWeight: '600',
  },
  tabTextActiveTown: {
    color: colors.gold,
    fontWeight: '800',
  },
  tabTextActiveWolf: {
    color: '#FF7582',
    fontWeight: '800',
  },
  tabTextActiveLovers: {
    color: '#F472B6',
    fontWeight: '800',
  },
  tabTextActiveGhost: {
    color: '#CBD5E1',
    fontWeight: '800',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 14,
    gap: 8,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  messageBubbleRowMe: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  messageBubbleOther: {
    backgroundColor: 'rgba(30, 20, 44, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 82, 0.7)',
  },
  messageBubbleMe: {
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
  },
  bubbleWolf: {
    backgroundColor: 'rgba(60, 10, 20, 0.9)',
    borderColor: 'rgba(220, 38, 38, 0.6)',
  },
  bubbleLovers: {
    backgroundColor: 'rgba(60, 20, 45, 0.9)',
    borderColor: 'rgba(236, 72, 153, 0.6)',
  },
  bubbleGhost: {
    backgroundColor: 'rgba(20, 25, 35, 0.9)',
    borderColor: 'rgba(100, 116, 139, 0.5)',
  },
  senderHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: 3,
  },
  messageText: {
    fontSize: 13,
    color: '#F5ECD7',
    lineHeight: 18,
  },
  emptyMessages: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyMessagesText: {
    color: '#7A6B85',
    fontSize: 12,
  },
  quickPresetBar: {
    paddingVertical: 6,
    backgroundColor: 'rgba(10, 6, 16, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(61, 43, 82, 0.4)',
  },
  presetScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  presetChip: {
    backgroundColor: 'rgba(21, 15, 30, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  presetChipText: {
    fontSize: 11,
    color: '#D4C8DE',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0A0610',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#180E24',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 82, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F5ECD7',
    fontSize: 13,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(50, 35, 70, 0.6)',
  },
});
