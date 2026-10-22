/**
 * BẢNG MÀU CHUẨN "DARK GOTHIC & HUYẾT NGUYỆT" (Blood Moon Gothic Werewolf)
 */

import {
  themeNight,
  themeDay,
  factionColors,
  buttonTokens,
  typography,
  shapes,
  shadows,
  getTheme,
} from './theme';

export {
  themeNight,
  themeDay,
  factionColors,
  buttonTokens,
  typography,
  shapes,
  shadows,
  getTheme,
};

export const colors = {
  // 1. Chế độ Ban Đêm (Huyết Nguyệt & Sương Mù Gothic)
  night: {
    background: themeNight.background,           // #07050A
    backgroundSecondary: themeNight.surface,      // #150F1E
    cardBg: themeNight.surface,                  // #150F1E
    cardBgGlass: themeNight.surfaceTranslucent,  // 'rgba(21, 15, 30, 0.88)'
    cardBorder: themeNight.border,               // #3D2B52
    cardBorderGlow: themeNight.borderDouble,     // #583D75
    cardBorderGold: themeNight.borderGold,       // #D4AF37
    cardBorderBlood: themeNight.borderBlood,     // #C41E3A
    inputBg: themeNight.inputBg,                 // #0F0A17
    inputBorder: themeNight.inputBorder,         // #3D2B52
    inputBorderFocus: themeNight.borderGold,     // #D4AF37
    textPrimary: themeNight.text,                // #F5ECD7
    textSecondary: themeNight.textMuted,         // #9E8FA8
    textMuted: '#70617B',
    textGold: themeNight.textGold,
    accent: themeNight.borderGold,
    accentGlow: '#E5B842',
  },

  // 2. Chế độ Ban Ngày (Bình Minh Giấy Da Cổ)
  day: {
    background: themeDay.background,             // #EAE1CC
    backgroundSecondary: themeDay.surface,       // #F6EEDC
    cardBg: themeDay.surface,                   // #F6EEDC
    cardBgGlass: themeDay.surfaceTranslucent,
    cardBorder: themeDay.border,                // #D2C3A7
    cardBorderGlow: themeDay.borderDouble,      // #BAA787
    cardBorderGold: themeDay.borderGold,
    cardBorderBlood: themeDay.borderBlood,
    inputBg: themeDay.inputBg,                  // #FAF5E8
    inputBorder: themeDay.inputBorder,          // #D2C3A7
    inputBorderFocus: themeDay.text,            // #241629
    textPrimary: themeDay.text,                 // #241629
    textSecondary: themeDay.textMuted,          // #7A6B5F
    textMuted: '#9B8B7D',
    textGold: themeDay.textGold,
    accent: themeDay.borderGold,
    accentGlow: '#B8860B',
  },

  // 3. Màu sắc Phe Phái Độc Quyền
  factions: {
    wolf: factionColors.wolf,                   // #D62828 (Sói Đỏ Máu)
    wolfDark: factionColors.wolfDark,           // #7A0000
    wolfGlow: factionColors.wolfGlow,
    villager: factionColors.villager,           // #E5B842 (Dân Làng Vàng Trăng)
    villagerDark: factionColors.villagerDark,
    villagerGlow: factionColors.villagerGlow,
    seer: factionColors.seer,                   // #38BDF8 (Tiên Tri Lam Ngọc)
    seerDark: '#0369A1',
    seerGlow: factionColors.seerGlow,
    guard: factionColors.guard,                 // #34D399 (Bảo Vệ Lục Bảo)
    guardDark: '#059669',
    guardGlow: factionColors.guardGlow,
    witch: factionColors.witch,                 // #A855F7 (Phù Thủy Độc Dược Tím)
    witchDark: '#7E22CE',
    witchGlow: factionColors.witchGlow,
    hunter: factionColors.hunter,               // #FB923C (Thợ Săn Hổ Phách)
    hunterDark: '#C2410C',
    hunterGlow: factionColors.hunterGlow,
    neutral: factionColors.neutral,             // #C084FC (Kẻ Phản Bội)
  },

  // 4. Nút bấm tương tác
  primary: buttonTokens.primary.bg,             // #D4AF37
  primaryText: buttonTokens.primary.text,       // #120B1A
  primaryBorder: buttonTokens.primary.border,

  danger: buttonTokens.danger.bg,               // #800C16
  dangerDark: '#4D0008',
  dangerGlow: '#C41E3A',

  success: '#1B6A3B',
  successDark: '#0F4424',
  successGlow: '#22C55E',

  warning: factionColors.villager,
  warningDark: '#997316',
  warningGlow: factionColors.villagerGlow,

  gold: '#D4AF37',
  goldLight: '#F9E79F',
  bloodRed: '#C41E3A',
  bloodDark: '#660708',

  // Gradient
  gradients: {
    bloodMoon: ['#800C16', '#3D0007', '#120003'],
    mysticNight: ['#1C142A', '#0D0814', '#050308'],
    darkGold: ['#F9E79F', '#D4AF37', '#8C6D37'],
    obsidianGlass: ['rgba(35, 25, 48, 0.85)', 'rgba(15, 10, 22, 0.95)'],
    ghostMist: ['rgba(40, 50, 60, 0.8)', 'rgba(10, 15, 20, 0.95)'],
    emeraldForest: ['#064E3B', '#022C22'],
  },

  white: '#FFFFFF',
  black: '#000000',
};
