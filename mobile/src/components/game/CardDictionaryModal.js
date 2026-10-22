import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { getTheme, typography, shapes, shadows } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/config';
import { CARD_IMAGES, getCardArtwork } from '../../constants/cardAssets';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Modal Từ Điển Thần Bài Ma Sói (CardDictionaryModal)
 * PHONG CÁCH: Bảo Tàng Thần Bài Tarot - Dark Gothic
 * - Hiển thị ảnh Tarot nguyên bản cho từng vai trò
 * - Tab lọc phe phái có hiệu ứng phát sáng
 * - Chi tiết kỹ năng và luật chơi sắc nét
 */
export default function CardDictionaryModal({ visible, onClose, isNight = true }) {
  const [cards, setCards] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'wolf' | 'villager' | 'neutral'
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const theme = getTheme(isNight);

  useEffect(() => {
    if (visible) {
      loadCards();
    } else {
      setSelectedCard(null);
    }
  }, [visible]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/cards`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCards(data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách lá bài:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCardThemeColor = (card) => {
    const isWolf = card.team === 'Sói' || card.name.includes('Sói');
    const isSeer = card.name.includes('Tiên Tri');
    const isGuard = card.name.includes('Bảo Vệ');
    const isWitch = card.name.includes('Phù Thủy');
    const isHunter = card.name.includes('Thợ Săn');

    if (isWolf) return colors.factions.wolf;
    if (isSeer) return colors.factions.seer;
    if (isGuard) return colors.factions.guard;
    if (isWitch) return colors.factions.witch;
    if (isHunter) return colors.factions.hunter;
    return colors.factions.villager;
  };

  const filteredCards = cards.filter((card) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'wolf') return card.team === 'Sói' || card.name.includes('Sói');
    if (activeTab === 'villager') return card.team === 'Dân';
    if (activeTab === 'neutral') return card.team !== 'Sói' && card.team !== 'Dân';
    return true;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 1. Header Modal */}
          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <View style={styles.headerIconFrame}>
                <MaterialCommunityIcons name="book-open-page-variant" size={20} color={colors.gold} />
              </View>
              <View>
                <Text style={styles.headerTitle}>SÁCH VAI TRÒ & LUẬT CHƠI</Text>
                <Text style={styles.headerSub}>Tra cứu các vai trò và kỹ năng chi tiết trong game</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (e) {}
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* 2. Tabs Lọc Phe Phái */}
          <View style={styles.tabBar}>
            {[
              { id: 'all', label: 'Tất Cả' },
              { id: 'wolf', label: 'Phe Sói 🐺' },
              { id: 'villager', label: 'Phe Dân 🌾' },
              { id: 'neutral', label: 'Phe Khác 🔮' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabItem,
                    isActive && styles.tabItemActive,
                  ]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch (e) {}
                    setActiveTab(tab.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabItemText,
                      isActive && styles.tabItemTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 3. Danh Sách Thần Bài Tarot */}
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.gold} />
              <Text style={styles.loadingText}>Đang tải danh sách vai trò...</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            >
              {filteredCards.length > 0 ? (
                filteredCards.map((card, idx) => {
                  const cardColor = getCardThemeColor(card);
                  const cardArt = getCardArtwork(card.name, card.team);
                  const isExpanded = selectedCard?._id === card._id;

                  return (
                    <TouchableOpacity
                      key={card._id || idx}
                      style={[
                        styles.cardRow,
                        { borderColor: cardColor },
                        isExpanded && styles.cardRowExpanded,
                      ]}
                      onPress={() => {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        } catch (e) {}
                        setSelectedCard(isExpanded ? null : card);
                      }}
                      activeOpacity={0.85}
                    >
                      {/* Tranh Tarot thu nhỏ */}
                      <View style={styles.tarotThumbWrap}>
                        <Image
                          source={cardArt}
                          style={styles.tarotThumb}
                          resizeMode="cover"
                        />
                      </View>

                      {/* Chi tiết nội dung */}
                      <View style={styles.cardDetails}>
                        <View style={styles.cardHeaderRow}>
                          <Text style={[styles.cardTitle, { color: cardColor }]}>
                            {card.name.toUpperCase()}
                          </Text>
                          <View
                            style={[
                              styles.teamBadge,
                              { backgroundColor: `${cardColor}20`, borderColor: cardColor },
                            ]}
                          >
                            <Text style={[styles.teamBadgeText, { color: cardColor }]}>
                              Phe {card.team}
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={styles.cardDesc}
                          numberOfLines={isExpanded ? undefined : 2}
                        >
                          {card.description}
                        </Text>

                        <Text style={styles.tapToViewHint}>
                          {isExpanded ? '▲ Thu gọn' : '▼ Chạm để xem chi tiết'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.centerBox}>
                  <Text style={styles.emptyText}>Không tìm thấy lá bài nào trong danh mục này.</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '88%',
    backgroundColor: 'rgba(18, 12, 26, 0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.gold,
    padding: 18,
    paddingBottom: 28,
    gap: 12,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3D2B52',
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconFrame: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.goldLight,
    fontFamily: typography.fontTitleBlack,
    fontSize: 14,
    letterSpacing: 1,
  },
  headerSub: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: typography.fontBody,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(128, 12, 22, 0.5)',
    borderWidth: 1,
    borderColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(8, 4, 12, 0.85)',
    borderRadius: shapes.radius,
    padding: 3,
    borderWidth: 1,
    borderColor: '#3D2B52',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shapes.radius - 2,
  },
  tabItemActive: {
    backgroundColor: colors.gold,
  },
  tabItemText: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: typography.fontBodyMedium,
  },
  tabItemTextActive: {
    color: '#120B1A',
    fontFamily: typography.fontBodyBold,
  },
  listContainer: {
    paddingVertical: 8,
    gap: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 15, 30, 0.92)',
    borderRadius: shapes.radius,
    borderWidth: 1.5,
    padding: 10,
    gap: 12,
  },
  cardRowExpanded: {
    backgroundColor: 'rgba(32, 22, 45, 0.98)',
    ...shadows.glowGold,
  },
  tarotThumbWrap: {
    width: 44,
    height: 66,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  tarotThumb: {
    width: '100%',
    height: '100%',
  },
  cardDetails: {
    flex: 1,
    gap: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: typography.fontTitleBlack,
    letterSpacing: 0.8,
  },
  teamBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: shapes.radiusPill,
    borderWidth: 1,
  },
  teamBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontBodyBold,
  },
  cardDesc: {
    color: '#cbd5e1',
    fontSize: 12,
    fontFamily: typography.fontBody,
    lineHeight: 16,
    marginTop: 2,
  },
  tapToViewHint: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: typography.fontBodyMedium,
    marginTop: 2,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: typography.fontBody,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: typography.fontBody,
    textAlign: 'center',
  },
});
