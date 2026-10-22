import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { buttonTokens, typography, shapes, shadows } from '../../constants/theme';

/**
 * Component CustomButton - Phong cách Dark Gothic Boardgame
 * Tích hợp Haptic Feedback & Hiệu ứng phát sáng an toàn
 */
export default function CustomButton({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'gold' | 'blood' | 'danger' | 'success' | 'secondary' | 'dark'
  loading = false,
  disabled = false,
  icon = null,
  style,
  textStyle,
  isNight = true,
}) {
  const isDanger = variant === 'danger';
  const isBlood = variant === 'blood';
  const isSuccess = variant === 'success';
  const isSecondary = variant === 'secondary' || variant === 'dark';

  // Định nghĩa màu an toàn kèm fallback chống undefined
  const primaryColors = {
    bg: buttonTokens?.primary?.bg || '#D4AF37',
    text: buttonTokens?.primary?.text || '#120B1A',
    border: buttonTokens?.primary?.border || '#F3E5AB',
  };

  const bloodColors = {
    bg: buttonTokens?.blood?.bg || '#9E1B26',
    text: buttonTokens?.blood?.text || '#FFFFFF',
    border: buttonTokens?.blood?.border || '#E63946',
  };

  const dangerColors = {
    bg: buttonTokens?.danger?.bg || '#800C16',
    text: buttonTokens?.danger?.text || '#FFFFFF',
    border: buttonTokens?.danger?.border || '#C41E3A',
  };

  const successColors = {
    bg: buttonTokens?.success?.bg || '#1B6A3B',
    text: buttonTokens?.success?.text || '#FFFFFF',
    border: buttonTokens?.success?.border || '#22C55E',
  };

  let activeConfig = primaryColors;
  let glowStyle = shadows?.glowGold || shadows?.subtle;

  if (isBlood) {
    activeConfig = bloodColors;
    glowStyle = shadows?.glowBlood || shadows?.subtle;
  } else if (isDanger) {
    activeConfig = dangerColors;
    glowStyle = shadows?.glowBlood || shadows?.subtle;
  } else if (isSuccess) {
    activeConfig = successColors;
    glowStyle = shadows?.subtle;
  } else if (isSecondary) {
    activeConfig = {
      bg: isNight
        ? buttonTokens?.secondary?.nightBg || '#1C132B'
        : buttonTokens?.secondary?.dayBg || '#E8DEC7',
      text: isNight
        ? buttonTokens?.secondary?.nightText || '#F5ECD7'
        : buttonTokens?.secondary?.dayText || '#241629',
      border: isNight
        ? buttonTokens?.secondary?.nightBorder || '#45315E'
        : buttonTokens?.secondary?.dayBorder || '#C9BA9F',
    };
    glowStyle = shadows?.subtle;
  }

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.touchable,
        glowStyle,
        {
          backgroundColor:
            disabled || loading ? (isNight ? '#251E30' : '#DED4C0') : activeConfig.bg,
          borderColor: disabled || loading ? 'transparent' : activeConfig.border,
          opacity: disabled || loading ? 0.6 : 1,
        },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color={activeConfig.text} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
          <Text style={[styles.text, { color: activeConfig.text }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
    minHeight: shapes?.minTouchTarget || 46,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: shapes?.radius || 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: typography?.sizes?.body || 15,
    fontFamily: typography?.fontBodyBold || 'System',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
