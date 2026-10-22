# 🚀 MASOI BACKEND SERVER

> Máy chủ API RESTful và Realtime Socket.IO cho Game Ma Sói đa nền tảng.
> Được xây dựng với kiến trúc module hóa hướng dịch vụ (Modular Architecture), tối ưu hóa cho hiệu năng cao, độ trễ thấp và khả năng chống ngắt kết nối (Reconnect-resilient).

---

## 🏗️ 1. KIẾN TRÚC MÃ NGUỒN (MODULAR ARCHITECTURE)

Toàn bộ mã nguồn đã được chia tách thành các module độc lập theo nguyên lý đơn nhiệm (Single Responsibility Principle):

```text
backend/
├── package.json              # Quản lý dependencies & scripts (Express, Socket.IO, Mongoose)
├── server.js                 # Entry point chuyển tiếp tới src/server.js
├── .env                      # Cấu hình bí mật môi trường (Local / Production)
├── .env.example              # Mẫu biến môi trường
├── public/cards/             # Thư mục ảnh thẻ bài phục vụ static HTTP
└── src/
    ├── server.js             # Khởi tạo Express, HTTP server, Routes, Socket.IO (~50 dòng)
    ├── config/
    │   ├── env.js            # Nạp và kiểm tra các biến môi trường (PORT, MONGODB_URI)
    │   └── db.js             # Kết nối MongoDB Atlas với Mongoose
    ├── constants/
    │   ├── socketEvents.js   # Từ điển hằng số sự kiện Socket.IO tập trung
    │   └── roles.js          # Định nghĩa phe (Phe Dân, Sói, Thứ 3, Quản Trò) và thẻ mặc định
    ├── models/
    │   ├── User.js           # Mongoose Model: Tài khoản, tên nhân vật, danh sách bạn bè
    │   └── Card.js           # Mongoose Model: Danh mục lá bài (tên, phe, mô tả, kỹ năng)
    ├── routes/
    │   ├── auth.js           # REST: /api/auth (Đăng ký, Đăng nhập)
    │   ├── cards.js          # REST: /api/cards (Lấy danh sách thẻ bài trong DB)
    │   └── friends.js        # REST: /api/friends (Tìm kiếm & Quản lý danh sách bạn bè)
    ├── socket/
    │   ├── state.js          # Quản lý bộ nhớ RAM in-memory: rooms, roomGameData, timers
    │   ├── index.js          # Khởi tạo Socket.IO và liên kết các handlers
    │   └── handlers/
    │       ├── roomHandler.js# Logic: Tạo phòng, vào phòng, F5 reconnect, rời phòng
    │       └── gameHandler.js# Logic: Bắt đầu ván, phát bài, quản trò, soundboard, timer
    └── utils/
        ├── cardHelper.js     # Hàm làm sạch dữ liệu thẻ bài (sanitizeCard)
        └── nightOrder.js     # Tự động lập kịch bản gọi đêm (generateNightOrder)
```

---

## ⚡ 2. CƠ CHẾ REALTIME & BỘ ĐỆM PHỤC HỒI (SOCKET STATE & GRACE TIMERS)

### 🔹 1. Quản lý In-Memory State (`src/socket/state.js`)
- `rooms[roomCode]`: Mảng danh sách người chơi trong phòng.
- `roomGameData[roomCode]`: Chứa toàn bộ thông tin ván đấu đang diễn ra: Quản trò, danh sách người chơi đã phát bài, các thẻ bài trong ván, kịch bản gọi đêm.

### 🔹 2. Bộ đệm ngắt kết nối (Disconnect Grace Period)
- **Khi ở Phòng chờ (8 giây)**: Khi người chơi vô tình F5 hoặc rớt mạng nhẹ, server không lập tức kick người chơi ra mà thiết lập timer 8 giây. Nếu người chơi kết nối lại trong 8 giây này với cùng `characterName`, phiên làm việc được giữ nguyên.
- **Khi trong ván game (60 giây)**: Nếu toàn bộ người chơi trong phòng đều thoát hết (phòng trống 0 kết nối), server đếm ngược 60 giây trước khi giải phóng bộ nhớ RAM để tránh rò rỉ dữ liệu (Zombie Rooms).

---

## 📡 3. DANH SÁCH RESTFUL API ENDPOINTS

Base URL: `http://localhost:5000/api`

### 🔹 Authentication (`/api/auth`)
| Phương thức | Endpoint | Body | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | `{ username, password, characterName }` | Tạo tài khoản mới |
| `POST` | `/api/auth/login` | `{ username, password }` | Đăng nhập tài khoản |

### 🔹 Cards Dictionary (`/api/cards`)
| Phương thức | Endpoint | Params | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cards` | Không | Lấy toàn bộ danh sách thẻ bài mẫu từ DB |

### 🔹 Friends Management (`/api/friends`)
| Phương thức | Endpoint | Params / Body | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/friends/search` | `?name=...` | Tìm kiếm người chơi theo tên nhân vật |
| `GET` | `/api/friends` | `?userId=...` | Lấy danh bạ bạn bè |
| `POST` | `/api/friends/add` | `{ userId, friendCharacterName }` | Kết bạn |

### 🔹 Server Healthcheck
| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Kiểm tra tình trạng hoạt động của backend |

---

## 🔌 4. BỘ SỰ KIỆN REALTIME SOCKET.IO

### Client ➡️ Server
- `create_room (user)`: Tạo phòng ngẫu nhiên 4 số.
- `join_room ({ roomCode, user })`: Vào phòng hoặc Reconnect ván đang chạy.
- `start_game ({ roomCode, mode, customDeck, moderatorMode, moderatorSocketId })`: Kích hoạt ván mới.
- `moderator_toggle_status ({ roomCode, targetCharacterName, targetSocketId })`: Đổi trạng thái Sống/Chết.
- `play_sound_effect ({ roomCode, soundType })`: Phát âm thanh cho toàn phòng.
- `start_discussion_timer ({ roomCode, seconds, label })`: Bật đồng hồ thảo luận.
- `stop_discussion_timer (roomCode)`: Tắt đồng hồ.
- `leave_room (roomCode)`: Rời phòng chủ động.
- `play_again (roomCode)`: Đưa người chơi quay về phòng chờ.

### Server ➡️ Client
- `room_created (roomCode)`: Gửi mã phòng vừa tạo.
- `room_joined (roomCode)`: Xác nhận vào phòng thành công.
- `update_players (players)`: Danh sách thành viên phòng chờ.
- `receive_role (roleData)`: Trả về vai trò người chơi hoặc dữ liệu Quản trò.
- `game_started (info)`: Ván đấu chính thức bắt đầu.
- `moderator_players_updated (players)`: Cập nhật danh sách sống/chết cho Quản trò.
- `player_status_changed ({ characterName, isAlive })`: Báo cáo nhân mạng cho toàn làng.
- `sound_triggered (soundType)`: Kích hoạt âm thanh trên máy client.
- `timer_started ({ seconds, label })`: Đồng bộ đồng hồ đếm ngược.
- `timer_stopped`: Dừng đồng hồ.
- `back_to_room`: Trở về phòng chờ.
- `error_msg (message)`: Thông báo lỗi dạng pop-up.

---

## 🛠️ 5. KHỞI CHẠY MÁY CHỦ

```bash
# 1. Cài đặt dependencies (nếu chưa có)
npm install

# 2. Khởi chạy server production
npm start

# 3. Khởi chạy chế độ phát triển (Tự reload khi lưu file)
npm run dev
```
Server sẽ chạy mặc định tại: `http://localhost:5000`.
