# 🌐 MASOI WEB FRONTEND

> Giao diện Web Client cho Game Ma Sói Realtime, xây dựng trên nền tảng **Next.js 16 (App Router)** và **React 19**.
> Tích hợp hoạt ảnh mượt mà, hiệu ứng lật bài 3D, hệ thống âm thanh thời gian thực và bảng điều khiển Quản Trò chuyên nghiệp.

---

## 🏗️ 1. CẤU TRÚC MÃ NGUỒN (SRC DIRECTORY)

```text
frontend/
├── package.json              # Dependencies: Next.js 16, React 19, Lucide Icons, Socket.IO Client
├── next.config.mjs           # Cấu hình Next.js (Static export, API proxy rewrites)
├── eslint.config.mjs         # Linter rules
├── public/cards/             # 🃏 Kho tranh thẻ bài Gothic Tarot độ phân giải cao
└── src/
    ├── app/                  # Next.js App Router
    │   ├── layout.js         # Khung giao diện gốc (Root Layout)
    │   ├── page.js           # Bộ điều phối trạng thái màn hình (State Orchestrator)
    │   ├── globals.css       # Design System CSS, Dark Gothic tokens & hiệu ứng phát sáng
    │   └── page.module.css   # Module CSS bổ trợ
    ├── components/           # Các khối giao diện nghiệp vụ độc lập
    │   ├── AuthSection.jsx          # Cổng đăng ký / đăng nhập tài khoản
    │   ├── LobbySection.jsx         # Sảnh chính: Tạo phòng, nhập mã phòng, mở modals
    │   ├── RoomLobby.jsx            # Phòng chờ hội đồng: Danh sách người chơi, chọn quản trò, tùy chỉnh bài
    │   ├── ModeratorDashboard.jsx   # Bảng điều khiển Quản Trò: Kịch bản đêm, nhân mạng, soundboard, timer
    │   ├── PlayerCardView.jsx       # Màn hình Người Chơi: Lật bài 3D, trạng thái sống/chết, đồng hồ cát
    │   ├── CardDictionaryModal.jsx  # Modal Từ Điển Thần Bài: Tra cứu thông tin mọi nhân vật
    │   ├── FriendsModal.jsx         # Modal Quản Lý Bạn Bè: Tìm kiếm & kết bạn
    │   └── Navbar.jsx               # Thanh điều hướng trên cùng, hiển thị danh xưng & nút đăng xuất
    ├── constants/
    │   └── socketEvents.js   # Từ điển hằng số sự kiện Socket.IO đồng bộ 100% với Backend
    └── lib/
        ├── socket.js         # Singleton Socket.IO Client tự động kết nối Backend (Port 5000)
        └── sound.js          # Hệ thống âm thanh Web Audio API (Sói hú, chuông ngân, quạ kêu, chiêng sáng)
```

---

## 🔄 2. LUỒNG TRẠNG THÁI NGƯỜI DÙNG (USER STATE FLOW)

Ứng dụng điều phối giao diện theo trạng thái tại `src/app/page.js`:

```text
[Chưa đăng nhập] ➡️ AuthSection (Đăng nhập / Đăng ký)
        ⬇️
[Đã đăng nhập]  ➡️ LobbySection (Sảnh chờ: Tạo bàn / Nhập mã bàn 4 số)
        ⬇️
[Trong phòng]    ➡️ RoomLobby (Chờ đủ người, Host chọn Quản trò & Bộ bài)
        ⬇️
[Ván đấu bắt đầu]
   ├── Nếu là Quản Trò: ➡️ ModeratorDashboard (Bảng điều khiển chiến thuật GM)
   └── Nếu là Người Chơi: ➡️ PlayerCardView (Lật bài 3D, Hồn ma, Đồng hồ cát)
```

---

## 🎨 3. THIẾT KẾ & HIỆU ỨNG (VISUAL EXCELLENCE)

- **Phong cách mỹ thuật**: Dark Gothic & Huyết Nguyệt với nền đen Obsidian (`#07050A`), viền mạ vàng cổ (`#D4AF37`) và điểm nhấn đỏ Ruby (`#C41E3A`).
- **Thẻ bài 3D**: Sử dụng CSS 3D transforms (`perspective: 1000px`, `rotateY`) cho trải nghiệm lật bài chân thực như boardgame thực tế.
- **Tự động nhận diện Backend**: `src/lib/socket.js` tự động trỏ về `http://<hostname>:5000` khi chạy ở cổng 3001, hoặc trỏ về `window.location.origin` khi deploy production.

---

## ⚡ 4. KHỞI CHẠY & BUILD

```bash
# 1. Chạy môi trường phát triển (Port mặc định: 3001)
npm run dev

# 2. Kiểm tra chất lượng mã nguồn
npm run lint

# 3. Build gói sản phẩm tĩnh (Static Export vào frontend/out)
npm run build
```
Truy cập giao diện tại: `http://localhost:3001`.
