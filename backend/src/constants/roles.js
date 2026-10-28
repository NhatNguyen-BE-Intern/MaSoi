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
  WITCH: {
    _id: "witch_default",
    name: "Phù Thủy",
    team: FACTIONS.VILLAGE,
    description: "Sở hữu 2 bình thuốc: 1 bình cứu người bị Sói cắn và 1 bình độc tiêu diệt 1 người bất kỳ.",
    isSpecial: true,
  },
  HUNTER: {
    _id: "hunter_default",
    name: "Thợ Săn",
    team: FACTIONS.VILLAGE,
    description: "Khi bị loại khỏi ván chơi (bị cắn hoặc bị treo cổ), có quyền nổ súng kéo theo 1 người chơi khác.",
    isSpecial: true,
  },

  // --- ĐỢT 2: SÓI BIẾN THỂ (EXPANSION 1) ---
  ALPHA_WOLF: {
    _id: "alpha_wolf",
    name: "Sói Đầu Đàn",
    team: FACTIONS.WEREWOLF,
    description: "Thủ lĩnh bầy Sói. Sở hữu kỹ năng Lây Nhiễm (1 lần/ván): Nạn nhân bị cắn không chết mà biến đổi thành Ma Sói từ đêm tiếp theo.",
    isSpecial: true,
  },
  WOLF_CUB: {
    _id: "wolf_cub",
    name: "Sói Con",
    team: FACTIONS.WEREWOLF,
    description: "Thức dậy cùng bầy. Khi Sói Con chết, đêm tiếp theo bầy Sói cuồng nộ được quyền cắn 2 người chơi.",
    isSpecial: true,
  },
  WHITE_WOLF: {
    _id: "white_wolf",
    name: "Sói Trắng",
    team: FACTIONS.WEREWOLF,
    description: "Thức cùng bầy Sói. Cứ mỗi 2 đêm (Đêm 2, Đêm 4...), sau khi bầy ngủ, Sói Trắng thức dậy cắn chết 1 con Sói khác. Thắng khi là kẻ sống sót duy nhất.",
    isSpecial: true,
  },
  CURSED_WOLF: {
    _id: "cursed_wolf",
    name: "Sói Nguyền",
    team: FACTIONS.VILLAGE, // Ban đầu thuộc phe Dân
    description: "Ban đầu là Dân Làng (Tiên Tri soi ra Dân). Nếu bị Ma Sói cắn đêm mà không có Bảo Vệ che chắn, sẽ không chết mà hóa thành Ma Sói từ đêm sau.",
    isSpecial: true,
  },
  OLD_WOLF: {
    _id: "old_wolf",
    name: "Sói Già",
    team: FACTIONS.WEREWOLF,
    description: "Sói già dạn dày kinh nghiệm. Miễn nhiễm hoàn toàn với Thuốc Độc của Phù Thủy.",
    isSpecial: true,
  },
  HIDDEN_WOLF: {
    _id: "hidden_wolf",
    name: "Sói Ẩn",
    team: FACTIONS.WEREWOLF,
    description: "Che giấu tà khí tuyệt đối. Khi Tiên Tri soi bài vào Sói Ẩn, kết quả nhận được luôn là Phe Dân Làng.",
    isSpecial: true,
  },

  // Vai bổ trợ Đợt 1
  CUPID: {
    _id: "cupid_default",
    name: "Thần Tình Yêu (Cupid)",
    team: FACTIONS.VILLAGE,
    description: "Đêm đầu tiên thức dậy ghép đôi 2 người chơi thành Cặp Đôi định mệnh.",
    isSpecial: true,
  },
  TANNER: {
    _id: "tanner_default",
    name: "Kẻ Chán Đời (Tanner)",
    team: FACTIONS.SOLO,
    description: "Muốn bị dân làng treo cổ ban ngày. Nếu bị treo cổ, giành chiến thắng tuyệt đối!",
    isSpecial: true,
  },

  // --- ĐỢT 3: TƯƠNG TÁC PHỨC TẠP & PHE THỨ 3 NÂNG CAO (EXPANSION 2) ---
  THIEF: {
    _id: "thief_default",
    name: "Kẻ Trộm (Thief)",
    team: FACTIONS.VILLAGE,
    description: "Đêm 1 xem 2 lá bài thừa ngoài rìa để chọn đổi vai. Nếu cả 2 lá đều là Sói, bắt buộc phải lấy 1 lá Sói.",
    isSpecial: true,
  },
  DOPPELGANGER: {
    _id: "doppelganger_default",
    name: "Người Hóa Sói (Doppelganger)",
    team: FACTIONS.VILLAGE,
    description: "Đêm 1 chọn 1 người sống làm hình mẫu. Khi người đó chết, Doppelganger lập tức thừa kế toàn bộ vai trò và phe của người đó với full kỹ năng.",
    isSpecial: true,
  },
  TROUBLEMAKER: {
    _id: "troublemaker_default",
    name: "Kẻ Đánh Tráo (Troublemaker)",
    team: FACTIONS.VILLAGE,
    description: "Đêm 1 bí mật hoán đổi vai trò của 2 người chơi khác cho nhau mà họ không hề hay biết.",
    isSpecial: true,
  },
  ELDER: {
    _id: "elder_default",
    name: "Già Làng (Elder)",
    team: FACTIONS.VILLAGE,
    description: "Có 2 mạng trước móng vuốt Ma Sói. Nếu bị Dân Làng treo cổ hoặc bị Phù Thủy đầu độc, chết ngay và toàn bộ Phe Dân mất hết kỹ năng đặc biệt.",
    isSpecial: true,
  },
  SERIAL_KILLER: {
    _id: "serial_killer_default",
    name: "Sát Thủ (Serial Killer)",
    team: FACTIONS.SOLO,
    description: "Mỗi đêm thức dậy chọn đâm chết 1 người. Đòn tấn công xuyên qua khiên Bảo Vệ. Thắng khi là người sống sót duy nhất.",
    isSpecial: true,
  },
  LYCAN: {
    _id: "lycan_default",
    name: "Bán Sói (Lycan)",
    team: FACTIONS.VILLAGE,
    description: "Thuộc phe Dân Làng, nhưng mang dòng máu sói trong người nên Tiên Tri soi ra Phe Ma Sói.",
    isSpecial: false,
  },
  AVENGER: {
    _id: "avenger_default",
    name: "Kẻ Báo Thù (Avenger)",
    team: FACTIONS.VILLAGE,
    description: "Nếu bị giết chết ban đêm, có quyền kéo theo 1 người chơi khác cùng tử nạn trước bình minh.",
    isSpecial: true,
  },

  // --- ĐỢT 4: VAI TRÒ PHỤ TRỢ & PHE TRUNG LẬP MỞ RỘNG (EXPANSION 3) ---
  DARK_CUPID: {
    _id: "dark_cupid_default",
    name: "Cupid Nâng Cao (Dark Cupid)",
    team: FACTIONS.SOLO,
    description: "Đêm 1 thức dậy ghép đôi 2 người (có thể tự ghép bản thân). Giành chiến thắng khi Cặp Đôi (hoặc chính mình cùng Cặp Đôi) là những người sống sót cuối cùng.",
    isSpecial: true,
  },
  MANIPULATOR_WITCH: {
    _id: "manipulator_witch_default",
    name: "Phù Thủy Thao Túng",
    team: FACTIONS.SOLO,
    description: "Mỗi đêm có thể chọn thao túng 1 người chơi. Mục tiêu bị thao túng sẽ bị cưỡng chế phiếu biểu quyết ban ngày và bị khóa kỹ năng đêm kế tiếp.",
    isSpecial: true,
  },
  FORTUNE_TELLER: {
    _id: "fortune_teller_default",
    name: "Thầy Bói (Fortune Teller)",
    team: FACTIONS.VILLAGE,
    description: "Phiên bản cao cấp của Tiên Tri. Mỗi đêm soi 1 người chơi và thấy chính xác tên vai trò cụ thể của người đó (thay vì chỉ thấy Phe).",
    isSpecial: true,
  },
  TRAITOR: {
    _id: "traitor_default",
    name: "Kẻ Phản Bội (Traitor)",
    team: FACTIONS.WEREWOLF,
    description: "Thuộc phe Ma Sói nhưng sống trà trộn trong Dân Làng (Tiên Tri soi ra Phe Dân). Khi toàn bộ Ma Sói nguyên bản chết hết, Kẻ Phản Bội sẽ chính thức thức tỉnh thành Ma Sói mới.",
    isSpecial: true,
  },

  // --- ĐỢT 5: BẢO VỆ THẦN THÁNH, PHẢN KÍCH & PHÓNG HỎA (EXPANSION 4) ---
  ARSONIST: {
    _id: "arsonist_default",
    name: "Kẻ Độc Hành (Arsonist)",
    team: FACTIONS.SOLO,
    description: "Mỗi đêm có thể chọn tẩm xăng 1-2 người, hoặc bấm Châm Lửa để thiêu rụi toàn bộ những ai đã dính xăng (xuyên khiên Bảo Vệ). Thắng solo khi là kẻ duy nhất sống sót.",
    isSpecial: true,
  },
  PRIEST: {
    _id: "priest_default",
    name: "Thầy Tu (Priest)",
    team: FACTIONS.VILLAGE,
    description: "Mỗi đêm ban phước lành cho 1 người: giải trừ dầu xăng của Kẻ Độc Hành, hóa giải lây nhiễm của Sói Đầu Đàn và cứu sống nạn nhân nếu bị Sói cắn đêm đó.",
    isSpecial: true,
  },
  KNIGHT: {
    _id: "knight_default",
    name: "Hiệp Sĩ Ánh Sáng (Knight)",
    team: FACTIONS.VILLAGE,
    description: "Chiến binh quả cảm của ngôi làng. Nếu bị Ma Sói cắn tử nạn trong đêm, kiếm khí của Hiệp Sĩ vung lên chém chết con Sói có số ghế gần nhất bên cạnh mình.",
    isSpecial: true,
  },
  JUDGE: {
    _id: "judge_default",
    name: "Thẩm Phán (Judge)",
    team: FACTIONS.VILLAGE,
    description: "Người bảo vệ công lý của làng. Một lần trong ván đấu, có quyền gõ búa Phủ Quyết để tha bổng ngay lập tức nghi phạm trước giá treo cổ.",
    isSpecial: true,
  },
  LITTLE_GIRL: {
    _id: "little_girl_default",
    name: "Cô Bé (Little Girl)",
    team: FACTIONS.VILLAGE,
    description: "Ban đêm lén thức dậy và nhìn trộm được các tin nhắn trong phòng Chat bí mật của bầy Ma Sói theo thời gian thực để nắm bắt manh mối.",
    isSpecial: true,
  },

  // --- ĐỢT 6: EXPANSION 5 (THE FINAL 4 ROLES - HOÀN THÀNH ĐỦ 34 LÁ BÀI 100%) ---
  SHADOW_HUNTER: {
    _id: "shadow_hunter_default",
    name: "Thợ Săn Bóng Đêm",
    team: FACTIONS.VILLAGE,
    description: "Sở hữu 1 viên đạn đặc biệt trong đêm chỉ bắn hạ được người thuộc Phe Thứ 3 / Phe Trung Lập (Sát Thủ, Kẻ Độc Hành, Tanner,...). Nếu bắn nhầm Dân hoặc Sói thì phát đạn vô hại.",
    isSpecial: true,
  },
  DRUNK: {
    _id: "drunk_default",
    name: "Kẻ Say (Drunk)",
    team: FACTIONS.VILLAGE,
    description: "Tưởng mình là Dân Làng cho đến Đêm 3 mới tỉnh rượu và khám phá ra vai trò thực sự ẩn giấu của mình.",
    isSpecial: true,
  },
  BEHOLDER: {
    _id: "beholder_default",
    name: "Người Quan Sát (Beholder)",
    team: FACTIONS.VILLAGE,
    description: "Đêm đầu tiên thức dậy và được Thần linh chỉ điểm biết chính xác ai là Tiên Tri thật sự của ngôi làng để bảo vệ.",
    isSpecial: true,
  },
  APPRENTICE_SEER: {
    _id: "apprentice_seer_default",
    name: "Tiên Tri Tập Sự",
    team: FACTIONS.VILLAGE,
    description: "Học trò của Tiên Tri. Ban đầu ngủ say như Dân Làng; khi Tiên Tri chính tử nạn, Tiên Tri Tập Sự sẽ kế thừa quả cầu pha lê và thức tỉnh thành Tiên Tri mới của làng.",
    isSpecial: true,
  },
};

module.exports = { FACTIONS, DEFAULT_ROLES };
