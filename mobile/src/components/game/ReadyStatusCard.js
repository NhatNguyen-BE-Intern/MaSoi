import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import CustomButton from '../common/CustomButton';

/**
 * Thẻ hiển thị số lượng người chơi đã sẵn sàng - Dark Gothic Style
 */
export default function ReadyStatusCard({
  count = 0,
  total = 8,
  onToggleReady,
  isNight = true,
}) {
  const theme = isNight ? colors.night : colors.day;
  const isFull = count >= total;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBg,
          borderColor: isFull ? colors.success : theme.cardBorderGold,
        },
      ]}
    >
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        Trạng thái người chơi sẵn sàng:
      </Text>

      <Text
        style={[
          styles.counter,
          { color: isFull ? colors.success : colors.gold },
        ]}
      >
        {count} / {total} Người
      </Text>

      <CustomButton
        title={!isFull ? 'SẴN SÀNG' : 'HỦY SẴN SÀNG'}
        variant={!isFull ? 'blood' : 'success'}
        onPress={onToggleReady}
        icon={
          <Ionicons
            name={!isFull ? 'shield-checkmark-outline' : 'refresh'}
            size={18}
            color="#fff"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '600',
  },
  counter: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 16,
    letterSpacing: 1,
  },
});
