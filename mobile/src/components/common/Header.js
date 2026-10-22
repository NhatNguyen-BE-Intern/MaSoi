import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';

/**
 * Component Header hiển thị biểu tượng và tiêu đề game
 * @param {boolean} isNight - Trạng thái ban đêm (true) hoặc ban ngày (false)
 */
export default function Header({ isNight }) {
  const theme = isNight ? colors.night : colors.day;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{isNight ? '🐺' : '☀️'}</Text>
      <Text style={[styles.title, { color: theme.accent }]}>
        {isNight ? 'ĐÊM XUỐNG' : 'BÌNH MINH LÊN'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {isNight
          ? 'Cả làng đi ngủ, Ma Sói bắt đầu thức giấc...'
          : 'Mọi người thức dậy và thảo luận tìm ra Sói!'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 10,
  },
  icon: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
