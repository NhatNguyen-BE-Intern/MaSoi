import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { getTheme, typography } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Màn hình Chọn Chế Độ Chơi (ModeSelectionScreen)
 * PHONG CÁCH: Dark Gothic & Huyết Nguyệt (Blood Moon Werewolf Portal)
 * - Tùy chọn 1: Chơi Ngoài Đời (Offline Companion)
 * - Tùy chọn 2: Chơi Online Tự Động (Online Remote)
 */
export default function ModeSelectionScreen({
  user,
  onSelectMode,
  isNight = true,
  onLogout,
}) {
  const theme = getTheme(isNight);

  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleChoose = (mode) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}
    if (onSelectMode) {
      onSelectMode(mode);
    }
  };

  return (
    <LinearGradient
      colors={['#040306', '#0B0712', '#150B1E']}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Thông Tin Hiệp Sĩ */}
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
            <View style={styles.crestCircle}>
              <MaterialCommunityIcons name="shield-crown-outline" size={32} color={colors.gold} />
            </View>
          </Animated.View>
          <Text style={[styles.title, { fontFamily: typography.fontTitleBlack }]}>
            CHỌN CHẾ ĐỘ CHƠI
          </Text>
          <Text style={[styles.subtitle, { fontFamily: typography.fontBodyMedium }]}>
            Chào mừng <Text style={{ color: colors.gold, fontWeight: '700' }}>{user?.characterName || user?.username || 'Hiệp Sĩ'}</Text> bước vào thế giới Ma Sói
          </Text>
        </View>

        {/* Danh sách 2 Thẻ bài Chế Độ */}
        <View style={styles.cardsWrapper}>
          {/* Card 1: Chơi Ngoài Đời (Offline Companion) */}
          <TouchableOpacity
            style={[styles.modeCard, styles.offlineCard]}
            onPress={() => handleChoose('offline')}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.15)', 'rgba(21, 15, 30, 0.95)', '#0E0916']}
              style={styles.cardGradient}
            >
              <View style={styles.cardBadgeContainer}>
                <View style={styles.badgeGold}>
                  <Text style={styles.badgeText}>BẢN TRUYỀN THỐNG</Text>
                </View>
              </View>

              <View style={styles.cardIconBoxGold}>
                <MaterialCommunityIcons name="cards-playing-outline" size={36} color={colors.gold} />
              </View>

              <Text style={[styles.cardTitle, { color: colors.gold, fontFamily: typography.fontTitleBold }]}>
                🃏 Chơi Ngoài Đời
              </Text>
              <Text style={styles.cardSubTitle}>Trợ Lý Quản Trò & Chia Bài 3D</Text>

              <Text style={styles.cardDesc}>
                Tụ tập cùng nhóm bạn ngoài đời thực. Điện thoại làm người chia bài bí mật, phát âm thanh sói hú, chuông bình minh và bảng điều khiển cho Quản trò.
              </Text>

              <View style={styles.tagRow}>
                <View style={styles.tagItemGold}>
                  <Text style={styles.tagTextGold}>Mã phòng 4 số</Text>
                </View>
                <View style={styles.tagItemGold}>
                  <Text style={styles.tagTextGold}>Lật bài Tarot 3D</Text>
                </View>
                <View style={styles.tagItemGold}>
                  <Text style={styles.tagTextGold}>Soundboard</Text>
                </View>
              </View>

              <View style={[styles.btnAction, styles.btnActionGold]}>
                <Text style={styles.btnActionTextDark}>Vào Chơi Ngoài Đời ➡️</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Card 2: Chơi Online (Online Remote) */}
          <TouchableOpacity
            style={[styles.modeCard, styles.onlineCard]}
            onPress={() => handleChoose('online')}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['rgba(196, 30, 58, 0.22)', 'rgba(26, 12, 22, 0.96)', '#0E0710']}
              style={styles.cardGradient}
            >
              <View style={styles.cardBadgeContainer}>
                <View style={styles.badgeBlood}>
                  <Text style={styles.badgeTextBlood}>🔥 GAME ENGINE 2.0</Text>
                </View>
              </View>

              <View style={styles.cardIconBoxBlood}>
                <MaterialCommunityIcons name="earth" size={36} color="#FF6B7A" />
              </View>

              <Text style={[styles.cardTitle, { color: '#FF7582', fontFamily: typography.fontTitleBold }]}>
                🌐 Chơi Online Tự Động
              </Text>
              <Text style={styles.cardSubTitle}>Ghép Trận Nhanh & Đấu Từ Xa</Text>

              <Text style={styles.cardDesc}>
                Chơi trực tuyến với người chơi khắp nơi. Máy chủ làm Quản trò tự động 100%, khung chat 4 kênh, tự động gọi đêm, biểu quyết 2 vòng và xử tử treo cổ.
              </Text>

              <View style={styles.tagRow}>
                <View style={styles.tagItemBlood}>
                  <Text style={styles.tagTextBlood}>⚡ Ghép nhanh</Text>
                </View>
                <View style={styles.tagItemBlood}>
                  <Text style={styles.tagTextBlood}>Bàn tròn #1..#N</Text>
                </View>
                <View style={styles.tagItemBlood}>
                  <Text style={styles.tagTextBlood}>Chat 4 kênh</Text>
                </View>
                <View style={styles.tagItemBlood}>
                  <Text style={styles.tagTextBlood}>Night & Day</Text>
                </View>
              </View>

              <View style={[styles.btnAction, styles.btnActionBlood]}>
                <Text style={styles.btnActionTextWhite}>Vào Sảnh Online ⚡</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Nút Đăng xuất */}
        {onLogout && (
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={16} color="#A79BB0" />
            <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  crestCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    color: '#F5ECD7',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#9E8FA8',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  cardsWrapper: {
    width: '100%',
    gap: 20,
  },
  modeCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  offlineCard: {
    borderColor: 'rgba(212, 175, 55, 0.4)',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  onlineCard: {
    borderColor: 'rgba(220, 38, 38, 0.5)',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  cardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  cardBadgeContainer: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badgeGold: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  badgeBlood: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.5)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 1,
  },
  badgeTextBlood: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF6B7A',
    letterSpacing: 1,
  },
  cardIconBoxGold: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  cardIconBoxBlood: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubTitle: {
    fontSize: 12,
    color: '#A79BB0',
    fontWeight: '600',
    marginBottom: 10,
  },
  cardDesc: {
    fontSize: 13,
    color: '#D4C8DE',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 16,
  },
  tagItemGold: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  tagTextGold: {
    fontSize: 11,
    color: colors.gold,
  },
  tagItemBlood: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(220, 38, 38, 0.35)',
  },
  tagTextBlood: {
    fontSize: 11,
    color: '#FF8A96',
  },
  btnAction: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnActionGold: {
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: '#F3E5AB',
  },
  btnActionBlood: {
    backgroundColor: '#C41E3A',
    borderWidth: 1,
    borderColor: '#FF4D6D',
  },
  btnActionTextDark: {
    fontSize: 14,
    fontWeight: '800',
    color: '#120B1A',
    letterSpacing: 0.5,
  },
  btnActionTextWhite: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  logoutBtn: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  logoutText: {
    fontSize: 13,
    color: '#A79BB0',
  },
});
