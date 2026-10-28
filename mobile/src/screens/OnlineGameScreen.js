import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { typography } from '../constants/theme';
import { CARD_IMAGES, getCardArtwork } from '../constants/cardAssets';
import MobileChatDrawer from '../components/online/MobileChatDrawer';
import MobileNightActionSheet from '../components/online/MobileNightActionSheet';
import MobileDeathAnnouncementModal from '../components/online/MobileDeathAnnouncementModal';
import MobileDayVotingPanel from '../components/online/MobileDayVotingPanel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 80, 280);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.48);

/**
 * Màn hình Trận Đấu Online (OnlineGameScreen)
 * PHONG CÁCH: Dark Gothic & Huyết Nguyệt (Blood Moon Werewolf Online RPG)
 * - Tích hợp Lật Thẻ Bài Tarot 3D bí mật
 * - HUD Trạng thái Pha Trận Đấu Thời Gian Thực
 * - Nút Chat 4 Kênh trôi nổi mở MobileChatDrawer
 * - Tự động hiển thị Night Action Sheet, Cáo Phó Bình Minh, Day Voting Panel
 * - Bảng Vinh Danh Kết Thúc Ván & Lật Toàn Bộ Thẻ Bài
 */
export default function OnlineGameScreen({
  roomCode,
  user,
  role,
  players = [],
  isAlive = true,
  currentPhase = 'NIGHT_START',
  isHost = false,
  activeTimer = null,
  onLeaveRoom,
  onPlayAgain,
  gameOverData = null,
  deathAnnouncementData = null,
  onCloseDeathAnnouncement,
  isNight = true,
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Lật thẻ bài 3D
  const handleToggleFlip = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    if (isFlipped) {
      Animated.spring(animatedValue, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start(() => setIsFlipped(false));
    } else {
      Animated.spring(animatedValue, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start(() => setIsFlipped(true));
    }
  };

  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
  const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

  const artwork = getCardArtwork(role?.name);
  const cardBack = CARD_IMAGES.BACK_GOTHIC || CARD_IMAGES.back;

  const currentUser = players.find(
    (p) => p.characterName?.toLowerCase() === user?.characterName?.toLowerCase()
  );
  const seatNum = currentUser?.seatNumber || '?';

  return (
    <LinearGradient
      colors={['#040306', '#0B0612', '#14081E']}
      style={styles.container}
    >
      {/* Top HUD Trận Đấu */}
      <View style={styles.topHud}>
        <View style={styles.hudLeft}>
          <View style={styles.seatBadge}>
            <Text style={styles.seatBadgeText}>Ghế #{seatNum}</Text>
          </View>
          <View style={[styles.statusBadge, isAlive ? styles.statusAlive : styles.statusDead]}>
            <Text style={[styles.statusBadgeText, isAlive ? styles.textAlive : styles.textDead]}>
              {isAlive ? '💚 SỐNG' : '💀 TỬ NẠN'}
            </Text>
          </View>
        </View>

        <View style={styles.hudCenter}>
          <Text style={styles.phaseBadgeText} numberOfLines={1}>
            {currentPhase.replace('NIGHT_', '🌙 ĐÊM ').replace('DAY_', '☀️ NGÀY ')}
          </Text>
        </View>

        <View style={styles.hudRight}>
          <TouchableOpacity
            style={styles.btnLeave}
            onPress={onLeaveRoom}
            activeOpacity={0.7}
          >
            <Ionicons name="exit-outline" size={16} color="#FF6B7A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Khu vực Giữa: Lật Thẻ Bài 3D */}
      <ScrollView
        contentContainerStyle={styles.cardArea}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tapToFlipHint}>
          {isFlipped ? '👆 Chạm để ẩn lá bài bí mật' : '👆 Chạm để lật mở danh tính bài'}
        </Text>

        <TouchableOpacity
          activeOpacity={0.95}
          onPress={handleToggleFlip}
          style={[styles.cardContainer, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
        >
          {/* MẶT TRƯỚC (Lá bài úp bí mật) */}
          <Animated.View
            style={[
              styles.cardFlipBox,
              frontAnimatedStyle,
              { width: CARD_WIDTH, height: CARD_HEIGHT },
            ]}
          >
            <Image
              source={cardBack}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <View style={styles.cardCoverOverlay}>
              <MaterialCommunityIcons name="shield-lock-outline" size={32} color={colors.gold} />
              <Text style={styles.cardCoverText}>THẺ BÀI BẢO MẬT</Text>
              <Text style={styles.cardCoverSub}>Chạm để lật bài</Text>
            </View>
          </Animated.View>

          {/* MẶT SAU (Thân phận thật lật mở) */}
          <Animated.View
            style={[
              styles.cardFlipBox,
              styles.cardFlipBoxBack,
              backAnimatedStyle,
              { width: CARD_WIDTH, height: CARD_HEIGHT },
            ]}
          >
            <Image
              source={artwork}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(10, 5, 16, 0.95)']}
              style={styles.roleInfoOverlay}
            >
              <View style={styles.roleHeaderRow}>
                <Text style={[styles.roleNameText, { fontFamily: typography.fontTitleBold }]}>
                  {role?.name || 'Dân Làng'}
                </Text>
                <View
                  style={[
                    styles.teamPill,
                    role?.team === 'Sói' ? styles.teamPillWolf : styles.teamPillGood,
                  ]}
                >
                  <Text style={styles.teamPillText}>Phe {role?.team || 'Dân'}</Text>
                </View>
              </View>

              <Text style={styles.roleDescText} numberOfLines={3}>
                {role?.description || 'Hãy tham gia thảo luận cùng dân làng và tìm kiếm lũ Ma Sói ẩn mình.'}
              </Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>

        {/* Thông tin Cặp Đôi (Lovers) nếu có */}
        {role?.loverPartner && (
          <View style={styles.loverBadgeBox}>
            <MaterialCommunityIcons name="heart-flash" size={18} color="#F472B6" />
            <Text style={styles.loverBadgeText}>
              Bạn đang ghép đôi định mệnh cùng: <Text style={{ fontWeight: '800' }}>{role.loverPartner}</Text>
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Nút Chat Trôi Nổi (Floating Chat FAB) */}
      <TouchableOpacity
        style={styles.chatFabBtn}
        onPress={() => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch (e) {}
          setIsChatOpen(true);
        }}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="chat-processing" size={24} color="#120B1A" />
      </TouchableOpacity>

      {/* Khung Chat 4 Kênh */}
      <MobileChatDrawer
        visible={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        roomCode={roomCode}
        user={user}
        players={players}
        role={role}
        isAlive={isAlive}
        currentPhase={currentPhase}
        loverPartner={role?.loverPartner}
        isNight={isNight}
      />

      {/* Màn Đêm & Bảng Hành Động Tự Động Pha Đêm */}
      {currentPhase?.startsWith('NIGHT_') && (
        <MobileNightActionSheet
          roomCode={roomCode}
          user={user}
          role={role}
          players={players}
          isAlive={isAlive}
          currentPhase={currentPhase}
        />
      )}

      {/* Cáo Phó Bình Minh */}
      <MobileDeathAnnouncementModal
        visible={Boolean(deathAnnouncementData)}
        onClose={onCloseDeathAnnouncement}
        data={deathAnnouncementData}
      />

      {/* Bảng Biểu Quyết & Biện Hộ Ban Ngày */}
      <MobileDayVotingPanel
        roomCode={roomCode}
        user={user}
        role={role}
        players={players}
        isAlive={isAlive}
        currentPhase={currentPhase}
      />

      {/* Modal Vinh Danh Kết Thúc Ván (Game Over Modal) */}
      {gameOverData && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.gameOverOverlay}>
            <View style={styles.gameOverContainer}>
              <Text style={styles.gameOverIcon}>
                {gameOverData.winner === 'Ma Sói' ? '🐺' : '🏆'}
              </Text>
              <Text style={[styles.gameOverTitle, { fontFamily: typography.fontTitleBold }]}>
                {gameOverData.title || 'KẾT THÚC VÁN ĐẤU'}
              </Text>
              <Text style={styles.gameOverMessage}>{gameOverData.message}</Text>

              {/* Lật mở 100% Thân Phận Toàn Làng */}
              {gameOverData.allRoles && gameOverData.allRoles.length > 0 && (
                <ScrollView style={styles.rolesScrollView}>
                  <Text style={styles.allRolesHeader}>📜 THÂN PHẬN TOÀN BỘ NGƯỜI CHƠI:</Text>
                  {gameOverData.allRoles.map((p, idx) => (
                    <View key={idx} style={styles.allRoleRow}>
                      <View style={styles.allRoleLeft}>
                        <Text style={{ fontSize: 13 }}>{p.isAlive ? '💚' : '💀'}</Text>
                        <Text style={styles.allRoleCharName}>{p.characterName}</Text>
                        <Text style={styles.allRoleSeat}>#{p.seatNumber || '?'}</Text>
                      </View>
                      <View
                        style={[
                          styles.allRoleTeamBadge,
                          p.role?.team === 'Sói' ? styles.teamPillWolf : styles.teamPillGood,
                        ]}
                      >
                        <Text style={styles.allRoleRoleName}>{p.role?.name || 'Dân Làng'}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}

              <View style={styles.gameOverActions}>
                {isHost && (
                  <TouchableOpacity
                    style={styles.btnPlayAgain}
                    onPress={onPlayAgain}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnPlayAgainText}>🔄 Chơi Ván Mới (Giữ Phòng)</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.btnCloseGameOver}
                  onPress={onLeaveRoom}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnCloseGameOverText}>Rời Phòng Về Sảnh</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(10, 6, 16, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.25)',
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seatBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  seatBadgeText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusAlive: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
  },
  statusDead: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  textAlive: {
    color: '#4ADE80',
  },
  textDead: {
    color: '#FF6B7A',
  },
  hudCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  phaseBadgeText: {
    color: '#F5ECD7',
    fontSize: 12,
    fontWeight: '700',
  },
  hudRight: {
    alignItems: 'flex-end',
  },
  btnLeave: {
    padding: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderRadius: 6,
  },
  cardArea: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 40,
  },
  tapToFlipHint: {
    color: '#9E8FA8',
    fontSize: 12,
    marginBottom: 16,
  },
  cardContainer: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
  cardFlipBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    backfaceVisibility: 'hidden',
  },
  cardFlipBoxBack: {
    borderColor: colors.gold,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardCoverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 6, 16, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  cardCoverText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  cardCoverSub: {
    color: '#A79BB0',
    fontSize: 11,
  },
  roleInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roleNameText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  teamPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  teamPillWolf: {
    backgroundColor: 'rgba(220, 38, 38, 0.35)',
    borderWidth: 0.5,
    borderColor: '#EF4444',
  },
  teamPillGood: {
    backgroundColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 0.5,
    borderColor: '#38BDF8',
  },
  teamPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  roleDescText: {
    color: '#D4C8DE',
    fontSize: 11,
    lineHeight: 16,
  },
  loverBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 20,
  },
  loverBadgeText: {
    color: '#F472B6',
    fontSize: 12,
  },
  chatFabBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 800,
  },
  gameOverOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gameOverContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#150F1E',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.gold,
    padding: 20,
    alignItems: 'center',
  },
  gameOverIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  gameOverTitle: {
    color: colors.gold,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  gameOverMessage: {
    color: '#D4C8DE',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  rolesScrollView: {
    width: '100%',
    maxHeight: 180,
    marginBottom: 16,
  },
  allRolesHeader: {
    color: '#9E8FA8',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  allRoleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(21, 15, 30, 0.8)',
    marginBottom: 4,
  },
  allRoleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  allRoleCharName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  allRoleSeat: {
    color: '#8A7B94',
    fontSize: 11,
  },
  allRoleTeamBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  allRoleRoleName: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  gameOverActions: {
    width: '100%',
    gap: 8,
  },
  btnPlayAgain: {
    backgroundColor: colors.gold,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPlayAgainText: {
    color: '#120B1A',
    fontSize: 13,
    fontWeight: '800',
  },
  btnCloseGameOver: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnCloseGameOverText: {
    color: '#A79BB0',
    fontSize: 12,
  },
});
