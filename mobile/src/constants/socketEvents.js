/**
 * HẰNG SỐ SỰ KIỆN SOCKET.IO CHO MOBILE
 * Đồng bộ 100% với backend/src/constants/socketEvents.js
 */
export const SOCKET_EVENTS = {
  // Client Gửi đi
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
  },

  // Server Trả về
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
    ERROR_MSG: "error_msg",
  },
};

export default SOCKET_EVENTS;
