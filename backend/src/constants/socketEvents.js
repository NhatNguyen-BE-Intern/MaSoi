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
    ERROR_MSG: "error_msg",
  },
};

module.exports = SOCKET_EVENTS;
