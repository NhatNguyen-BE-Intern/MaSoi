# 📱 MASOI MOBILE APP (EXPO REACT NATIVE)

> Ứng dụng di động Game Ma Sói Realtime, xây dựng trên nền tảng **React Native & Expo SDK**.
> Mang phong cách mỹ thuật độc quyền **Dark Gothic & Huyết Nguyệt (Blood Moon Werewolf RPG Boardgame)** với tranh Tarot tỷ lệ chuẩn 3:4, hoạt ảnh lật bài 3D, phản hồi xúc giác đa tầng (`expo-haptics`) và bảng điều khiển Quản Trò tối ưu cho màn hình cảm ứng.

---

## 🏗️ 1. CẤU TRÚC MÃ NGUỒN (SRC DIRECTORY)

```text
mobile/
├── package.json              # Quản lý dependencies (Expo, Haptics, Reanimated, Socket.IO)
├── app.json                  # Cấu hình Expo, Android package name, font, quyền mạng LAN
├── eas.json                  # Cấu hình build EAS (APK / AAB)
├── App.js                    # Entry point điều phối: Nạp font Gothic, Auth session & Navigation
├── assets/
│   ├── cards/                # 🃏 Tranh thẻ bài Gothic Tarot 3:4 độ phân giải cao
│   └── blood_moon_bg.jpg     # 🌕 Hình nền Huyết Nguyệt ma mị
└── src/
    ├── screens/              # 📺 Các màn hình chính
    │   ├── AuthScreen.js            # Cổng đăng nhập / đăng ký phong cách bia đá Rune
    │   ├── HomeScreen.js            # Màn hình trang chủ điều hướng
    │   ├── LobbyScreen.js           # Sảnh chờ hoàng gia: Tạo bàn, nhập mã 6 ô thạch ấn
    │   ├── RoomScreen.js            # Bàn tiệc hội đồng: Chờ người, chọn bài & Quản trò
    │   ├── PlayerScreen.js          # Thẻ bài 3D: Lật bài, đồng hồ cát, trạng thái Hồn Ma
    │   └── ModeratorScreen.js       # Bảng điều khiển Quản Trò (GM Tactical HUD)
    ├── components/
    │   ├── common/                  # Nút bấm viền vàng (CustomButton), Ô nhập đá đen (CustomInput), Header
    │   └── game/                    # Modal Từ Điển Thẻ Bài, Danh Sách Bạn Bè, ReadyStatusCard
    ├── constants/
    │   ├── theme.js                 # Design System chuẩn: Màu Obsidian, Huyết Nguyệt, Vàng cổ, Faction Glows
    │   ├── colors.js                # Bảng màu sắc cơ bản
    │   ├── cardAssets.js            # Ánh xạ vai trò tự động sang tranh Tarot nghệ thuật
    │   ├── config.js                # Cấu hình kết nối mạng: IP LAN máy chủ & Port 5000
    │   └── socketEvents.js          # Từ điển sự kiện Socket.IO đồng bộ 100% với Backend
    └── services/
        └── socket.js                # Singleton Socket.IO Client trên nền React Native
```

---

## 🎨 2. QUY CHUẨN DESIGN SYSTEM: DARK GOTHIC & HUYẾT NGUYỆT

- **Màu sắc chủ đạo**:
  - `background`: `#07050A` (Đá đen Obsidian đêm trăng u tối)
  - `borderGold`: `#D4AF37` (Viền mạ vàng hoàng gia cổ điển)
  - `borderBlood`: `#C41E3A` / `#9E1B26` (Đỏ Huyết Nguyệt rực cháy)
  - `surface`: `#150F1E` (Bề mặt phiến đá gothic mờ ma thuật)
- **Tranh thẻ bài**: Toàn bộ lá bài hiển thị tranh Tarot tỷ lệ 3:4 chuẩn trong `assets/cards/`, không dùng icon phẳng vector đại trà.
- **Phản hồi xúc giác (`expo-haptics`)**: Từng tương tác chạm nút, lật bài, toggle sống/chết đều kích hoạt nhịp rung phản hồi haptic tương ứng.

---

## 🌐 3. CẤU HÌNH KẾT NỐI VỚI BACKEND

Khi thử nghiệm trên điện thoại thật, điện thoại cần trỏ tới địa chỉ IP LAN của máy tính chạy server backend:

1. Mở file [`mobile/src/constants/config.js`](file:///mobile/src/constants/config.js).
2. Sửa `SERVER_IP` thành địa chỉ IPv4 máy tính của bạn (kiểm tra bằng lệnh `ipconfig` trong terminal):
   ```javascript
   export const SERVER_IP = '192.168.x.x'; // Thay bằng IP LAN thực tế
   export const SERVER_PORT = '5000';
   ```
3. Hoặc tạo file `mobile/.env` và khai báo:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.x.x:5000
   ```

---

## ⚡ 4. KHỞI CHẠY ỨNG DỤNG

```bash
# 1. Cài đặt dependencies (nếu chưa có)
npm install

# 2. Khởi chạy máy chủ Expo
npm start

# 3. Khởi chạy với chế độ Tunnel (khi test điện thoại không chung Wi-Fi)
npm run tunnel
```

👉 Mở ứng dụng **Expo Go** trên điện thoại Android/iOS và quét mã QR trên terminal để trải nghiệm.
