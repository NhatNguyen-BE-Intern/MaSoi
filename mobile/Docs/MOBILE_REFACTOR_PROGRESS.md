# 🐺 NHẬT KÝ VÀ TIẾN ĐỘ REFACTOR GIAO DIỆN MOBILE: DARK GOTHIC & HUYẾT NGUYỆT

---

> [!IMPORTANT]
> **DÀNH CHO CÁC PHIÊN CHAT AI MỚI (AI INSTRUCTIONS):**
> 1. Đọc file này đầu tiên để nắm bắt **Trạng thái hiện tại (Current Step)** trong mục `3. TIẾN ĐỘ THỰC TẾ (PROGRESS TRACKER)`.
> 2. Phong cách mỹ thuật chủ đạo được người dùng phê duyệt: **Dark Gothic & Huyết Nguyệt (Blood Moon Werewolf RPG Boardgame)**.
> 3. Tuyệt đối **không dùng icon vector phẳng đại trà** cho lá bài mà phải dùng bộ tranh Tarot độ phân giải cao trong `src/constants/cardAssets.js`.
> 4. Luôn đảm bảo tương thích 100% với cả TypeScript (`theme.ts`) và JavaScript (`theme.js`), không bỏ quên token màu.
> 5. Cập nhật lại file này sau mỗi màn hình hoặc tính năng hoàn thành.

---

## 1. MỤC TIÊU DỰ ÁN REFACTOR
- **Vấn đề cần giải quyết:** Xóa bỏ hoàn toàn giao diện cũ phẳng, đại trà, thiếu sự khác biệt như một ứng dụng văn phòng/CRUD.
- **Tầm nhìn mỹ thuật:** Biến toàn bộ app thành một tựa **Boardgame Nhập Vai Huyền Bí** chuẩn chỉnh với:
  - Tông màu u tối huyền bí: Đá đen Obsidian (`#07050A`), Đỏ Huyết Nguyệt (`#C41E3A`, `#9E1B26`), Vàng Kim Cổ Điển (`#D4AF37`).
  - Tranh Tarot nghệ thuật độc quyền 3:4 cho từng lá bài: Ma Sói, Tiên Tri, Phù Thủy, Bảo Vệ, Thợ Săn, Dân Làng, Quản Trò, Mặt sau bài.
  - Hoạt ảnh 3D chân thực: Lật bài 3D (`perspective` 1200 + `rotateY`), viền phát sáng nhịp thở (Pulsing Glow).
  - Phản hồi xúc giác đa tầng (`expo-haptics`).

---

## 2. LỘ TRÌNH REFACTOR TỪNG BƯỚC (ROADMAP)

### 🟢 GIAI ĐOẠN 1: THIẾT KẾ MẪU & BỘ QUY CHUẨN DESIGN SYSTEM
- [x] **Bước 1.1:** Khởi tạo bộ sưu tập tranh bài Gothic Tarot tỷ lệ 3:4 chuẩn trong `mobile/assets/cards/`.
- [x] **Bước 1.2:** Xây dựng module ánh xạ tranh bài tự động `src/constants/cardAssets.js`.
- [x] **Bước 1.3:** Nâng cấp hệ thống Design Tokens (`theme.js`, `theme.ts`, `colors.js`): Bổ sung tokens Huyết Nguyệt, Vàng Cổ, hiệu ứng phát quang Faction Glows.
- [x] **Bước 1.4:** Hoàn thiện màn hình mẫu Thẻ Bài 3D (`PlayerScreen.js`): Lật bài 3D thời gian thực, Haptics, trạng thái Hồn Ma, đồng hồ cát thảo luận và Dev Role Switcher.
- [x] **Bước 1.5:** Tích hợp phím tắt xem mẫu 1-chạm `[ 🃏 Xem Mẫu Thẻ Bài 3D ]` trên TopBar của `App.js`.

---

### 🟡 GIAI ĐOẠN 2: SẢNH CHỜ HOÀNG GIA (LOBBY SCREEN)
- [x] **Bước 2.1:** Thiết kế Thẻ Định Danh Hiệp Sĩ (Noble Crest Card) với avatar vương miện Gothic mạ vàng và danh xưng hiển thị.
- [x] **Bước 2.2:** Cặp Hero Card đá Rune (Rune Monoliths): "Khởi Tạo Bàn Chơi" (ánh lửa huyết nguyệt) & "Tham Gia Bàn Chơi" (phong ấn ma thuật).
- [x] **Bước 2.3:** Bộ nhập mã phòng dạng Khắc Ấn Thạch (Rune Slot Input) gồm 6 ô ký tự độc lập viền vàng phát sáng khi nhập kèm nút dán mã nhanh từ khay nhớ tạm.
- [x] **Bước 2.4:** Thanh phím tắt thư tịch mở nhanh Từ Điển Thần Bài (kèm ảnh thẻ bài mini) và Danh Sách Hảo Hữu.

---

### 🟠 GIAI ĐOẠN 3: PHÒNG CHỜ HỘI ĐỒNG & BỘ BÀI TÙY CHỈNH (ROOM SCREEN)
- [x] **Bước 3.1:** Biển hiệu mã phòng đá Rune với nút 1-chạm sao chép & chia sẻ tin nhắn.
- [x] **Bước 3.2:** Bàn Tiệc Hội Đồng (Council Round Table): Ghế ngồi của từng người chơi quanh bàn tiệc, hiệu ứng úp bài chờ phát thẻ, vương miện Chủ phòng.
- [x] **Bước 3.3:** Bảng cài đặt Quản trò (Host / Người chơi chọn / Không quản trò).
- [x] **Bước 3.4:** Bộ chọn bài tùy chỉnh (Custom Deck Builder): Tranh Tarot thu nhỏ cho từng lá bài kèm nút tăng/giảm số lượng mạ vàng (+ / -).

---

### 🔴 GIAI ĐOẠN 4: DASHBOARD CHIẾN THUẬT QUẢN TRÒ (TACTICAL GM HUD)
- [x] **Bước 4.1:** Thiết kế bảng điều khiển chiến thuật tối giản, cô đọng trên cùng một màn hình (không cần chuyển tab phức tạp).
- [x] **Bước 4.2:** Bảng ma trận nhân mạng (Life & Death Matrix): Nút toggle Sống/Chết 1-chạm viền máu đỏ kèm rung Haptics tức thì và tranh Tarot thu nhỏ của từng người chơi.
- [x] **Bước 4.3:** Thanh tiến trình kịch bản gọi đêm (Night Sequence HUD) với hình đại diện vai trò và lời thoại gợi ý chuẩn.
- [x] **Bước 4.4:** Bàn phím âm thanh chiến thuật (Tactical Soundboard): Tiếng sói hú, chuông ngân, quạ kêu, chiêng báo trời sáng.

---

### 🟣 GIAI ĐOẠN 5: CỔNG LÀNG ĐĂNG NHẬP & MODALS TIỆN ÍCH
- [x] **Bước 5.1:** Giao diện Đăng Nhập / Đăng Ký (AuthScreen) phong cách Giao Ước Máu dưới cổng đá Làng Sói, hiệu ứng nhịp thở viền sói và gradient Huyết Nguyệt.
- [x] **Bước 5.2:** Màn hình Khắc Tên Nhân Vật Lần Đầu như khắc bia đá cổ kèm gợi ý ngẫu nhiên tước hiệu hiệp sĩ.
- [x] **Bước 5.3:** Nâng cấp Từ Điển Thần Bài (`CardDictionaryModal.js`) với chế độ lướt xem tranh Tarot độ nét cao, tab lọc Phe phái phát sáng và luật chơi chi tiết.
- [x] **Bước 5.4:** Nâng cấp Danh Sách Hảo Hữu (`FriendsModal.js`) phong cách Quạ Truyền Tin (Raven Post), huy hiệu ấn tín sáp máu và phản hồi xúc giác Haptics đa tầng.

---

### ⚪ GIAI ĐOẠN 6: ĐỒNG BỘ TOÀN DIỆN & ĐÓNG GÓI SẢN PHẨM (BUILD APK)
- [x] **Bước 6.1:** Tinh gọn TopBar `App.js`: Thiết kế HUD Dark Gothic, huy hiệu Ma Sói Gothic, tích hợp phản hồi Haptics cho tất cả các nút bấm nhanh.
- [x] **Bước 6.2:** Kiểm thử chuyển cảnh 60 FPS mượt mà và kiểm tra toàn diện lỗi TypeScript (`npx tsc --noEmit` đạt 0 lỗi).
- [x] **Bước 6.3:** Chạy `npx expo-doctor` để xác thực toàn vẹn môi trường Expo SDK 52 (21/21 checks passed, 0 issues).
- [x] **Bước 6.4:** Cung cấp cấu hình `eas.json` và hướng dẫn đóng gói APK độc lập bằng EAS Build (`eas build -p android --profile preview`).

---

## 3. TIẾN ĐỘ THỰC TẾ (PROGRESS TRACKER)

### 📍 TRẠNG THÁI HIỆN TẠI (CURRENT STEP):
- **Trạng thái:** 🎉 **HOÀN THÀNH 100% TOÀN BỘ 6 GIAI ĐOẠN REFACTOR DARK GOTHIC & HUYẾT NGUYỆT!**
- **Đã hoàn thành:**
  - ✅ **Giai đoạn 1:** Design System + Bộ 8 tranh Tarot tỷ lệ 3:4 chuẩn + Flagship `PlayerScreen.js` lật bài 3D native 60 FPS.
  - ✅ **Giai đoạn 2:** Sảnh Chờ Hoàng Gia ([LobbyScreen.js](file:///e:/Masoi/MaSoi/mobile/src/screens/LobbyScreen.js)) với 2 khối Monoliths Rune và ô nhập mã Khắc Ấn Thạch 6 ký tự.
  - ✅ **Giai đoạn 3:** Bàn Tròn Hội Đồng ([RoomScreen.js](file:///e:/Masoi/MaSoi/mobile/src/screens/RoomScreen.js)) với ghế ngồi chia bài úp mini và Bộ chọn bài Custom Deck Tarot.
  - ✅ **Giai đoạn 4:** Tactical GM HUD ([ModeratorScreen.js](file:///e:/Masoi/MaSoi/mobile/src/screens/ModeratorScreen.js)) với Ma Trận Nhân Mạng 1-chạm viền máu và Bàn phím âm thanh chiến thuật.
  - ✅ **Giai đoạn 5:** Cổng Làng Giao Ước Máu ([AuthScreen.js](file:///e:/Masoi/MaSoi/mobile/src/screens/AuthScreen.js)), Bảo Tàng Thần Bài Tarot ([CardDictionaryModal.js](file:///e:/Masoi/MaSoi/mobile/src/components/game/CardDictionaryModal.js)), Quạ Truyền Tin & Ấn Tín Sáp Máu ([FriendsModal.js](file:///e:/Masoi/MaSoi/mobile/src/components/game/FriendsModal.js)).
  - ✅ **Giai đoạn 6:** TopBar HUD tích hợp Haptics, cấu hình `eas.json` cho build APK Android, vượt qua 21/21 tiêu chuẩn kiểm thử của `npx expo-doctor` và 0 lỗi TypeScript `npx tsc --noEmit`.

---

## 4. NHẬT KÝ CHI TIẾT CÁC PHIÊN LÀM VIỆC (LOG)

| Ngày / Phiên | Nội dung thực hiện | Trạng thái | Ghi chú & Đúc kết |
| :--- | :--- | :--- | :--- |
| **21/10/2026** | **Khởi tạo định hướng Dark Gothic:** Tạo trọn bộ 8 tranh bài Tarot Gothic độ nét cao (Sói, Tiên Tri, Phù Thủy, Bảo Vệ, Thợ Săn, Dân Làng, Quản Trò, Card Back, Background Lâu Đài Huyết Nguyệt). | ✅ Hoàn thành | Đạt chuẩn mỹ thuật Boardgame cao cấp, đồng bộ phong cách viền khắc đá và hoa hồng cổ. |
| **21/10/2026** | **Thiết kế mẫu `PlayerScreen.js`:** Triển khai lật bài 3D Native bằng Animated spring + perspective 1200, viền thở nhịp Huyết Nguyệt, Haptics và Dev Role Switcher. | ✅ Hoàn thành | Lật bài mượt mà 60 FPS, không dùng thư viện ngoài gây phình app. |
| **21/10/2026** | **Fix Bug Đồng Bộ TypeScript:** Khắc phục lỗi `Cannot read property 'bg' of undefined` do xung đột ưu tiên giữa `theme.ts` và `theme.js`. Bọc Safe Fallbacks cho `CustomButton`. | ✅ Hoàn thành | Metro compile `StatusCode: 200 OK`, `npx tsc --noEmit` 0 lỗi. |
| **21/10/2026** | **Thiết lập tài liệu tiến độ:** Tạo file `mobile/Docs/MOBILE_REFACTOR_PROGRESS.md` làm kim chỉ nam xuyên suốt quá trình refactor. | ✅ Hoàn thành | Quản lý lộ trình 6 giai đoạn rõ ràng. |
| **21/10/2026** | **Hoàn thành Giai đoạn 2 (`LobbyScreen.js`):** Biến đổi hoàn toàn Sảnh Chờ thành sảnh đá Gothic huyền bí: Thẻ Noble Crest vương miện mạ vàng, 2 khối Monoliths Huyết Nguyệt, ô nhập mã Khắc Ấn Thạch 6 ký tự kèm nút dán mã nhanh. | ✅ Hoàn thành | Tự động Fast Refresh mượt mà trên Expo Go! |
| **21/10/2026** | **Hoàn thành Giai đoạn 3 (`RoomScreen.js`):** Xây dựng Bàn Tròn Hội Đồng với ghế ngồi xếp chỗ và bài úp mini; Khu vực Chỉ Huy Chủ Bàn với Bộ Chọn Bài Custom Deck hiển thị đầy đủ tranh Tarot thu nhỏ và bộ đếm vàng. | ✅ Hoàn thành | Trải nghiệm phòng chờ như một bàn tiệc hội đồng Ma Sói thực thụ! |
| **21/10/2026** | **Hoàn thành Giai đoạn 4 (`ModeratorScreen.js`):** Thiết kế Tactical GM HUD: Ma trận nhân mạng sống/chết 1-chạm viền máu kèm ảnh Tarot người chơi, kịch bản đêm hiển thị lời thoại to rõ, soundboard rung xúc giác, bộ đếm thảo luận nhấp nháy đỏ. | ✅ Hoàn thành | Quản trò thao tác 1 tay trong bóng tối cực kỳ dễ dàng và chuẩn xác! |
| **21/10/2026** | **Hoàn thành Giai đoạn 5 (AuthScreen, CardDictionary, FriendsModal):** Phong cách Giao Ước Máu, Bảo tàng Thần bài Tarot độ nét cao, Quạ Truyền Tin & Ấn Tín Sáp Máu. Tinh chỉnh TopBar HUD với phản hồi xúc giác Haptics. | ✅ Hoàn thành | Toàn bộ ứng dụng đã đạt 100% diện mạo Dark Gothic & Huyết Nguyệt đồng nhất! |
| **21/10/2026** | **Tinh giản ngôn ngữ & Tối ưu khả năng đọc (UX / Terminology Polish):** Refactor toàn bộ từ ngữ kiếm hiệp/huyền bí rườm rà sang tiếng Việt hiện đại, trực quan, dễ hiểu cho người mới chơi trên tất cả các màn hình (`RoomScreen`, `PlayerScreen`, `ModeratorScreen`, `LobbyScreen`, `AuthScreen`, `CardDictionaryModal`, `FriendsModal`, `App.js`). Giảm độ chói/glow gây rối mắt, tăng tương phản chữ, ẩn panel dev test khi thi đấu thật. | ✅ Hoàn thành | Ứng dụng giữ trọn vẻ đẹp Dark Gothic cao cấp nhưng cực kỳ dễ tiếp cận và thân thiện với người dùng mới. |




---

## 5. BẢNG MÃ MÀU & THÔNG SỐ CHUẨN (DESIGN TOKENS CHEATSHEET)

| Tên Token | Mã Màu Hex / Cấu hình | Mục đích sử dụng |
| :--- | :--- | :--- |
| **Obsidian Deep** | `#07050A` | Nền chính của toàn bộ app |
| **Obsidian Surface** | `#150F1E` / `rgba(21, 15, 30, 0.88)` | Bề mặt các card, panel điều khiển |
| **Gothic Border** | `#3D2B52` (Đơn) / `#583D75` (Đôi) | Đường viền phiến đá gothic |
| **Antique Gold** | `#D4AF37` / `#F3E5AB` | Viền kim loại hoàng kim, chữ tiêu đề, phím bấm chính |
| **Blood Ruby** | `#C41E3A` / `#9E1B26` | Ánh sáng trăng máu, phe Ma Sói, nút hành động nguy hiểm |
| **Parchment Text** | `#F5ECD7` | Chữ giấy da cổ sáng rõ, dễ đọc trong đêm |
| **Seer Starlight** | `#38BDF8` | Ánh sáng lam ngọc quả cầu Tiên Tri |
| **Witch Amethyst** | `#A855F7` | Ánh tím độc dược ma thuật Phù Thủy |
| **Guard Emerald** | `#34D399` | Ánh ngọc lục bảo khiên thánh Hiệp Sĩ Bảo Vệ |
| **Hunter Amber** | `#FB923C` | Ánh lửa hổ phách mũi tên Thợ Săn |
| **Card Aspect** | `2:3` hoặc `CARD_WIDTH * 1.48` | Kích thước chuẩn thẻ bài Tarot quốc tế |
| **Card Radius** | `14pt` | Bo góc thẻ bài Tarot cao cấp |
| **3D Perspective** | `1200` | Chiều sâu góc nhìn lật thẻ bài chân thực |
