# 📝 NHẬT KÝ TIẾN ĐỘ HỌC TẬP & PHÁT TRIỂN MOBILE APP

> Tài liệu này ghi lại tiến trình học tập, các bài thực hành đã làm và các cải tiến mã nguồn trong ứng dụng **Ma Sói Mobile**.  
> Bản đồ lộ trình học chi tiết: [Xem tại MOBILE_LEARNING_ROADMAP.md](file:///e:/Masoi/MaSoi/mobile/Docs/MOBILE_LEARNING_ROADMAP.md)

---

## 🎯 BƯỚC ĐẦU TIÊN CỦA BẠN (HÔM NAY)

- [x] **Bước 1:** Cài ứng dụng **Expo Go** trên điện thoại cá nhân (Android hoặc iOS).
- [x] **Bước 2:** Chạy lệnh `npm start` trong thư mục `mobile/` và quét mã QR để mở app Ma Sói trên điện thoại.
- [ ] **Bước 3:** Quan sát màn hình [AuthScreen.js](file:///e:/Masoi/MaSoi/mobile/src/screens/AuthScreen.js) và thực hành Chặng 1: Thay đổi giao diện đầu tiên.

---

## 📌 NHẬT KÝ THEO DÕI CÁC BUỔI HỌC

| Ngày | Chặng học | Nội dung bài học | Trạng thái | Ghi chú & Đã làm |
| :--- | :--- | :--- | :---: | :--- |
| Hôm nay | **Chặng 0: Khởi động** | Cài Expo Go, quét mã QR chạy app Ma Sói trên điện thoại thật | ✅ ĐÃ XONG | Đã lên hình app Huyết Nguyệt thành công! |
| Hôm nay | **Chặng 1: Giao diện** | Học thẻ `View`, `Text`, `TouchableOpacity` & Flexbox | ⏳ Đang học | Thử giải phẫu và biến tấu AuthScreen.js |
| ... | **Chặng 2: Logic** | Học `useState`, `props`, tương tác chạm | ⬜ | Thử làm tính năng ẩn/hiện thẻ bài |
| ... | **Chặng 3: Điều hướng** | Cách app chuyển từ Đăng Nhập sang Sảnh Chờ & Vào Bàn | ⬜ | Khám phá file App.js |
| ... | **Chặng 4: Di động** | Rung máy Haptics & Nhớ phiên chơi AsyncStorage | ⬜ | Tích hợp vào nút sẵn sàng |
| ... | **Chặng 5: Realtime** | Kết nối Socket.IO với máy tính qua mạng LAN | ⬜ | Đấu thử giữa điện thoại & web |
| ... | **Chặng 6: Hoàn thiện** | Hiệu ứng lật bài 3D & Build file APK cài máy bạn bè | ⬜ | Tạo bản cài đặt đầu tay |

---

## 💡 GHI CHÚ NHANH CÁC LỆNH CẦN NHỚ

```bash
# 1. Di chuyển vào thư mục mobile
cd mobile

# 2. Khởi động server phát sóng code sang điện thoại
npm start

# 3. Khởi động chế độ Tunnel (khi điện thoại và máy tính khác Wi-Fi)
npm run tunnel

# 4. Kiểm tra địa chỉ IP máy tính trên Windows (tìm dòng IPv4)
ipconfig
```
