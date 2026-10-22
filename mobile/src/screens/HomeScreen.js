import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { colors } from '../constants/colors';
import Header from '../components/common/Header';
import CustomInput from '../components/common/CustomInput';
import CustomButton from '../components/common/CustomButton';
import ReadyStatusCard from '../components/game/ReadyStatusCard';

/**
 * Màn hình chính (Home Screen)
 * Nơi lắp ghép các khối gạch UI thành một màn hình hoàn chỉnh
 */
export default function HomeScreen({ isNight, onToggleTheme }) {
  const [readyCount, setReadyCount] = useState(0);
  const [nickname, setNickname] = useState('');

  const handleToggleReady = () => {
    setReadyCount(prev => (prev < 8 ? prev + 1 : 0));
  };

  const currentBg = isNight ? colors.night.background : colors.day.background;

  return (
    <View style={[styles.container, { backgroundColor: currentBg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header game */}
        <Header isNight={isNight} />

        {/* 2. Ô nhập tên nhân vật */}
        <CustomInput
          label="👤 Nhập Nickname của bạn:"
          placeholder="Ví dụ: Thợ Săn Tí Nị, Sói Ca..."
          value={nickname}
          onChangeText={setNickname}
          isNight={isNight}
        />

        {/* 3. Thẻ trạng thái sẵn sàng trong phòng */}
        <ReadyStatusCard
          count={readyCount}
          total={8}
          onToggleReady={handleToggleReady}
          isNight={isNight}
        />

        {/* 4. Nút bấm đổi Ngày / Đêm */}
        <CustomButton
          title={isNight ? '☀️ Chuyển sang Ban Ngày' : '🌙 Chuyển sang Ban Đêm'}
          variant={isNight ? 'warning' : 'dark'}
          onPress={onToggleTheme}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    gap: 20,
    alignItems: 'center',
  },
});
