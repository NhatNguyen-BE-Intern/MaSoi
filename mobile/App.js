import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Alert,
  Vibration,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_800ExtraBold,
  PlayfairDisplay_900Black,
} from '@expo-google-fonts/playfair-display';
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import AuthScreen from './src/screens/AuthScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import RoomScreen from './src/screens/RoomScreen';
import PlayerScreen from './src/screens/PlayerScreen';
import ModeratorScreen from './src/screens/ModeratorScreen';
import CardDictionaryModal from './src/components/game/CardDictionaryModal';
import FriendsModal from './src/components/game/FriendsModal';
import { colors } from './src/constants/colors';
import { getTheme } from './src/constants/theme';
import { getSocket, disconnectSocket } from './src/services/socket';

const STORAGE_USER_KEY = '@masoi_user';

/**
 * App.js: Điểm điều phối gốc của ứng dụng Mobile Game Ma Sói
 * - Quản lý trạng thái đăng nhập, ghi nhớ phiên làm việc an toàn với AsyncStorage
 * - Sử dụng react-native-safe-area-context chuẩn để chống cảnh báo deprecated
 * - Kết nối Socket.IO thời gian thực
 * - Điều hướng: Auth ➡️ Lobby ➡️ Room ➡️ (PlayerScreen | ModeratorScreen)
 * - Tích hợp Modal Từ Điển Thẻ Bài & Quản Lý Bạn Bè
 */
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_800ExtraBold,
    PlayfairDisplay_900Black,
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });

  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentRoomCode, setCurrentRoomCode] = useState('');
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [isNight, setIsNight] = useState(true);

  // Trạng thái trong ván chơi
  const [playerRole, setPlayerRole] = useState(null);
  const [isModerator, setIsModerator] = useState(false);
  const [moderatorData, setModeratorData] = useState(null);
  const [isAlive, setIsAlive] = useState(true);
  const [activeTimer, setActiveTimer] = useState(null);

  // Trạng thái mở các Modal tiện ích
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Ref giữ mã phòng hiện tại để tự động Reconnect khi mất sóng
  const currentRoomCodeRef = useRef(currentRoomCode);
  useEffect(() => {
    currentRoomCodeRef.current = currentRoomCode;
  }, [currentRoomCode]);

  // Xử lý nút Back vật lý trên Android (BackHandler)
  useEffect(() => {
    const onBackPress = () => {
      if (isPreviewMode) {
        setIsPreviewMode(false);
        return true;
      }
      if (isDictionaryOpen) {
        setIsDictionaryOpen(false);
        return true;
      }
      if (isFriendsOpen) {
        setIsFriendsOpen(false);
        return true;
      }
      if (currentRoomCode) {
        Alert.alert(
          'Rời phòng chơi?',
          'Bạn có chắc chắn muốn rời khỏi phòng chơi hiện tại không?',
          [
            { text: 'Ở lại', style: 'cancel' },
            { text: 'Rời phòng', style: 'destructive', onPress: handleLeaveRoom },
          ]
        );
        return true;
      }
      return false;
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [isPreviewMode, isDictionaryOpen, isFriendsOpen, currentRoomCode]);

  // 1. Tự động khôi phục phiên đăng nhập từ AsyncStorage khi mở App
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(STORAGE_USER_KEY);
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          console.log('🔄 Đã khôi phục tài khoản từ AsyncStorage:', parsed.characterName || parsed.username);
          setUser(parsed);
        }
      } catch (err) {
        console.error('Lỗi khôi phục session:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    restoreSession();
  }, []);

  // 2. Đếm ngược đồng hồ thảo luận nếu có timer kích hoạt
  useEffect(() => {
    let interval = null;
    if (activeTimer && activeTimer.remaining > 0) {
      interval = setInterval(() => {
        setActiveTimer((prev) => {
          if (!prev || prev.remaining <= 1) {
            Vibration.vibrate([0, 300, 100, 300]);
            return null;
          }
          return { ...prev, remaining: prev.remaining - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  // 3. Quản lý toàn bộ sự kiện Socket.IO thời gian thực
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    // 3.0 Tự động tham gia lại phòng khi rớt mạng / Reconnect thành công
    const handleConnect = () => {
      console.log('⚡ [Socket] Kết nối / Tái kết nối thành công! Socket ID:', socket.id);
      if (currentRoomCodeRef.current && user) {
        console.log('🔄 [Socket] Tự động tham gia lại phòng sau khi kết nối:', currentRoomCodeRef.current);
        socket.emit('join_room', { roomCode: currentRoomCodeRef.current, user });
      }
    };

    // 3.1 Lắng nghe tạo phòng thành công
    const handleRoomCreated = (code) => {
      console.log('🎉 [Socket] Tạo phòng thành công, mã phòng:', code);
      setCurrentRoomCode(code);
    };

    // 3.2 Lắng nghe vào phòng thành công
    const handleRoomJoined = (code) => {
      console.log('🚪 [Socket] Đã vào phòng thành công, mã phòng:', code);
      setCurrentRoomCode(code);
    };

    // 3.3 Cập nhật danh sách người chơi thời gian thực
    const handleUpdatePlayers = (players) => {
      console.log('👥 [Socket] Cập nhật người chơi trong phòng:', players.length);
      setRoomPlayers(players);
    };

    // 3.4 Nhận thẻ bài vai trò hoặc quyền Quản trò khi ván bắt đầu
    const handleReceiveRole = (roleData) => {
      console.log('🃏 [Socket] Đã nhận dữ liệu vai trò:', roleData);
      Vibration.vibrate([0, 100, 50, 100]);

      if (roleData.isModerator) {
        setIsModerator(true);
        setModeratorData(roleData.moderatorData);
        setPlayerRole(null);
      } else {
        setIsModerator(false);
        setModeratorData(null);
        setPlayerRole(roleData);
        setIsAlive(roleData.isAlive !== undefined ? roleData.isAlive : true);
      }
    };

    // 3.5 Cập nhật danh sách người chơi riêng cho Quản trò
    const handleModPlayersUpdated = (updatedPlayers) => {
      console.log('🔄 [Socket Quản trò] Cập nhật danh sách người chơi');
      setModeratorData((prev) => (prev ? { ...prev, players: updatedPlayers } : null));
    };

    // 3.6 Thông báo thay đổi trạng thái Sống / Chết của người chơi
    const handlePlayerStatusChanged = ({ characterName, isAlive: statusAlive }) => {
      console.log(`⚡ [Socket] Trạng thái của ${characterName}: ${statusAlive ? 'Sống' : 'Chết'}`);
      if (characterName === user?.characterName) {
        setIsAlive(statusAlive);
        if (!statusAlive) {
          Vibration.vibrate([0, 400, 200, 400]);
          Alert.alert('💀 Bạn đã bị loại!', 'Bạn đã tử vong đêm nay hoặc bị dân làng biểu quyết treo cổ.');
        } else {
          Vibration.vibrate(200);
          Alert.alert('✨ Bạn đã được cứu sống!', 'Phù thủy hoặc Quản trò vừa cứu sống bạn trở lại!');
        }
      }
    };

    // 3.7 Lắng nghe đồng hồ đếm ngược thảo luận
    const handleTimerStarted = ({ seconds, label }) => {
      console.log(`⏱️ [Socket] Bắt đầu đếm ngược thảo luận: ${seconds}s`);
      setActiveTimer({ remaining: Number(seconds) || 60, label });
      Vibration.vibrate(60);
    };

    // 3.7.2 Dừng đếm ngược thảo luận
    const handleTimerStopped = () => {
      console.log('⏹️ [Socket] Đồng hồ đếm ngược đã dừng.');
      setActiveTimer(null);
    };

    // 3.8 Lắng nghe hiệu ứng âm thanh từ Quản trò
    const handleSoundTriggered = (soundType) => {
      console.log(`🔊 [Socket] Hiệu ứng âm thanh từ Quản trò: ${soundType}`);
      Vibration.vibrate([0, 120, 60, 120]);
    };

    // 3.9 Quay lại phòng chờ (Chơi ván mới)
    const handleBackToRoom = () => {
      console.log('🔄 [Socket] Quay lại phòng chờ để chuẩn bị ván mới');
      setPlayerRole(null);
      setIsModerator(false);
      setModeratorData(null);
      setActiveTimer(null);
      setIsAlive(true);
      Alert.alert('🔄 Chơi ván mới', 'Chủ phòng / Quản trò đã đặt lại ván. Toàn bộ người chơi đã quay lại Phòng chờ để chia bài ván tiếp theo!');
    };

    // 3.10 Lắng nghe lỗi từ server
    const handleErrorMsg = (msg) => {
      Alert.alert('Thông báo', msg);
      if (
        msg.includes('không tồn tại') ||
        msg.includes('giải tán') ||
        msg.includes('không thể vào')
      ) {
        setCurrentRoomCode('');
        setRoomPlayers([]);
        setPlayerRole(null);
        setIsModerator(false);
        setModeratorData(null);
        setActiveTimer(null);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('room_created', handleRoomCreated);
    socket.on('room_joined', handleRoomJoined);
    socket.on('update_players', handleUpdatePlayers);
    socket.on('receive_role', handleReceiveRole);
    socket.on('moderator_players_updated', handleModPlayersUpdated);
    socket.on('player_status_changed', handlePlayerStatusChanged);
    socket.on('timer_started', handleTimerStarted);
    socket.on('timer_stopped', handleTimerStopped);
    socket.on('sound_triggered', handleSoundTriggered);
    socket.on('back_to_room', handleBackToRoom);
    socket.on('error_msg', handleErrorMsg);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('room_created', handleRoomCreated);
      socket.off('room_joined', handleRoomJoined);
      socket.off('update_players', handleUpdatePlayers);
      socket.off('receive_role', handleReceiveRole);
      socket.off('moderator_players_updated', handleModPlayersUpdated);
      socket.off('player_status_changed', handlePlayerStatusChanged);
      socket.off('timer_started', handleTimerStarted);
      socket.off('timer_stopped', handleTimerStopped);
      socket.off('sound_triggered', handleSoundTriggered);
      socket.off('back_to_room', handleBackToRoom);
      socket.off('error_msg', handleErrorMsg);
    };
  }, [user]);

  // 4. Các hành động xác thực & lưu AsyncStorage
  const handleAuthSuccess = async (userData) => {
    setUser(userData);
    try {
      await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData));
      console.log('💾 Đã lưu phiên đăng nhập của:', userData.characterName);
    } catch (e) {
      console.error('Lỗi khi lưu AsyncStorage:', e);
    }
  };

  const handleLogout = async () => {
    handleLeaveRoom();
    disconnectSocket();
    setUser(null);
    try {
      await AsyncStorage.removeItem(STORAGE_USER_KEY);
      console.log('🗑️ Đã xóa phiên đăng nhập.');
    } catch (e) {
      console.error('Lỗi khi xóa AsyncStorage:', e);
    }
  };

  // 5. Các hành động điều khiển phòng
  const handleCreateRoom = () => {
    if (!user) return;
    const socket = getSocket();
    socket.emit('create_room', user);
  };

  const handleJoinRoom = (code) => {
    if (!user) return;
    const socket = getSocket();
    socket.emit('join_room', { roomCode: code, user });
  };

  const handleLeaveRoom = () => {
    if (currentRoomCode) {
      const socket = getSocket();
      socket.emit('leave_room', currentRoomCode);
    }
    setCurrentRoomCode('');
    setRoomPlayers([]);
    setPlayerRole(null);
    setIsModerator(false);
    setModeratorData(null);
    setActiveTimer(null);
    setIsAlive(true);
  };

  // 6. Khởi chạy ván game (Chủ phòng gửi cấu hình ván)
  const handleStartGame = (gameConfig) => {
    const socket = getSocket();
    console.log('📤 [Socket] Phát lệnh bắt đầu ván game:', gameConfig);
    socket.emit('start_game', gameConfig);
  };

  // 7. Các hành động của Quản trò
  const handleTogglePlayerStatus = ({ roomCode, targetCharacterName, targetSocketId }) => {
    const socket = getSocket();
    socket.emit('moderator_toggle_status', { roomCode, targetCharacterName, targetSocketId });
  };

  const handleBroadcastSound = ({ roomCode, soundType }) => {
    const socket = getSocket();
    socket.emit('play_sound_effect', { roomCode, soundType });
  };

  const handleStartTimer = ({ roomCode, seconds, label }) => {
    const socket = getSocket();
    socket.emit('start_discussion_timer', { roomCode, seconds, label });
  };

  const handleStopTimer = ({ roomCode }) => {
    const socket = getSocket();
    socket.emit('stop_discussion_timer', { roomCode });
    setActiveTimer(null);
  };

  const handlePlayAgain = () => {
    if (currentRoomCode) {
      const socket = getSocket();
      socket.emit('play_again', currentRoomCode);
    }
  };

  const appTheme = getTheme(isNight);
  const theme = isNight ? colors.night : colors.day;
  const backgroundColor = appTheme.colors.background;

  // Điều phối hiển thị màn hình
  const renderCurrentScreen = () => {
    // 0. Đang nạp phông chữ hoặc đọc bộ nhớ khởi động
    if ((!fontsLoaded && !fontError) || isInitializing) {
      return (
        <View style={[styles.centerLoading, { backgroundColor: appTheme.colors.background }]}>
          <Text
            style={[
              styles.loadingTitle,
              {
                color: appTheme.colors.text,
                fontFamily: fontsLoaded ? appTheme.typography.fontTitleBlack : undefined,
              },
            ]}
          >
            MA SÓI
          </Text>
          <ActivityIndicator size="large" color={appTheme.colors.text} />
          <Text
            style={[
              styles.centerLoadingText,
              {
                color: appTheme.colors.textMuted,
                fontFamily: fontsLoaded ? appTheme.typography.fontBody : undefined,
              },
            ]}
          >
            Đang tải dữ liệu trò chơi...
          </Text>
        </View>
      );
    }

    // 0.5. Chế độ xem trước thiết kế Thẻ bài 3D Gothic
    if (isPreviewMode) {
      return (
        <PlayerScreen
          user={user || { username: 'lu_khach', characterName: 'Thợ Săn Huyết Nguyệt' }}
          role={{
            name: 'Ma Sói',
            team: 'Sói',
            description:
              'Mỗi đêm cùng đồng bọn thức giấc chọn 1 con mồi tiêu diệt. Ban ngày ẩn mình giữa dân làng và gieo rắc nghi ngờ.',
          }}
          roomCode="SÓI-99"
          isAlive={true}
          activeTimer={{ remaining: 45, label: 'Thảo luận nghi vấn' }}
          isNight={isNight}
          onLeaveRoom={() => setIsPreviewMode(false)}
          onPlayAgain={() => setIsPreviewMode(false)}
          isPreview={true}
        />
      );
    }

    // 1. Chưa đăng nhập ➡️ Màn hình Đăng nhập / Đăng ký
    if (!user) {
      return (
        <AuthScreen
          onAuthSuccess={handleAuthSuccess}
          isNight={isNight}
          theme={appTheme}
        />
      );
    }

    // 2. Đang trong ván: Nếu là Quản trò ➡️ Màn hình Quản Trò
    if (currentRoomCode && isModerator) {
      return (
        <ModeratorScreen
          moderatorData={moderatorData}
          roomCode={currentRoomCode}
          isNight={isNight}
          theme={appTheme}
          onTogglePlayerStatus={handleTogglePlayerStatus}
          onBroadcastSound={handleBroadcastSound}
          onStartTimer={handleStartTimer}
          onStopTimer={handleStopTimer}
          onPlayAgain={handlePlayAgain}
          onLeaveRoom={handleLeaveRoom}
        />
      );
    }

    // 3. Đang trong ván: Nếu là Người chơi nhận bài ➡️ Màn hình Thẻ Bài
    if (currentRoomCode && playerRole) {
      return (
        <PlayerScreen
          user={user}
          role={playerRole}
          roomCode={currentRoomCode}
          isAlive={isAlive}
          activeTimer={activeTimer}
          isNight={isNight}
          theme={appTheme}
          onLeaveRoom={handleLeaveRoom}
          onPlayAgain={handlePlayAgain}
          isPreview={false}
        />
      );
    }

    // 4. Đã vào phòng nhưng chưa bắt đầu ván ➡️ Màn hình Phòng Chờ
    if (currentRoomCode) {
      return (
        <RoomScreen
          user={user}
          roomCode={currentRoomCode}
          players={roomPlayers}
          isNight={isNight}
          theme={appTheme}
          onLeaveRoom={handleLeaveRoom}
          onStartGame={handleStartGame}
        />
      );
    }

    // 5. Đã đăng nhập nhưng chưa vào phòng ➡️ Màn hình Sảnh Chờ
    return (
      <LobbyScreen
        user={user}
        onLogout={handleLogout}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onOpenDictionary={() => setIsDictionaryOpen(true)}
        onOpenFriends={() => setIsFriendsOpen(true)}
        isNight={isNight}
        theme={appTheme}
      />
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.root, { backgroundColor }]}>
        {/* TopBar Game HUD chỉ hiển thị ở Auth hoặc Sảnh Chờ Lobby để tránh đè Header 2 tầng trong ván game */}
        {!currentRoomCode && !isPreviewMode && (
          <View
            style={[
              styles.topBar,
              {
                backgroundColor: appTheme.colors.surface,
                borderBottomColor: appTheme.colors.border,
              },
            ]}
          >
          {user ? (
            <View style={styles.topQuickActions}>
              <TouchableOpacity
                style={[
                  styles.quickActionBtn,
                  {
                    backgroundColor: 'rgba(25, 17, 36, 0.85)',
                    borderColor: 'rgba(212, 175, 55, 0.35)',
                  },
                ]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (e) {}
                  setIsDictionaryOpen(true);
                }}
                activeOpacity={0.7}
                accessibilityLabel="Xem từ điển lá bài vai trò"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="book-open-page-variant-outline" size={16} color={colors.gold} />
                <Text
                  style={[
                    styles.quickActionText,
                    {
                      color: colors.gold,
                      fontFamily: fontsLoaded ? appTheme.typography.fontBodyMedium : undefined,
                    },
                  ]}
                >
                  Sách Vai Trò
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickActionBtn,
                  {
                    backgroundColor: 'rgba(25, 17, 36, 0.85)',
                    borderColor: 'rgba(212, 175, 55, 0.35)',
                  },
                ]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (e) {}
                  setIsFriendsOpen(true);
                }}
                activeOpacity={0.7}
                accessibilityLabel="Xem danh sách bạn bè"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="account-group-outline" size={16} color={colors.gold} />
                <Text
                  style={[
                    styles.quickActionText,
                    {
                      color: colors.gold,
                      fontFamily: fontsLoaded ? appTheme.typography.fontBodyMedium : undefined,
                    },
                  ]}
                >
                  Bạn Bè
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.topBrand}>
              <MaterialCommunityIcons name="wolf" size={18} color={colors.gold} />
              <Text style={styles.topBrandText}>GAME MA SÓI</Text>
            </View>
          )}

          <View style={styles.topRightControls}>
            {/* Nút Xem Mẫu Thẻ Bài 3D Mới */}
            <TouchableOpacity
              style={[
                styles.previewBadge,
                {
                  backgroundColor: isPreviewMode ? '#9E1B26' : 'rgba(158, 27, 38, 0.35)',
                  borderColor: isPreviewMode ? colors.gold : 'rgba(212, 175, 55, 0.5)',
                },
              ]}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } catch (e) {}
                setIsPreviewMode((prev) => !prev);
              }}
              activeOpacity={0.75}
            >
              <Ionicons
                name={isPreviewMode ? 'close-circle' : 'sparkles'}
                size={14}
                color={isPreviewMode ? '#ffffff' : colors.gold}
              />
              <Text style={styles.previewBadgeText}>
                {isPreviewMode ? 'Đóng Thử' : '🃏 Xem Thử Bài'}
              </Text>
            </TouchableOpacity>

            {/* Nút đổi Ngày / Đêm */}
            <TouchableOpacity
              style={[
                styles.themeToggle,
                {
                  backgroundColor: 'rgba(25, 17, 36, 0.85)',
                  borderColor: 'rgba(212, 175, 55, 0.35)',
                },
              ]}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch (e) {}
                setIsNight((prev) => !prev);
              }}
              activeOpacity={0.7}
              accessibilityLabel={isNight ? 'Chuyển sang chế độ Ban Ngày' : 'Chuyển sang chế độ Ban Đêm'}
              accessibilityRole="button"
            >
              <Ionicons
                name={isNight ? 'moon' : 'sunny'}
                size={15}
                color={isNight ? colors.gold : '#F59E0B'}
              />
              <Text
                style={[
                  styles.themeToggleText,
                  {
                    color: colors.gold,
                    fontFamily: fontsLoaded ? appTheme.typography.fontBodySemiBold : undefined,
                  },
                ]}
              >
                {isNight ? 'Đêm' : 'Ngày'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        )}

        {/* Hiển thị màn hình tương ứng */}
        {renderCurrentScreen()}

        {/* Modals tiện ích dùng chung */}
        <CardDictionaryModal
          visible={isDictionaryOpen}
          onClose={() => setIsDictionaryOpen(false)}
          isNight={isNight}
          theme={appTheme}
        />

        <FriendsModal
          visible={isFriendsOpen}
          onClose={() => setIsFriendsOpen(false)}
          user={user}
          isNight={isNight}
          theme={appTheme}
        />

        <StatusBar style={isNight ? 'light' : 'dark'} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  topBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBrandText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  topQuickActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 13,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  previewBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
  },
  themeToggleText: {
    fontSize: 13,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  loadingTitle: {
    fontSize: 34,
    letterSpacing: 4,
    fontWeight: '900',
    marginBottom: 4,
  },
  centerLoadingText: {
    fontSize: 15,
  },
  fontCheckSub: {
    fontSize: 13,
    marginTop: 6,
    letterSpacing: 1,
  },
});
