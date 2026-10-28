/**
 * BỘ TÀI NGUYÊN HÌNH ẢNH NGHỆ THUẬT LÁ BÀI MA SÓI (GOTHIC TAROT ART)
 * Tự động ánh xạ vai trò người chơi sang artwork lá bài độ phân giải cao
 */

export const CARD_IMAGES = {
  back: require('../../assets/cards/card_back.jpg'),
  BACK_GOTHIC: require('../../assets/cards/card_back.jpg'),
  werewolf: require('../../assets/cards/werewolf.jpg'),
  seer: require('../../assets/cards/seer.jpg'),
  guard: require('../../assets/cards/guard.jpg'),
  witch: require('../../assets/cards/witch.jpg'),
  hunter: require('../../assets/cards/hunter.jpg'),
  villager: require('../../assets/cards/villager.jpg'),
  moderator: require('../../assets/cards/moderator.jpg'),
};

export const BACKGROUND_IMAGES = {
  bloodMoon: require('../../assets/blood_moon_bg.jpg'),
};

/**
 * Hàm lấy hình ảnh minh họa bài theo tên vai trò hoặc phe
 */
export const getCardArtwork = (roleName = '', team = '') => {
  const normalized = (roleName || '').toLowerCase().trim();
  const normalizedTeam = (team || '').toLowerCase().trim();

  if (
    normalized.includes('bán sói') ||
    normalized.includes('lycan') ||
    normalized.includes('hóa sói') ||
    normalized.includes('doppelganger')
  ) {
    return CARD_IMAGES.villager;
  }

  if (normalized.includes('sói') || normalized.includes('wolf') || normalizedTeam === 'sói') {
    return CARD_IMAGES.werewolf;
  }
  if (normalized.includes('tiên tri') || normalized.includes('seer')) {
    return CARD_IMAGES.seer;
  }
  if (normalized.includes('bảo vệ') || normalized.includes('guard') || normalized.includes('hiệp sĩ')) {
    return CARD_IMAGES.guard;
  }
  if (normalized.includes('phù thủy') || normalized.includes('witch')) {
    return CARD_IMAGES.witch;
  }
  if (normalized.includes('thợ săn') || normalized.includes('hunter')) {
    return CARD_IMAGES.hunter;
  }
  if (normalized.includes('quản trò') || normalized.includes('moderator') || normalized.includes('host')) {
    return CARD_IMAGES.moderator;
  }

  // Mặc định là Dân Làng
  return CARD_IMAGES.villager;
};
