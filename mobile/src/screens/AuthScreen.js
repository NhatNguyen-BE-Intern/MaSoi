import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { getTheme, typography, shapes, shadows } from '../constants/theme';
import { BACKGROUND_IMAGES } from '../constants/cardAssets';
import { API_BASE_URL } from '../constants/config';
import CustomInput from '../components/common/CustomInput';
import CustomButton from '../components/common/CustomButton';

/**
 * Màn hình Đăng nhập / Đăng ký / Khắc tên nhân vật (AuthScreen)
 * PHONG CÁCH: Giao Ước Máu - Cổng Làng Đêm Trăng (Blood Moon Gate)
 */
export default function AuthScreen({ onAuthSuccess, isNight = true }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'character'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const theme = getTheme(isNight);

  // Hiệu ứng nhịp thở phát sáng viền sói
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

  // 1. Xử lý Đăng Nhập
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
      return setErrorMsg('Vui lòng điền đầy đủ tài khoản và mật khẩu!');
    }
    setErrorMsg('');
    setLoading(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (e) {}
        setErrorMsg(data.message || 'Đăng nhập thất bại!');
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
        if (!data.user.characterName) {
          setCurrentUser(data.user);
          setTab('character');
        } else {
          onAuthSuccess(data.user);
        }
      }
    } catch (err) {
      setErrorMsg(`Không thể kết nối máy chủ (${API_BASE_URL})! Hãy kiểm tra backend.`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Xử lý Đăng Ký
  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
      return setErrorMsg('Vui lòng nhập tài khoản và mật khẩu mới!');
    }
    if (username.trim().length < 3) {
      return setErrorMsg('Tên tài khoản phải có ít nhất 3 ký tự!');
    }
    if (password.length < 6) {
      return setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự!');
    }

    setErrorMsg('');
    setLoading(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (e) {}
        setErrorMsg(data.message || 'Đăng ký thất bại!');
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
        Alert.alert('🎉 Thành công', 'Đăng ký tài khoản thành công! Hãy đăng nhập để bắt đầu chơi.');
        setTab('login');
      }
    } catch (err) {
      setErrorMsg(`Lỗi kết nối máy chủ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Xử lý Đặt tên nhân vật
  const handleCreateCharacter = async () => {
    if (!characterName.trim()) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
      return setErrorMsg('Vui lòng nhập danh xưng hiển thị!');
    }
    setErrorMsg('');
    setLoading(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const res = await fetch(`${API_BASE_URL}/api/auth/create-character`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          characterName: characterName.trim(),
          token: currentUser?.token,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || 'Khắc tên nhân vật thất bại!');
      } else {
        const updatedUser = {
          ...currentUser,
          characterName: data.characterName,
          token: data.token || currentUser?.token,
        };
        onAuthSuccess(updatedUser);
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ!');
    } finally {
      setLoading(false);
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
          'rgba(5, 4, 7, 0.72)',
          'rgba(14, 9, 20, 0.88)',
          'rgba(5, 4, 7, 0.98)',
        ]}
        style={styles.vignetteOverlay}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. BIỂU TƯỢNG ĐẦU SÓI GOTHIC & HUYẾT NGUYỆT */}
          <View style={styles.header}>
            <View style={styles.wolfEmblemWrap}>
              <View style={styles.wolfEmblemCircle}>
                <MaterialCommunityIcons name="wolf" size={48} color="#ef4444" />
              </View>
              <Animated.View
                style={[
                  styles.wolfEmblemGlow,
                  { opacity: pulseAnim },
                ]}
              />
            </View>

            <Text style={styles.mainTitle}>GAME MA SÓI</Text>
            <View style={styles.titleDivider} />
            <Text style={styles.subtitle}>
              {tab === 'character'
                ? 'Nhập tên hiển thị của bạn trước khi vào phòng chơi'
                : 'Tham gia ván đấu thời gian thực cùng bạn bè'}
            </Text>
          </View>

          {/* 2. THÔNG BÁO LỖI (NẾU CÓ) */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color="#f87171" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* 3. KHỐI FORM GIAO ƯỚC MÁU (ĐĂNG NHẬP / ĐĂNG KÝ) */}
          {tab !== 'character' ? (
            <View style={styles.formTablet}>
              {/* Tab chuyển đổi Đăng Nhập / Đăng Ký */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tabButton, tab === 'login' && styles.tabButtonActive]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch (e) {}
                    setTab('login');
                    setErrorMsg('');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="log-in-outline"
                    size={16}
                    color={tab === 'login' ? '#ffffff' : '#94a3b8'}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      tab === 'login' && styles.tabTextActive,
                    ]}
                  >
                    Đăng Nhập
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabButton, tab === 'register' && styles.tabButtonActive]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch (e) {}
                    setTab('register');
                    setErrorMsg('');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={16}
                    color={tab === 'register' ? '#ffffff' : '#94a3b8'}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      tab === 'register' && styles.tabTextActive,
                    ]}
                  >
                    Đăng Ký
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Ô nhập Tài khoản */}
              <CustomInput
                label="Tài khoản / Tên đăng nhập:"
                placeholder="Nhập tên tài khoản..."
                value={username}
                onChangeText={setUsername}
                isNight={isNight}
                icon={<Ionicons name="person-outline" size={15} color={colors.gold} />}
              />

              {/* Ô nhập Mật khẩu */}
              <CustomInput
                label="Mật khẩu:"
                placeholder="Tối thiểu 6 ký tự..."
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                isNight={isNight}
                icon={<Ionicons name="lock-closed-outline" size={15} color={colors.gold} />}
              />

              {/* Nút hành động Hero */}
              <CustomButton
                title={tab === 'login' ? 'ĐĂNG NHẬP' : 'TẠO TÀI KHOẢN'}
                variant={tab === 'login' ? 'blood' : 'gold'}
                loading={loading}
                onPress={tab === 'login' ? handleLogin : handleRegister}
                icon={
                  <MaterialCommunityIcons
                    name={tab === 'login' ? 'login' : 'account-plus'}
                    size={18}
                    color={tab === 'login' ? '#fff' : '#120B1A'}
                  />
                }
                style={styles.submitBtn}
              />
            </View>
          ) : (
            /* 4. FORM KHẮC TÊN NHÂN VẬT LẦN ĐẦU */
            <View style={styles.formTablet}>
              <View style={styles.charHeaderBox}>
                <Ionicons name="sparkles" size={26} color={colors.gold} />
                <Text style={styles.charSectionTitle}>Tạo Tên Nhân Vật</Text>
                <Text style={styles.charSectionDesc}>
                  Tên này sẽ hiển thị cho mọi người thấy trong phòng chơi và trên thẻ bài của bạn.
                </Text>
              </View>

              <CustomInput
                label="Tên hiển thị trong game:"
                placeholder="Ví dụ: Thợ Săn, Sói Trắng, Dân Làng..."
                value={characterName}
                onChangeText={setCharacterName}
                isNight={isNight}
                icon={<Ionicons name="person-circle-outline" size={16} color={colors.gold} />}
              />

              <CustomButton
                title="HOÀN TẤT & VÀO SẢNH"
                variant="gold"
                loading={loading}
                onPress={handleCreateCharacter}
                icon={<Ionicons name="checkmark-circle-outline" size={18} color="#120B1A" />}
                style={styles.submitBtn}
              />
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
  scrollContainer: {
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 4,
  },
  wolfEmblemWrap: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  wolfEmblemCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(128, 12, 22, 0.4)',
    borderWidth: 2,
    borderColor: '#c41e3a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    ...shadows.glowBlood,
  },
  wolfEmblemGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: '#ef4444',
    zIndex: 1,
  },
  mainTitle: {
    color: colors.goldLight,
    fontFamily: typography.fontTitleBlack,
    fontSize: 24,
    letterSpacing: 2,
    textAlign: 'center',
  },
  titleDivider: {
    width: 60,
    height: 2,
    backgroundColor: colors.gold,
    marginVertical: 8,
    borderRadius: 1,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 12.5,
    fontFamily: typography.fontBody,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  errorBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(128, 12, 22, 0.5)',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    padding: 12,
    borderRadius: shapes.radius,
    ...shadows.glowBlood,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12.5,
    fontFamily: typography.fontBodyMedium,
    flex: 1,
    lineHeight: 17,
  },
  formTablet: {
    width: '100%',
    backgroundColor: 'rgba(21, 15, 30, 0.94)',
    borderRadius: shapes.radiusCard,
    borderWidth: 1.5,
    borderColor: colors.gold,
    padding: 18,
    gap: 14,
    ...shadows.glowGold,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(8, 4, 12, 0.85)',
    borderRadius: shapes.radius,
    padding: 4,
    borderWidth: 1,
    borderColor: '#3D2B52',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shapes.radius - 2,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#991b1b',
    borderWidth: 1,
    borderColor: '#ef4444',
    ...shadows.glowBlood,
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 13,
    fontFamily: typography.fontBodyMedium,
  },
  tabTextActive: {
    color: '#ffffff',
    fontFamily: typography.fontBodyBold,
  },
  submitBtn: {
    marginTop: 6,
    minHeight: 52,
  },
  charHeaderBox: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  charSectionTitle: {
    color: colors.goldLight,
    fontFamily: typography.fontTitleBlack,
    fontSize: 18,
    letterSpacing: 1,
  },
  charSectionDesc: {
    color: '#cbd5e1',
    fontSize: 12,
    fontFamily: typography.fontBody,
    textAlign: 'center',
    lineHeight: 17,
  },
});
