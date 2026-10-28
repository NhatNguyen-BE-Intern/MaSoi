/**
 * TẬP TRUNG TOÀN BỘ TÊN SỰ KIỆN SOCKET.IO
 * Giúp chống sai chính tả, dễ dàng bảo trì và tra cứu cho cả AI và Lập trình viên.
 */
const SOCKET_EVENTS = {
  // Client -> Server
  CLIENT: {
    CREATE_ROOM: "create_room",
    JOIN_ROOM: "join_room",
    START_GAME: "start_game",
    MODERATOR_TOGGLE_STATUS: "moderator_toggle_status",
    PLAY_SOUND_EFFECT: "play_sound_effect",
    START_DISCUSSION_TIMER: "start_discussion_timer",
    STOP_DISCUSSION_TIMER: "stop_discussion_timer",
    LEAVE_ROOM: "leave_room",
    PLAY_AGAIN: "play_again",

    // Chế độ Online Mới
    CREATE_ONLINE_ROOM: "create_online_room",
    GET_PUBLIC_ROOMS: "get_public_rooms",
    QUICK_MATCH: "quick_match",
    TOGGLE_READY: "toggle_ready",
    UPDATE_ROOM_SETTINGS: "update_room_settings",
    KICK_PLAYER: "kick_player",

    // Chat 4 Kênh
    SEND_CHAT_MESSAGE: "send_chat_message",
    GET_CHAT_HISTORY: "get_chat_history",

    // Online Game Actions (Đêm & Ngày)
    SUBMIT_NIGHT_ACTION: "submit_night_action",
    SKIP_NIGHT_TURN: "skip_night_turn",
    VOTE_WOLF_KILL: "vote_wolf_kill",
    CAST_DAY_VOTE: "cast_day_vote",
    CAST_JUDGEMENT_VOTE: "cast_judgement_vote",
    HUNTER_SHOOT: "hunter_shoot",
    TRANSFER_MAYOR: "transfer_mayor",
    JUDGE_PARDON: "judge_pardon",
  },

  // Server -> Client
  SERVER: {
    ROOM_CREATED: "room_created",
    ROOM_JOINED: "room_joined",
    UPDATE_PLAYERS: "update_players",
    RECEIVE_ROLE: "receive_role",
    GAME_STARTED: "game_started",
    MODERATOR_PLAYERS_UPDATED: "moderator_players_updated",
    PLAYER_STATUS_CHANGED: "player_status_changed",
    SOUND_TRIGGERED: "sound_triggered",
    TIMER_STARTED: "timer_started",
    TIMER_STOPPED: "timer_stopped",
    BACK_TO_ROOM: "back_to_room",
    GAME_OVER: "game_over",
    ERROR_MSG: "error_msg",

    // Chế độ Online Mới
    PUBLIC_ROOMS_LIST: "public_rooms_list",
    ONLINE_ROOM_SETTINGS_UPDATED: "online_room_settings_updated",
    KICKED_FROM_ROOM: "kicked_from_room",
    HOST_CHANGED: "host_changed",

    // Chat 4 Kênh
    RECEIVE_CHAT_MESSAGE: "receive_chat_message",
    CHAT_HISTORY: "chat_history",
    CHAT_ERROR: "chat_error",

    // Online Game Engine (Pha Đêm & Ngày)
    PHASE_CHANGED: "phase_changed",
    NIGHT_ACTION_PROMPT: "night_action_prompt",
    WOLF_VOTES_UPDATED: "wolf_votes_updated",
    WOLF_VOTE_TIE_WARNING: "wolf_vote_tie_warning",
    SEER_REVEAL: "seer_reveal",
    FORTUNE_TELLER_REVEAL: "fortune_teller_reveal",
    WITCH_PROMPT: "witch_prompt",
    NIGHT_ACTION_RESULT: "night_action_result",
    MANIPULATED_NOTICE: "manipulated_notice",
    DOUSED_NOTICE: "doused_notice",
    PRIEST_BLESS_NOTICE: "priest_bless_notice",
    JUDGE_PARDON_ANNOUNCE: "judge_pardon_announce",
    BEHOLDER_REVEAL: "beholder_reveal",
    DRUNK_SOBERED: "drunk_sobered",
    APPRENTICE_AWAKENED: "apprentice_awakened",
    SHADOW_HUNTER_RESULT: "shadow_hunter_result",
    DAY_ANNOUNCEMENT: "day_announcement",
    DAY_VOTES_UPDATED: "day_votes_updated",
    DEFENSE_SPOTLIGHT: "defense_spotlight",
    JUDGEMENT_RESULT: "judgement_result",
  },

  // 4 Kênh Chat Thời Gian Thực
  CHAT_CHANNELS: {
    TOWN: "town", // Ban ngày, người sống
    WOLF: "wolf", // Ban đêm, bầy Ma Sói
    LOVERS: "lovers", // 24/24, Cặp Đôi (Lovers)
    GHOST: "ghost", // Người chết & Khán giả
  },
};

module.exports = SOCKET_EVENTS;
