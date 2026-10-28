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
import ModeSelectionScreen from './src/screens/ModeSelectionScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import RoomScreen from './src/screens/RoomScreen';
import PlayerScreen from './src/screens/PlayerScreen';
import ModeratorScreen from './src/screens/ModeratorScreen';
import OnlineLobbyScreen from './src/screens/OnlineLobbyScreen';
import OnlineRoomLobbyScreen from './src/screens/OnlineRoomLobbyScreen';
import OnlineGameScreen from './src/screens/OnlineGameScreen';
import CardDictionaryModal from './src/components/game/CardDictionaryModal';
import FriendsModal from './src/components/game/FriendsModal';
import { colors } from './src/constants/colors';
import { getTheme } from './src/constants/theme';
import { getSocket, disconnectSocket } from './src/services/socket';
import { SOCKET_EVENTS } from './src/constants/socketEvents';

const STORAGE_USER_KEY = '@masoi_user';
const STORAGE_MODE_KEY = '@masoi_game_mode';

/**
 * App.js: Điểm điều phối gốc của ứng dụng Mobile Game Ma Sói
 * - Hỗ trợ Song Song 2 Chế Độ: Offline Companion & Online Remote 100%
 * - Quản lý trạng thái đăng nhập, ghi nhớ phiên làm việc an toàn với AsyncStorage
 * - Điều hướng: Auth ➡️ ModeSelection ➡️ (Lobby / OnlineLobby) ➡️ (Room / OnlineRoom) ➡️ (Player / OnlineGame / Moderator)
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
  const [gameMode, setGameMode] = useState(null); // 'offline' | 'online'
  const [isModeSelectionOpen, setIsModeSelectionOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentRoomCode, setCurrentRoomCode] = useState('');
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [roomMetadata, setRoomMetadata] = useState(null);
  const [isNight, setIsNight] = useState(true);

  // Trạng thái trong ván chơi
  const [playerRole, setPlayerRole] = useState(null);
  const [isModerator, setIsModerator] = useState(false);
  const [moderatorData, setModeratorData] = useState(null);
  const [isAlive, setIsAlive] = useState(true);
  const [activeTimer, setActiveTimer] = useState(null);

  // Trạng thái Game Engine Online
  const [currentPhase, setCurrentPhase] = useState('LOBBY');
  const [deathAnnouncementData, setDeathAnnouncementData] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);

  // Trạng thái mở các Modal tiện ích
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Ref giữ mã phòng hiện tại để tự động Reconnect
  const currentRoomCodeRef = useRef(currentRoomCode);
  useEffect(() => {
    currentRoomCodeRef.current = currentRoomCode;
  }, [currentRoomCode]);

  // Xử lý nút Back vật lý trên Android
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
      if (isModeSelectionOpen && gameMode) {
        setIsModeSelectionOpen(false);
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
  }, [isPreviewMode, isDictionaryOpen, isFriendsOpen, isModeSelectionOpen, gameMode, currentRoomCode]);

  // 1. Tự động khôi phục phiên đăng nhập & chế độ chơi từ AsyncStorage khi mở App
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [savedUser, savedMode] = await Promise.all([
          AsyncStorage.getItem(STORAGE_USER_KEY),
          AsyncStorage.getItem(STORAGE_MODE_KEY),
        ]);

        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          console.log('🔄 Đã khôi phục tài khoản:', parsed.characterName || parsed.username);
          setUser(parsed);
        }

        if (savedMode) {
          console.log('🌐 Đã khôi phục chế độ chơi:', savedMode);
          setGameMode(savedMode);
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

  // 3. Quản lý toàn bộ sự kiện Socket.IO thời gian thực (Offline + Online)
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    const handleConnect = () => {
      console.log('⚡ [Socket Mobile] Kết nối thành công! Socket ID:', socket.id);
      if (currentRoomCodeRef.current && user) {
        socket.emit(SOCKET_EVENTS.CLIENT.JOIN_ROOM, { roomCode: currentRoomCodeRef.current, user });
      }
    };

    const handleRoomCreated = (code) => {
      console.log('🎉 [Socket] Tạo phòng thành công:', code);
      setCurrentRoomCode(code);
    };

    const handleRoomJoined = (code) => {
      console.log('🚪 [Socket] Vào phòng thành công:', code);
      setCurrentRoomCode(code);
    };

    const handleUpdatePlayers = (data) => {
      const players = Array.isArray(data) ? data : data?.players || [];
      const meta = data?.metadata || null;
      setRoomPlayers(players);
      if (meta) {
        setRoomMetadata(meta);
        if (meta.gameMode) {
          setGameMode(meta.gameMode);
          AsyncStorage.setItem(STORAGE_MODE_KEY, meta.gameMode).catch(() => {});
        }
      }
    };

    const handleOnlineRoomSettingsUpdated = (newSettings) => {
      setRoomMetadata((prev) => (prev ? { ...prev, settings: newSettings } : prev));
    };

    const handleHostChanged = (newHost) => {
      if (newHost?.characterName?.toLowerCase() === user?.characterName?.toLowerCase()) {
        Alert.alert('👑 Chủ phòng mới', 'Bạn hiện là Chủ phòng mới của ván đấu!');
      }
    };

    const handleKickedFromRoom = (msg) => {
      Alert.alert('Thông báo', msg);
      handleLeaveRoom();
    };

    const handleReceiveRole = (roleData) => {
      console.log('🃏 [Socket] Đã nhận vai trò:', roleData);
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

    const handleModPlayersUpdated = (updatedPlayers) => {
      setModeratorData((prev) => (prev ? { ...prev, players: updatedPlayers } : null));
    };

    const handlePlayerStatusChanged = ({ characterName, isAlive: statusAlive }) => {
      if (characterName === user?.characterName) {
        setIsAlive(statusAlive);
        if (!statusAlive) {
          Vibration.vibrate([0, 400, 200, 400]);
          Alert.alert('💀 Bạn đã bị loại!', 'Bạn đã tử vong đêm nay hoặc bị dân làng biểu quyết treo cổ.');
        } else {
          Vibration.vibrate(200);
          Alert.alert('✨ Bạn đã được cứu sống!', 'Bạn vừa được cứu sống trở lại!');
        }
      }
    };

    const handlePhaseChanged = (data) => {
      if (data?.phase) setCurrentPhase(data.phase);
    };

    const handleDayAnnouncement = (data) => {
      setDeathAnnouncementData(data);
    };

    const handleTimerStarted = ({ seconds, label }) => {
      setActiveTimer({ remaining: Number(seconds) || 60, label });
      Vibration.vibrate(60);
    };

    const handleTimerStopped = () => {
      setActiveTimer(null);
    };

    const handleSoundTriggered = (soundType) => {
      console.log(`🔊 [Socket] Hiệu ứng âm thanh: ${soundType}`);
      Vibration.vibrate([0, 120, 60, 120]);
    };

    const handleBackToRoom = () => {
      console.log('🔄 [Socket] Quay lại phòng chờ để chuẩn bị ván mới');
      setPlayerRole(null);
      setIsModerator(false);
      setModeratorData(null);
      setActiveTimer(null);
      setIsAlive(true);
      setGameOverData(null);
      setDeathAnnouncementData(null);
      setCurrentPhase('LOBBY');
      Alert.alert('🔄 Chơi ván mới', 'Cả phòng đã quay lại Phòng chờ để sẵn sàng cho ván tiếp theo!');
    };

    const handleErrorMsg = (msg) => {
      Alert.alert('Thông báo', msg);
      if (
        msg.includes('không tồn tại') ||
        msg.includes('giải tán') ||
        msg.includes('không thể vào')
      ) {
        setCurrentRoomCode('');
        setRoomPlayers([]);
        setRoomMetadata(null);
        setPlayerRole(null);
        setIsModerator(false);
        setModeratorData(null);
        setActiveTimer(null);
        setGameOverData(null);
      }
    };

    const handleGameOver = (data) => {
      console.log('🏆 [Socket] Trận đấu kết thúc:', data?.winner);
      setGameOverData(data);
      setCurrentPhase('GAME_OVER');
      try {
        Vibration.vibrate([0, 300, 150, 300, 150, 500]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    };

    socket.on('connect', handleConnect);
    socket.on('room_created', handleRoomCreated);
    socket.on('room_joined', handleRoomJoined);
    socket.on('update_players', handleUpdatePlayers);
    socket.on('online_room_settings_updated', handleOnlineRoomSettingsUpdated);
    socket.on('host_changed', handleHostChanged);
    socket.on('kicked_from_room', handleKickedFromRoom);
    socket.on('receive_role', handleReceiveRole);
    socket.on('moderator_players_updated', handleModPlayersUpdated);
    socket.on('player_status_changed', handlePlayerStatusChanged);
    socket.on('phase_changed', handlePhaseChanged);
    socket.on('day_announcement', handleDayAnnouncement);
    socket.on('timer_started', handleTimerStarted);
    socket.on('timer_stopped', handleTimerStopped);
    socket.on('sound_triggered', handleSoundTriggered);
    socket.on('back_to_room', handleBackToRoom);
    socket.on('error_msg', handleErrorMsg);
    socket.on('game_over', handleGameOver);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('room_created', handleRoomCreated);
      socket.off('room_joined', handleRoomJoined);
      socket.off('update_players', handleUpdatePlayers);
      socket.off('online_room_settings_updated', handleOnlineRoomSettingsUpdated);
      socket.off('host_changed', handleHostChanged);
      socket.off('kicked_from_room', handleKickedFromRoom);
      socket.off('receive_role', handleReceiveRole);
      socket.off('moderator_players_updated', handleModPlayersUpdated);
      socket.off('player_status_changed', handlePlayerStatusChanged);
      socket.off('phase_changed', handlePhaseChanged);
      socket.off('day_announcement', handleDayAnnouncement);
      socket.off('timer_started', handleTimerStarted);
      socket.off('timer_stopped', handleTimerStopped);
      socket.off('sound_triggered', handleSoundTriggered);
      socket.off('back_to_room', handleBackToRoom);
      socket.off('error_msg', handleErrorMsg);
      socket.off('game_over', handleGameOver);
    };
  }, [user]);

  // 4. Các hành động xác thực
  const handleAuthSuccess = async (userData) => {
    setUser(userData);
    try {
      await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData));
    } catch (e) {
      console.error('Lỗi khi lưu AsyncStorage:', e);
    }
  };

  const handleLogout = async () => {
    handleLeaveRoom();
    disconnectSocket();
    setUser(null);
    setGameMode(null);
    try {
      await AsyncStorage.multiRemove([STORAGE_USER_KEY, STORAGE_MODE_KEY]);
    } catch (e) {}
  };

  // 5. Chọn Chế Độ Chơi (Portal)
  const handleSelectMode = async (mode) => {
    setGameMode(mode);
    setIsModeSelectionOpen(false);
    try {
      await AsyncStorage.setItem(STORAGE_MODE_KEY, mode);
    } catch (e) {}
  };

  // 6. Các hành động điều khiển phòng
  const handleCreateRoom = () => {
    if (!user) return;
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.CREATE_ROOM, user);
  };

  const handleCreateOnlineRoom = (roomData) => {
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.CREATE_ONLINE_ROOM, roomData);
  };

  const handleJoinRoom = (code) => {
    if (!user) return;
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.JOIN_ROOM, { roomCode: code, user });
  };

  const handleJoinOnlineRoom = (code, pinCode) => {
    if (!user) return;
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.JOIN_ROOM, { roomCode: code, user, pinCode });
  };

  const handleLeaveRoom = () => {
    if (currentRoomCode) {
      const socket = getSocket();
      socket.emit(SOCKET_EVENTS.CLIENT.LEAVE_ROOM, currentRoomCode);
    }
    setCurrentRoomCode('');
    setRoomPlayers([]);
    setRoomMetadata(null);
    setPlayerRole(null);
    setIsModerator(false);
    setModeratorData(null);
    setActiveTimer(null);
    setIsAlive(true);
    setGameOverData(null);
    setDeathAnnouncementData(null);
    setCurrentPhase('LOBBY');
  };

  const handleStartGame = (gameConfig) => {
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.START_GAME, gameConfig);
  };

  const handlePlayAgain = () => {
    if (currentRoomCode) {
      const socket = getSocket();
      socket.emit(SOCKET_EVENTS.CLIENT.PLAY_AGAIN, currentRoomCode);
    }
  };

  // Moderator actions
  const handleTogglePlayerStatus = ({ roomCode, targetCharacterName, targetSocketId }) => {
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.MODERATOR_TOGGLE_STATUS, { roomCode, targetCharacterName, targetSocketId });
  };

  const handleBroadcastSound = ({ roomCode, soundType }) => {
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.PLAY_SOUND_EFFECT, { roomCode, soundType });
  };

  const handleStartTimer = ({ roomCode, seconds, label }) => {
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.START_DISCUSSION_TIMER, { roomCode, seconds, label });
  };

  const handleStopTimer = ({ roomCode }) => {
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CLIENT.STOP_DISCUSSION_TIMER, { roomCode });
    setActiveTimer(null);
  };

  const appTheme = getTheme(isNight);
  const backgroundColor = appTheme.colors.background;

  // Điều phối hiển thị màn hình chính
  const renderCurrentScreen = () => {
    // 0. Đang nạp phông chữ hoặc khởi động
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

    // 0.5. Xem trước mẫu Thẻ bài 3D
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

    // 2. Chưa chọn Chế độ chơi hoặc bấm Đổi Chế Độ ➡️ ModeSelectionScreen
    if (!gameMode || isModeSelectionOpen) {
      return (
        <ModeSelectionScreen
          user={user}
          onSelectMode={handleSelectMode}
          isNight={isNight}
          onLogout={handleLogout}
        />
      );
    }

    const isOnlineRoom = roomMetadata?.gameMode === 'online' || gameMode === 'online';
    const isRoomHost = roomPlayers.some((p) => p.characterName === user?.characterName && p.isHost);

    // 3. Đang trong ván chơi
    if (currentRoomCode && (playerRole || isModerator)) {
      if (isOnlineRoom) {
        return (
          <OnlineGameScreen
            roomCode={currentRoomCode}
            user={user}
            role={playerRole}
            players={roomPlayers}
            isAlive={isAlive}
            currentPhase={currentPhase}
            isHost={isRoomHost}
            activeTimer={activeTimer}
            onLeaveRoom={handleLeaveRoom}
            onPlayAgain={handlePlayAgain}
            gameOverData={gameOverData}
            deathAnnouncementData={deathAnnouncementData}
            onCloseDeathAnnouncement={() => setDeathAnnouncementData(null)}
            isNight={isNight}
          />
        );
      }

      if (isModerator) {
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

      return (
        <PlayerScreen
          user={user}
          role={playerRole}
          roomCode={currentRoomCode}
          isAlive={isAlive}
          activeTimer={activeTimer}
          isNight={isNight}
          theme={appTheme}
          isHost={isRoomHost}
          onLeaveRoom={handleLeaveRoom}
          onPlayAgain={handlePlayAgain}
          onBroadcastSound={handleBroadcastSound}
          onStartTimer={handleStartTimer}
          onStopTimer={handleStopTimer}
          isPreview={false}
        />
      );
    }

    // 4. Đã vào phòng chờ (chưa bắt đầu ván)
    if (currentRoomCode) {
      if (isOnlineRoom) {
        return (
          <OnlineRoomLobbyScreen
            roomCode={currentRoomCode}
            players={roomPlayers}
            metadata={roomMetadata}
            user={user}
            isHost={isRoomHost}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
            isNight={isNight}
          />
        );
      }

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

    // 5. Ở Sảnh Chờ ngoài (Chưa vào phòng)
    if (gameMode === 'online') {
      return (
        <OnlineLobbyScreen
          user={user}
          onJoinRoom={handleJoinOnlineRoom}
          onCreateOnlineRoom={handleCreateOnlineRoom}
          onSwitchMode={() => setIsModeSelectionOpen(true)}
          onOpenFriends={() => setIsFriendsOpen(true)}
          onOpenDictionary={() => setIsDictionaryOpen(true)}
          isNight={isNight}
        />
      );
    }

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
        {/* TopBar chỉ hiển thị khi ở sảnh hoặc chưa vào ván đấu */}
        {!currentRoomCode && !isPreviewMode && !isModeSelectionOpen && user && (
          <View
            style={[
              styles.topBar,
              {
                backgroundColor: appTheme.colors.surface,
                borderBottomColor: appTheme.colors.border,
              },
            ]}
          >
            <View style={styles.topQuickActions}>
              {/* Nút Đổi Chế Độ */}
              <TouchableOpacity
                style={[
                  styles.quickActionBtn,
                  {
                    backgroundColor: gameMode === 'online' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(212, 175, 55, 0.15)',
                    borderColor: gameMode === 'online' ? '#FF6B7A' : colors.gold,
                  },
                ]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (e) {}
                  setIsModeSelectionOpen(true);
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={gameMode === 'online' ? 'earth' : 'cards-playing-outline'}
                  size={15}
                  color={gameMode === 'online' ? '#FF6B7A' : colors.gold}
                />
                <Text
                  style={[
                    styles.quickActionText,
                    {
                      color: gameMode === 'online' ? '#FF6B7A' : colors.gold,
                      fontWeight: '800',
                    },
                  ]}
                >
                  {gameMode === 'online' ? 'Chơi Online' : 'Ngoài Đời'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtnSmall}
                onPress={() => setIsDictionaryOpen(true)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="book-open-page-variant-outline" size={16} color={colors.gold} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtnSmall}
                onPress={() => setIsFriendsOpen(true)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="account-group-outline" size={16} color={colors.gold} />
              </TouchableOpacity>
            </View>

            <View style={styles.topRightControls}>
              {/* Nút đổi Ngày / Đêm */}
              <TouchableOpacity
                style={styles.themeToggle}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch (e) {}
                  setIsNight((prev) => !prev);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isNight ? 'moon' : 'sunny'}
                  size={15}
                  color={isNight ? colors.gold : '#F59E0B'}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Màn hình tương ứng */}
        {renderCurrentScreen()}

        {/* Modals tiện ích */}
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
  topQuickActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
  },
  quickActionBtnSmall: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: 'rgba(25, 17, 36, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggle: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: 'rgba(25, 17, 36, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingTitle: {
    fontSize: 26,
    letterSpacing: 3,
  },
  centerLoadingText: {
    fontSize: 13,
  },
});
