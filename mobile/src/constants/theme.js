/**
 * DESIGN SYSTEM - "DARK GOTHIC & HUYẾT NGUYỆT" (Blood Moon Gothic Werewolf)
 * 
 * Phong cách: Bàn cờ Ma Sói Gothic ma mị, lâu đài đêm trăng máu, viền kim loại cổ điển,
 * lá bài tarot huyền bí có nanh vuốt và ánh sáng ma thuật.
 */

export const themeNight = {
  background: '#07050A',       // Obsidian đêm trăng u tối
  backgroundDeep: '#040306',   // Đen vực thẳm
  surface: '#150F1E',          // Bề mặt phiến đá gothic
  surfaceTranslucent: 'rgba(21, 15, 30, 0.88)', // Kính mờ đá đen
  surfaceElevated: '#241933',  // Khối nổi
  border: '#3D2B52',           // Viền gothic cổ
  borderDouble: '#583D75',     // Viền đôi ma thuật
  borderGold: '#D4AF37',       // Viền mạ vàng cổ (Antique Gold)
  borderBlood: '#C41E3A',      // Viền huyết nguyệt (Blood Ruby)
  text: '#F5ECD7',             // Chữ giấy da cổ sáng rõ
  textMuted: '#9E8FA8',        // Chữ phụ mờ sương
  textGold: '#E6C665',         // Chữ hoàng kim
  inputBg: '#0F0A17',          // Nền ô nhập liệu đá đen
  inputBorder: '#3D2B52',      // Viền ô nhập
};

export const themeDay = {
  background: '#EAE1CC',       // Giấy da sáng bình minh
  backgroundDeep: '#DFD4BC',
  surface: '#F6EEDC',          // Bề mặt thẻ bài sáng
  surfaceTranslucent: 'rgba(246, 238, 220, 0.92)',
  surfaceElevated: '#EDE3CB',
  border: '#D2C3A7',
  borderDouble: '#BAA787',
  borderGold: '#B8860B',
  borderBlood: '#A91B2C',
  text: '#241629',             // Chữ mực cổ tím đen
  textMuted: '#7A6B5F',
  textGold: '#8B6508',
  inputBg: '#FAF5E8',
  inputBorder: '#D2C3A7',
};

/**
 * Màu phe phái & Thần khí đặc trưng
 */
export const factionColors = {
  wolf: '#D62828',             // Sói đỏ máu (Crimson Blood)
  wolfDark: '#7A0000',
  wolfGlow: 'rgba(214, 40, 40, 0.45)',
  villager: '#E5B842',         // Dân vàng trăng (Luminous Gold)
  villagerDark: '#997316',
  villagerGlow: 'rgba(229, 184, 66, 0.35)',
  seer: '#38BDF8',             // Tiên tri tinh tú xanh ngọc (Cosmic Starlight)
  seerGlow: 'rgba(56, 189, 248, 0.4)',
  witch: '#A855F7',            // Phù thủy độc dược tím (Amethyst Magic)
  witchGlow: 'rgba(168, 85, 247, 0.4)',
  guard: '#34D399',            // Hiệp sĩ khiên thánh ngọc bích (Sacred Shield)
  guardGlow: 'rgba(52, 211, 153, 0.4)',
  hunter: '#FB923C',           // Thợ săn lửa cung tên hổ phách (Amber Vigilante)
  hunterGlow: 'rgba(251, 146, 60, 0.4)',
  neutral: '#C084FC',          // Phe thứ 3 / Kẻ phản bội
};

/**
 * Nút bấm tiêu chuẩn Game Gothic RPG
 */
export const buttonTokens = {
  primary: {
    bg: '#D4AF37',             // Vàng kim cổ điển
    text: '#120B1A',           // Chữ đen tương phản cao
    border: '#F3E5AB',
  },
  blood: {
    bg: '#9E1B26',             // Đỏ huyết nguyệt
    text: '#FFFFFF',
    border: '#E63946',
  },
  secondary: {
    nightBg: '#1C132B',
    dayBg: '#E8DEC7',
    nightText: '#F5ECD7',
    dayText: '#241629',
    nightBorder: '#45315E',
    dayBorder: '#C9BA9F',
  },
  danger: {
    bg: '#800C16',
    text: '#FFFFFF',
    border: '#C41E3A',
  },
};

/**
 * Typography - Phông chữ phong cách Gothic Boardgame
 */
export const typography = {
  fontTitleBlack: 'PlayfairDisplay_900Black',
  fontTitleBold: 'PlayfairDisplay_800ExtraBold',
  fontBody: 'BeVietnamPro_400Regular',
  fontBodyMedium: 'BeVietnamPro_500Medium',
  fontBodySemiBold: 'BeVietnamPro_600SemiBold',
  fontBodyBold: 'BeVietnamPro_700Bold',

  sizes: {
    caption: 13,
    sm: 14,
    body: 15,
    bodyLarge: 17,
    titleSm: 20,
    titleMd: 24,
    titleLg: 28,
    titleHero: 36,
  },

  letterSpacing: {
    normal: 0,
    wide: 1.2,
    wider: 2.2,
    widest: 4,
  },
};

/**
 * Hình khối & Thước đo (Tarot & Rune shapes)
 */
export const shapes = {
  radius: 8,                   // Bo góc vừa phải kiểu thẻ bài cao cấp
  radiusPill: 999,             // Dạng con nhộng
  radiusCard: 14,              // Thẻ bài Tarot bo 14pt tinh xảo
  borderWidth: 1.5,
  borderDoubleOffset: 3,
  minTouchTarget: 46,          // 46pt chuẩn chạm game di động
  cardAspect: 2 / 3,           // Tỉ lệ lá bài Tarot chuẩn 2:3
};

/**
 * Bóng đổ & Ánh sáng phát quang (Glow Shadows)
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 3,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.65,
    shadowRadius: 16,
    elevation: 8,
  },
  glowBlood: {
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 14,
    elevation: 10,
  },
  glowGold: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 12,
    elevation: 8,
  },
};

/**
 * Lấy theme hoàn chỉnh
 */
export const getTheme = (isNight = true) => {
  const colors = isNight ? themeNight : themeDay;
  const isDark = isNight;

  return {
    isNight,
    colors,
    factions: factionColors,
    button: {
      primary: buttonTokens.primary,
      blood: buttonTokens.blood,
      secondary: {
        bg: isDark ? buttonTokens.secondary.nightBg : buttonTokens.secondary.dayBg,
        text: isDark ? buttonTokens.secondary.nightText : buttonTokens.secondary.dayText,
        border: isDark ? buttonTokens.secondary.nightBorder : buttonTokens.secondary.dayBorder,
      },
      danger: buttonTokens.danger,
    },
    typography,
    shapes,
    shadows,
  };
};
