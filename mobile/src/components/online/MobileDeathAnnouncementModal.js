import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/theme';

/**
 * Modal Cáo Phó Bình Minh (Day Announcement) trên Mobile
 * - Chuông sáng reo, công bố ai tử nạn đêm qua
 * - Lật mở bài hoặc giấu bài theo cài đặt phòng
 */
export default function MobileDeathAnnouncementModal({
  visible,
  onClose,
  data,
}) {
  if (!visible || !data) return null;

  const deaths = data.deaths || [];
  const isOpenRole = data.roleReveal === 'open';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={['#170D26', '#0E0817', '#06030A']}
            style={styles.gradientBox}
          >
            {/* Header Cáo Phó */}
            <View style={styles.header}>
              <MaterialCommunityIcons name="weather-sunset-up" size={36} color="#FBBF24" />
              <Text style={[styles.title, { fontFamily: typography.fontTitleBold }]}>
                ☀️ CÁO PHÓ BÌNH MINH (NGÀY {data.dayNumber || 1})
              </Text>
              <Text style={styles.subtitle}>
                {deaths.length > 0
                  ? `Ngôi làng vừa trải qua một đêm đẫm máu...`
                  : `Đêm qua là một đêm bình yên kỳ lạ, không ai tử nạn!`}
              </Text>
            </View>

            {/* Danh sách tử nạn */}
            {deaths.length > 0 ? (
              <ScrollView style={styles.deathsList}>
                {deaths.map((victim, idx) => (
                  <View key={idx} style={styles.victimCard}>
                    <View style={styles.victimLeft}>
                      <MaterialCommunityIcons name="skull-crossbones" size={24} color="#FF6B7A" />
                      <View>
                        <Text style={styles.victimName}>{victim.characterName}</Text>
                        <Text style={styles.victimCause}>
                          {victim.cause || 'Tử nạn trong đêm'}
                        </Text>
                      </View>
                    </View>

                    {isOpenRole && victim.role && (
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>
                          {victim.role.name || 'Dân Làng'}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.peacefulBox}>
                <Ionicons name="shield-checkmark" size={32} color="#34D399" />
                <Text style={styles.peacefulText}>Tất cả người dân làng đều an toàn!</Text>
              </View>
            )}

            {/* Nút Đã hiểu */}
            <TouchableOpacity style={styles.dismissBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.dismissBtnText}>Đã Hiểu ☀️</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.45)',
  },
  gradientBox: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#FBBF24',
    fontSize: 15,
    letterSpacing: 0.5,
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#A79BB0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  deathsList: {
    width: '100%',
    maxHeight: 220,
    marginBottom: 16,
  },
  victimCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 20, 44, 0.8)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    marginBottom: 8,
  },
  victimLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  victimName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  victimCause: {
    color: '#FF8A96',
    fontSize: 11,
  },
  roleBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: colors.gold,
  },
  roleBadgeText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  peacefulBox: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  peacefulText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
  },
  dismissBtn: {
    width: '100%',
    backgroundColor: colors.gold,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  dismissBtnText: {
    color: '#120B1A',
    fontSize: 13,
    fontWeight: '800',
  },
});
