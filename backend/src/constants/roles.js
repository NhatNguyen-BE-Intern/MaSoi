/**
 * CÁC HẰNG SỐ VAI TRÒ VÀ PHE TRONG MA SÓI
 */
const FACTIONS = {
  VILLAGE: "Dân",
  WEREWOLF: "Sói",
  SOLO: "Thứ 3",
  MODERATOR: "Quản Trò",
};

const DEFAULT_ROLES = {
  WOLF: {
    _id: "wolf_default",
    name: "Ma Sói (Thường)",
    team: FACTIONS.WEREWOLF,
    description: "Mỗi đêm thức dậy cùng bầy sói chọn 1 người dân để cắn.",
    isSpecial: true,
  },
  VILLAGER: {
    _id: "villager_default",
    name: "Dân Làng",
    team: FACTIONS.VILLAGE,
    description: "Ngủ say vào ban đêm. Ban ngày cùng thảo luận và biểu quyết treo cổ Ma Sói.",
    isSpecial: false,
  },
  SEER: {
    _id: "seer_default",
    name: "Tiên Tri",
    team: FACTIONS.VILLAGE,
    description: "Mỗi đêm được thức dậy chọn soi thân phận của 1 người chơi bất kỳ.",
    isSpecial: true,
  },
  GUARD: {
    _id: "guard_default",
    name: "Bảo Vệ",
    team: FACTIONS.VILLAGE,
    description: "Mỗi đêm được chọn bảo vệ 1 người chơi an toàn trước nanh vuốt loài Sói.",
    isSpecial: true,
  },
};

module.exports = { FACTIONS, DEFAULT_ROLES };
