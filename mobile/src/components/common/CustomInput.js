import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native';
import { getTheme, typography, shapes, shadows } from '../../constants/theme';

/**
 * Component CustomInput phong cách Tarot Đêm Trăng
 * Hỗ trợ trạng thái Focus, icon tiền tố và thông báo phụ
 */
export default function CustomInput({
  label,
  value,
  onChangeText,
  placeholder,
  isNight = true,
  secureTextEntry = false,
  helperText,
  containerStyle,
  icon = null,
  autoCapitalize = 'none',
  ...rest
}) {
  const [isFocused, setIsFocused] = useState(false);
  const theme = getTheme(isNight);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          {icon ? <View style={styles.labelIcon}>{icon}</View> : null}
          <Text
            style={[
              styles.label,
              {
                color: isFocused ? theme.colors.text : theme.colors.textMuted,
                fontFamily: typography.fontBodyMedium,
              },
            ]}
          >
            {label}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.inputBg,
            borderColor: isFocused ? theme.colors.borderGold : theme.colors.inputBorder,
            ...(isFocused ? shadows.glowGold : shadows.subtle),
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontFamily: typography.fontBody,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
      </View>

      {helperText ? (
        <Text
          style={[
            styles.helperText,
            {
              color: theme.colors.textMuted,
              fontFamily: typography.fontBody,
            },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 2,
  },
  labelIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: typography.sizes.caption, // Tối thiểu 13pt
    letterSpacing: 0.5,
  },
  inputContainer: {
    width: '100%',
    minHeight: shapes.minTouchTarget,    // Tối thiểu 44pt
    borderRadius: shapes.radius,         // Bo nhỏ 4pt kiểu thẻ bài
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
    ...shadows.subtle,
  },
  input: {
    height: 44,
    fontSize: typography.sizes.body,     // Chuẩn 15pt
  },
  helperText: {
    fontSize: typography.sizes.caption,
    paddingLeft: 2,
    fontStyle: 'italic',
  },
});
