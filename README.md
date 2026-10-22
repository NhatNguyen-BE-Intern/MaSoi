# 🐺 DỰ ÁN GAME MA SÓI (WEREWOLF RPG) - MONOREPO

> Hệ sinh thái đa nền tảng cho trò chơi Ma Sói Realtime, bao gồm **Backend (Node.js & Socket.IO)**, **Frontend Web (Next.js)** và **Mobile App (React Native Expo)** theo phong cách nghệ thuật **Dark Gothic & Huyết Nguyệt**.

---

## 🧭 1. BẢN ĐỒ CẤU TRÚC THƯ MỤC TỔNG THỂ (MONOREPO DIRECTORY MAP)

Cấu trúc dự án được phân định ranh giới rõ ràng thành 3 trụ cột độc lập, được module hóa tối đa để **dễ đọc, dễ nâng cấp, bảo trì và tối ưu cho AI Assistant / Lập trình viên** tra cứu nhanh:

```text
MaSoi/
├── README.md                   # 📄 Tài liệu tổng quan toàn bộ Monorepo (Bản đồ dự án & Hướng dẫn AI)
├── package.json                # ⚙️ Điều phối script chạy toàn bộ hệ thống (Monorepo Orchestrator)
├── .gitignore                  # 🛡️ Bộ quy tắc bỏ qua file rác, file build, secrets trên cả 3 nền tảng
│
├── 📂 backend/                 # 🚀 MÁY CHỦ API & REALTIME SOCKET.IO SERVER (Node.js, Express, MongoDB)
│   ├── README.md               # 📄 Tài liệu kiến trúc backend, REST API & Socket Event Dictionary
│   ├── package.json            # ⚙️ Dependencies backend (Express, Socket.IO, Mongoose, Bcryptjs)
│   ├── server.js               # 🔌 Entry point chuyển tiếp (Delegate) tới src/server.js
│   ├── .env.example            # 🔐 Biến môi trường mẫu (PORT, MONGODB_URI)
│   ├── public/cards/           # 🃏 Kho ảnh thẻ bài phục vụ static qua HTTP
│   └── src/
│       ├── server.js           # 🌟 Khởi tạo Express, HTTP server & tích hợp Socket.IO (~50 dòng gọn nhẹ)
│       ├── config/             # ⚙️ Cấu hình Database MongoDB & Biến môi trường
│       ├── constants/          # 🏷️ Hằng số dùng chung (Tên Socket Events, Phe phái, Vai trò mặc định)
│       ├── models/             # 🗄️ Mongoose Schemas (User, Card)
│       ├── routes/             # 🛣️ REST API Endpoints (auth, friends, cards)
│       ├── socket/             # ⚡ Xử lý Realtime: In-memory Room State & Handlers riêng biệt
│       │   ├── state.js        # 🧠 Quản lý bộ nhớ RAM (rooms, game data, grace timers)
│       │   ├── index.js        # 🔌 Đăng ký sự kiện connection
│       │   └── handlers/       # 🎯 Tách biệt logic: roomHandler.js & gameHandler.js
│       └── utils/              # 🛠️ Hàm tiện ích: cardHelper.js, nightOrder.js
│
├── 📂 frontend/                # 🌐 GIAO DIỆN WEB CLIENT (Next.js 16, React 19, Tailwind/CSS)
│   ├── README.md               # 📄 Tài liệu kiến trúc Web, State & Components
│   ├── package.json            # ⚙️ Dependencies Web Client
│   ├── next.config.mjs         # 🔧 Cấu hình Next.js (Static Export, Proxy API rewrite)
│   ├── public/cards/           # 🃏 Toàn bộ 8 tranh thẻ bài Gothic Tarot độ phân giải cao
│   └── src/
│       ├── app/                # 📱 Next.js App Router (layout.js, page.js, globals.css)
│       ├── components/         # 🧩 Các khối giao diện độc lập (Lobby, Room, Moderator HUD, Player View)
│       ├── constants/          # 🏷️ Hằng số sự kiện Socket đồng bộ 100% với Backend
│       └── lib/                # 🔌 Kết nối Socket singleton & Trình phát âm thanh SoundFX
│
└── 📂 mobile/                  # 📱 ỨNG DỤNG DI ĐỘNG (React Native, Expo SDK 52/57)
    ├── README.md               # 📄 Tài liệu thiết kế Mobile Gothic, Soundboard & Navigation
    ├── package.json            # ⚙️ Dependencies Mobile App
    ├── app.json / eas.json     # 📱 Cấu hình Expo, Android package, font, quyền mạng LAN
    ├── App.js                  # 🚀 Entry point Mobile, load font Gothic & điều phối màn hình
    ├── assets/cards/           # 🃏 Tranh bài Gothic Tarot 3:4 & hình nền Blood Moon
    └── src/
        ├── screens/            # 📺 Các màn hình: Auth, Lobby, Room, PlayerScreen, ModeratorScreen
        ├── components/         # 🧱 UI Components dùng chung (Button Gothic, Input Rune, Modals)
        ├── constants/          # 🎨 Design System: theme.js (Huyết nguyệt), colors.js, config.js
        └── services/           # ⚡ Quản lý Socket singleton trên thiết bị di động
```

---

## ⚡ 2. HƯỚNG DẪN KHỞI CHẠY NHANH (QUICK START)

Bạn có thể chạy toàn bộ các môi trường từ thư mục gốc thông qua root `package.json`:

### 🔹 Bước 1: Khởi động Backend Server
```bash
# Chạy máy chủ backend (Port mặc định: 5000)
npm run backend

# Hoặc chế độ tự động reload khi sửa code (Node --watch)
npm run backend:dev
```

### 🔹 Bước 2: Khởi động Web Frontend
```bash
# Mở tab terminal mới và chạy Web Next.js (Port: 3001)
npm run frontend
```
👉 Truy cập giao diện Web tại: `http://localhost:3001`

### 🔹 Bước 3: Khởi động Mobile App
```bash
# Mở tab terminal mới và khởi chạy Expo Dev Server
npm run mobile

# Hoặc chạy chế độ Tunnel (khi test thiết bị thật khác mạng Wi-Fi)
npm run mobile:tunnel
```
👉 Quét mã QR bằng ứng dụng **Expo Go** trên điện thoại (Android / iOS).

---

## 🤝 3. GIAO THỨC TRUYỀN THÔNG (COMMUNICATION PROTOCOL)

Hệ thống sử dụng mô hình kết hợp: **REST API** cho dữ liệu tĩnh và **Socket.IO** cho trận đấu thời gian thực:

### 1. REST APIs (HTTP: `http://localhost:5000/api`)
- `POST /api/auth/register`: Đăng ký tài khoản mới.
- `POST /api/auth/login`: Đăng nhập, cấp phiên và thông tin người chơi.
- `GET /api/cards`: Lấy danh sách toàn bộ thẻ bài trong từ điển.
- `GET /api/friends/search?name=...`: Tìm kiếm người chơi theo tên nhân vật.
- `GET /api/friends`: Lấy danh sách bạn bè của người dùng.
- `POST /api/friends/add`: Gửi yêu cầu kết bạn.
- `GET /api/health`: Healthcheck máy chủ.

### 2. Socket.IO Realtime Events (`ws://localhost:5000`)
Cả 3 nền tảng đều sử dụng bộ hằng số sự kiện tập trung `SOCKET_EVENTS`:

| Nhóm Sự Kiện | Tên Sự Kiện | Chiều Gửi | Mô Tả Chức Năng |
| :--- | :--- | :--- | :--- |
| **Phòng chờ** | `create_room` | Client ➡️ Server | Tạo phòng mới với mã phòng ngẫu nhiên 4 chữ số |
| | `room_created` | Server ➡️ Client | Xác nhận tạo phòng thành công kèm mã phòng |
| | `join_room` | Client ➡️ Server | Tham gia phòng chơi (Hỗ trợ Reconnect khi F5/rớt mạng) |
| | `update_players` | Server ➡️ Client | Đồng bộ danh sách người chơi trong phòng |
| | `leave_room` | Client ➡️ Server | Rời phòng, tự động chuyển quyền Host nếu là chủ phòng |
| **Ván game** | `start_game` | Client ➡️ Server | Chủ phòng kích hoạt phát bài (Tự cân bằng hoặc Bộ bài tùy chỉnh) |
| | `receive_role` | Server ➡️ Client | Nhận vai trò cá nhân (Người chơi thường) hoặc GM Dashboard (Quản trò) |
| | `game_started` | Server ➡️ Client | Thông báo ván đấu chính thức bắt đầu cho cả phòng |
| | `moderator_toggle_status` | Client ➡️ Server | Quản trò/Host chuyển đổi trạng thái Sống/Chết của người chơi |
| | `player_status_changed` | Server ➡️ Client | Đồng bộ trạng thái nhân mạng cho toàn bộ người chơi |
| **Tiện ích GM** | `play_sound_effect` | Client ➡️ Server | Quản trò kích hoạt tiếng sói hú, chuông, quạ kêu trên máy mọi người |
| | `sound_triggered` | Server ➡️ Client | Phát file âm thanh tương ứng trên thiết bị |
| | `start_discussion_timer`| Client ➡️ Server | Quản trò khởi động đồng hồ cát đếm ngược thảo luận |
| | `timer_started` | Server ➡️ Client | Bắt đầu đếm ngược thời gian thực trên màn hình người chơi |
| | `stop_discussion_timer` | Client ➡️ Server | Dừng đồng hồ thảo luận |
| | `play_again` | Client ➡️ Server | Đưa toàn bộ phòng trở lại phòng chờ để ván mới |

---

## 🤖 4. CHỈ DẪN DÀNH CHO AI AGENT (AI NAVIGATION GUIDE)

Khi được yêu cầu sửa đổi hoặc nâng cấp tính năng, AI hãy tra cứu mục tiêu theo bảng sau để mở đúng file nhỏ, **tránh sửa file nguyên khối**:

1. **Sửa logic kết nối Socket hoặc xử lý Reconnect/F5/Rớt mạng**:
   👉 Sửa [`backend/src/socket/handlers/roomHandler.js`](file:///backend/src/socket/handlers/roomHandler.js) và [`backend/src/socket/state.js`](file:///backend/src/socket/state.js).
2. **Sửa thuật toán chia bài, kịch bản gọi đêm hoặc Quản trò**:
   👉 Sửa [`backend/src/socket/handlers/gameHandler.js`](file:///backend/src/socket/handlers/gameHandler.js) và [`backend/src/utils/nightOrder.js`](file:///backend/src/utils/nightOrder.js).
3. **Thêm thẻ bài mới hoặc điều chỉnh vai trò**:
   👉 Thêm vào [`backend/src/constants/roles.js`](file:///backend/src/constants/roles.js), [`mobile/src/constants/cardAssets.js`](file:///mobile/src/constants/cardAssets.js) và chép ảnh thẻ bài vào `public/cards/` của cả Frontend và Mobile.
4. **Sửa bảng điều khiển Quản Trò (Game Master HUD)**:
   👉 Trên Web: [`frontend/src/components/ModeratorDashboard.jsx`](file:///frontend/src/components/ModeratorDashboard.jsx).
   👉 Trên Mobile: [`mobile/src/screens/ModeratorScreen.js`](file:///mobile/src/screens/ModeratorScreen.js).
5. **Sửa giao diện lật bài 3D & màn hình Người Chơi**:
   👉 Trên Web: [`frontend/src/components/PlayerCardView.jsx`](file:///frontend/src/components/PlayerCardView.jsx).
   👉 Trên Mobile: [`mobile/src/screens/PlayerScreen.js`](file:///mobile/src/screens/PlayerScreen.js).
6. **Thay đổi Design Tokens, Màu sắc, Giao diện Huyết Nguyệt**:
   👉 Trên Web: [`frontend/src/app/globals.css`](file:///frontend/src/app/globals.css).
   👉 Trên Mobile: [`mobile/src/constants/theme.js`](file:///mobile/src/constants/theme.js) & [`mobile/src/constants/colors.js`](file:///mobile/src/constants/colors.js).
