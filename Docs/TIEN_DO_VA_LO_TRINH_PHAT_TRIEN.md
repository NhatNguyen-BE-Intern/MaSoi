# BÁO CÁO TIẾN ĐỘ DỰ ÁN & LỘ TRÌNH PHÁT TRIỂN (PROJECT ROADMAP)
> **Dự án:** Ma Sói Monorepo (Backend Node.js/Socket.IO, Frontend Next.js, Mobile React Native Expo)  
> **Ngày cập nhật:** 23/10/2026  
> **Mục tiêu:** Nâng cấp từ *Trợ lý Quản trò ngoài đời (Offline Companion)* lên hệ thống *Hỗ trợ Song Song 2 Chế Độ (Offline & Online Remote)* với Game Engine tự động hóa chuẩn thi đấu.  
> **Tài liệu liên quan:** [NGHIEP_VU_GAME_CHI_TIET.md](file:///e:/Masoi/MaSoi/Docs/NGHIEP_VU_GAME_CHI_TIET.md) | [KE_HOACH_THUC_THI_CHI_TIET.md](file:///e:/Masoi/MaSoi/Docs/KE_HOACH_THUC_THI_CHI_TIET.md)

---

## 1. TỔNG QUAN TIẾN ĐỘ TỔNG THỂ

```
[██████████████████████████████] 100% HOÀN THÀNH TOÀN DỰ ÁN
```
* **Chế độ 1: Trợ lý Quản trò Ngoài Đời (Offline Companion):** `100% Hoàn thành` (Đã chạy ổn định trên Web & Mobile).
* **Chế độ 2: Chơi Online Tự Động Từ Xa (Online Automated Remote):** `100% Hoàn thành` (Đã xong toàn diện cả 5 Sprint: Sảnh Online, Ghép Nhanh, Bàn Tròn Đánh Số Ghế, Ready Check, Host Migration, Khung Chat 4 Kênh, Chat Nhanh, Night Engine, Night Action Sheet, Chu Trình Ban Ngày Tự Động, Cáo Phó, Bầu Trưởng Làng, Bỏ Phiếu 2 Vòng Tie-breaker, Bục Biện Hộ Spotlight, Phán Quyết Treo Cổ, Hồi Kết 1v1 Climax, Âm Thanh Đồng Bộ, Bảng Tổng Kết Scoreboard Toàn Làng & Giữ Phòng Chơi Lại).

---

## 2. NHỮNG TÍNH NĂNG ĐÃ LÀM XONG 100% (COMPLETED)

### 🧱 Hệ thống Nền Tảng (Core & Infrastructure)
- [x] **Monorepo Architecture:** Cấu trúc 3 thư mục `backend`, `frontend`, `mobile` gọn gàng, độc lập.
- [x] **Cơ sở dữ liệu MongoDB Atlas:** Kết nối trực tuyến ổn định, đã có sẵn dữ liệu 34 thẻ bài.
- [x] **Hệ thống Tài khoản & Xác thực:**
  - [x] Đăng ký, Đăng nhập bảo mật với mã hóa `bcryptjs`.
  - [x] Đặt tên nhân vật duy nhất (hỗ trợ tiếng Việt có dấu, chống trùng lặp hoa/thường).
  - [x] Cấp `sessionToken` bảo vệ phiên làm việc, chống mạo danh và chống soi bài Quản trò.
- [x] **Mạng lưới Bạn Bè (Social System):**
  - [x] Tìm kiếm người chơi theo tên nhân vật.
  - [x] Gửi lời mời kết bạn 2 chiều, lưu vào Database.
  - [x] Modal danh sách bạn bè trực quan trên cả Web và Mobile.
- [x] **Từ điển 34 Lá Bài (Card Dictionary):**
  - [x] Bộ tranh minh họa Gothic Tarot độ phân giải cao cho từng vai.
  - [x] Lọc theo phe phái (Sói, Dân làng, Trung lập).
  - [x] Xem chi tiết kỹ năng và luật chơi của từng lá.

---

### 🃏 Chế độ Ngoài Đời (Offline Companion Mode) — ĐÃ XONG 100%
- [x] **Tạo & Vào phòng bằng mã 4 số:**
  - [x] Sinh mã phòng ngẫu nhiên từ 1000 đến 9999.
  - [x] Đồng bộ danh sách người chơi trong phòng thời gian thực qua Socket.IO.
- [x] **Chia bài ngẫu nhiên & Quản trò:**
  - [x] Hỗ trợ chọn Quản trò (Chủ phòng làm Quản trò / Chọn 1 người bất kỳ / Chọn ngẫu nhiên / Không có Quản trò).
  - [x] Người chơi nhận thẻ bài 3D có hiệu ứng lật bài (Card Flip 3D) bảo mật.
  - [x] Tùy chọn cân bằng bài tự động hoặc tự chọn bộ bài theo ý thích (Custom Deck).
- [x] **Bảng Điều Khiển Quản Trò (Master Dashboard):**
  - [x] Hiển thị danh tính toàn bộ người chơi trong phòng (Cheat Sheet).
  - [x] Tự động sinh Kịch bản gọi đêm (Night Order) theo đúng các vai có trong ván.
  - [x] Nút đánh dấu Sống / Chết 1-chạm cho từng người chơi.
  - [x] Đồng bộ trạng thái tức thì về máy của người chơi (kèm hiệu ứng tử nạn / hồi sinh).
- [x] **Hiệu Ứng Âm Thanh Nhập Vai (Soundboard):**
  - [x] Phát tiếng Sói Hú Đêm, Chuông Đêm, Tiếng Bình Minh đồng bộ tới toàn bộ thiết bị trong phòng.
  - [x] Hỗ trợ Chủ phòng phát âm thanh khi chơi không có Quản trò riêng.
- [x] **Đồng Hồ Đếm Ngược Thảo Luận (Discussion Timer):**
  - [x] Đồng bộ đếm ngược 60s, 120s hoặc tùy chỉnh cho toàn phòng.
  - [x] Báo chuông / rung thiết bị khi hết giờ.
- [x] **Tự Động Tính Toán Thắng / Thua (Win Condition):**
  - [x] Server tự động kiểm tra số lượng Sói vs Dân để thông báo kết quả.
  - [x] Hiển thị Modal chiến thắng kèm hiệu ứng pháo hoa (Web) và rung haptic (Mobile).
- [x] **Độ Ổn Định & Khôi Phục Kết Nối (Resilience):**
  - [x] Grace Period 8s khi reload (F5) phòng chờ và 15s cho Quản trò khi rớt mạng.
  - [x] Tự động dọn dẹp RAM (`clearTimeout`) khi phòng giải tán, không rò rỉ bộ nhớ.

---

## 3. NHỮNG TÍNH NĂNG CẦN LÀM ĐỂ HOÀN THIỆN CHƠI ONLINE (TO-DO & ROADMAP)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LỘ TRÌNH 5 GIAI ĐOẠN                            │
│                                                                        │
│  [Giai đoạn 1] Cài Đặt Phòng, Ghép Nhanh & 2 Chế Độ Chọn Bài          │
│       │                                                                │
│  [Giai đoạn 2] Khung Chat 4 Kênh, Chat Nhanh & Chống Gian Lận         │
│       │                                                                │
│  [Giai đoạn 3] Máy Trạng Thái Tự Động Pha Đêm (Night Engine)           │
│       │                                                                │
│  [Giai đoạn 4] Quy Trình Ban Ngày (Bầu Cử, Phiếu Trắng, Biện Hộ)       │
│       │                                                                │
│  [Giai đoạn 5] Âm Thanh Tự Động, Hồi Kết 1v1, Phạt AFK & Chơi Lại     │
│       └────────────────────────────────────────────────────────────────┘
```

---

### GIAI ĐOẠN 1: Màn Hình Chọn Chế Độ Sau Đăng Nhập & Cài Đặt Phòng Online — ĐÃ XONG 100%
- [x] **1.1. Màn Hình Chọn Chế Độ (Mode Selection Portal) ngay sau khi Đăng nhập:**
  - [x] Nút 1: `🃏 Chơi Ngoài Đời (Offline Companion)` ➡️ Điều hướng vào thẳng toàn bộ giao diện hiện tại đã làm.
  - [x] Nút 2: `🌐 Chơi Online (Online Remote)` ➡️ Điều hướng vào giao diện Sảnh game Online mới.
  - [x] Nút `[Đổi Chế Độ]` trên Header/Navbar để người chơi có thể đổi lại bất cứ lúc nào ở Sảnh.
  - [x] Cơ chế Session Persistence: F5 hoặc rớt mạng khi đang trong trận tự động đưa lại đúng ván đấu.
- [x] **1.2. Phân loại Phòng Công Khai & Riêng Tư (Sảnh Online):**
  - [x] Tùy chọn: `🌐 Public (Công khai)` hoặc `🔒 Private (Riêng tư - có mã PIN/Mật khẩu)`.
- [x] **1.3. Nút "⚡ Ghép Trận Nhanh" (Smart Quick Match):**
  - [x] Socket event `quick_match`: Tự động quét và đưa người chơi vào phòng Public đang có số người đông nhất (Greedy Fill).
  - [x] Fallback: Nếu không có phòng, tự động tạo phòng mới làm Host.
- [x] **1.4. Thiết Lập Bộ Bài & Tùy Chọn Phòng Cho Host:**
  - [x] `🤖 Chế độ Máy Tự Chọn (Auto-Select)`: Tự động cân bằng tỷ lệ vàng theo số lượng người trong phòng.
  - [x] `🎴 Chế độ Quản Trò Tự Chọn (Manual Custom Deck)`: Cho phép tick chọn từng lá trong 34 lá (tự động cộng 2 lá nếu có Kẻ Trộm).
  - [x] `⚙️ Chế độ Hiển Thị Bài Khi Chết`: Lựa chọn *Công khai bài khi chết (Open Role)* hoặc *Giấu bài (Hidden Role)*.
- [x] **1.5. Hệ Thống Đánh Số Ghế (#1 đến #N) & Ready Check:**
  - [x] Cấp số ghế cố định quanh bàn tròn cho từng người chơi.
  - [x] Trạng thái `isReady` cho từng thành viên. Khóa nút Start, chỉ cho Host bấm bắt đầu khi 100% người chơi đã sẵn sàng.
  - [x] Ràng buộc: Tối thiểu 5 người, tối đa 18 người; Tối thiểu 1 Sói, Sói < 50%.
  - [x] Cơ chế Host Migration: Tự động chuyển quyền Host cho người có ghế nhỏ nhất tiếp theo khi Host rời phòng.

---

### GIAI ĐOẠN 2: Khung Chat Thời Gian Thực 4 Kênh & Chống Gian Lận — ĐÃ XONG 100%
- [x] **2.1. Backend Socket 4 Chat Channels:**
  - [x] Kênh `TOWN_CHAT`: Mở ban ngày cho người sống. Ban đêm tự động mute toàn bộ.
  - [x] Kênh `WOLF_CHAT`: Chỉ mở ban đêm cho phe Ma Sói.
  - [x] Kênh `LOVERS_CHAT`: Kênh riêng mở liên tục cả ngày lẫn đêm cho 2 người trong Cặp Đôi (Lovers).
  - [x] Kênh `GHOST_CHAT`: Dành riêng cho người đã chết và khán giả.
- [x] **2.2. Giao diện Chat & Chat Nhanh (Quick Chat Presets):**
  - [x] Tab Chat thu nhỏ / mở rộng mượt mà, không che khuất màn hình thẻ bài.
  - [x] Hàng phím Chat Nhanh 1-chạm (*Tôi là Dân*, *Nghi ngờ người số [Ghế X]*, *Bỏ phiếu trắng*,...).
  - [x] Cooldown chống spam 1.5s/tin.
- [x] **2.3. Chống Lộ Bài (Anti-Metagaming):**
  - [x] Người chết trong `GHOST_CHAT` tuyệt đối không nhìn thấy thân phận của người còn sống cho đến khi ván đấu kết thúc hoàn toàn.

---

### GIAI ĐOẠN 3: Máy Trạng Thái Pha Đêm Tự Động (Night Engine) — ĐÃ XONG 100%
- [x] **3.1. Game State Machine trên Backend (`nightEngine.js`):**
  - [x] Quản lý các phase tuần tự: `NIGHT_SETUP` (Cupid ghép đôi) ➡️ `NIGHT_DEFENSE` (Bảo vệ che chắn, không chọn cùng 1 người 2 đêm liên tiếp) ➡️ `NIGHT_ATTACK` (Bầy Sói vote cắn con mồi) ➡️ `NIGHT_INFO` (Tiên Tri soi phe Sói/Dân) ➡️ `NIGHT_WITCH` (Phù Thủy bình Cứu / Độc).
  - [x] Sói trong Cặp Đôi (Lovers) bị cấm vote cắn người yêu của mình.
  - [x] Xử lý Sói hòa phiếu cắn: Tự động gia hạn 5s kèm cảnh báo *"Sói hãy đồng nhất mục tiêu!"*; nếu sau 5s vẫn hòa thì Sói mất lượt cắn đêm đó.
  - [x] Phù Thủy vẫn thấy thông báo nạn nhân bị Sói cắn nếu còn bình cứu (kể cả khi đã được Bảo Vệ che chắn).
  - [x] Bộ đếm giờ tự động đếm ngược và chuyển phase khi hết giờ (AFK/disconnect tự động skip ngay mà không làm đơ phòng).
  - [x] Cơ chế `Fake Delay` (5s - 8s) và `Fake Phase` (6s - 8s khi bật Giấu Bài kể cả khi vai trò đã chết) chống việc dân làng đếm giây đoán vai trò còn sống hay chết.
  - [x] Nút `Xong lượt / Đi ngủ sớm` để chuyển phase ngay lập tức nếu người chơi thao tác xong.
- [x] **3.2. Giao diện Hành Động Ban Đêm (Night Action Sheet):**
  - [x] Màn hình phủ tối u ám với hiệu ứng sương mù, trăng sao và đồng hồ đếm ngược.
  - [x] Khi đến lượt: Màn hình sáng lên với danh sách người chơi còn sống dạng lưới kèm số ghế.
  - [x] Giao diện Vote cắn của Bầy Sói (hiển thị móng vuốt và số phiếu của đồng bọn theo thời gian thực).
  - [x] Giao diện Soi bài của Tiên Tri (lật bài xem phe Sói / phe Dân).
  - [x] Giao diện Phù Thủy (thấy nạn nhân bị cắn; 2 nút Dùng Bình Cứu / Dùng Bình Độc).

---

### GIAI ĐOẠN 4: Quy Trình Ban Ngày Tự Động (Day Lifecycle) — ĐÃ XONG 100%
- [x] **4.1. Giai đoạn Bình Minh & Cáo Phó (10s):**
  - [x] Chuông sáng reo, hiển thị popup danh sách nạn nhân tử nạn đêm qua (lật bài hoặc giấu bài theo cài đặt phòng).
  - [x] Hàng đợi tử nạn `deathQueue` (FIFO): Kích hoạt 15s nổ súng nếu Thợ Săn tử nạn (chỉ nhắm vào người còn sống; vô hiệu hóa nếu chết do độc Phù Thủy) ➡️ Phân giải Cặp Đôi tự sát ➡️ Kẻ Báo Thù kéo theo mục tiêu ➡️ Sau đó mới xét Win Condition.
- [x] **4.2. Bầu Cử Trưởng Làng (Chỉ Ngày 1 - 30s):**
  - [x] Bỏ phiếu bầu Trưởng Làng (phiếu vote x2). Gắn huy hiệu 🌟 Trưởng Làng lên avatar.
  - [x] Xử lý hòa phiếu bầu Trưởng Làng: Nếu từ 2 người bằng phiếu cao nhất hoặc không ai đạt đa số ➡️ Ngày 1 không ai giữ huy hiệu; sang Ngày 2 mở lại phiên bầu Trưởng Làng.
  - [x] Di chúc kế vị: Trưởng Làng chết có 10s để truyền lại huy hiệu (AFK quá 10s ➡️ Server tự động chuyển ngẫu nhiên cho người sống).
- [x] **4.3. Biểu Quyết Treo Cổ, Biện Hộ & Bỏ Phiếu Trắng (2 Vòng):**
  - [x] Vòng 1: Bỏ phiếu đồng thời chỉ định nghi phạm (30s) có nút `[Bỏ Phiếu Trắng]` (quá giờ tự động tính là Phiếu Trắng).
  - [x] Xử lý hòa phiếu chỉ định: Nếu có $\ge 2$ người cùng số phiếu cao nhất ➡️ Kích hoạt Vòng 2 Hiệp Phụ (Tie-breaker 15s) giữa các nghi phạm đó. Nếu hết Vòng 2 vẫn tiếp tục hòa phiếu hoặc Phiếu Trắng đa số ➡️ Tha bổng cả làng, kết thúc ngày, trời tối ngay lập tức.
  - [x] Nếu phân định được 1 người duy nhất bị vote cao nhất: 
    - [x] 20s Biện Hộ (chỉ nghi phạm được quyền chat trên Town Chat kèm huy hiệu 🎤 Spotlight, cả làng bị mute).
    - [x] 15s Phán Quyết (`[Có Tội 💀]` vs `[Vô Tội ✨]`): Nghi phạm bị KHÓA vote không được tự vote; Phiếu Trưởng Làng x2. Có Tội > Vô Tội ➡️ Treo cổ; Vô Tội $\ge$ Có Tội ➡️ Tha bổng.

---

### GIAI ĐOẠN 5: Âm Thanh Tự Động, Hồi Kết 1v1, Phạt AFK & Tính Năng Chơi Lại — ĐÃ XONG 100%
- [x] **5.1. Hệ Thống Âm Thanh Tự Động & Điều Khiển Âm Lượng:**
  - [x] Server phát âm thanh đồng bộ: Sói hú đêm, chuông bình minh, treo cổ, súng nổ, đồng hồ đếm ngược.
  - [x] Nút Mute / Volume trên Header của Web và Mobile (lưu `localStorage: masoi_sound_muted`).
- [x] **5.2. Ma Trận Thắng / Thua & Hồi Kết Tay Đôi (1v1 Climax):**
  - [x] Xử lý 1 Sói vs 1 Dân ➡️ Sói thắng ngay lập tức.
  - [x] Xử lý 1 Sói vs 1 Thợ Săn ➡️ Thợ Săn nổ súng kết liễu Sói, Hòa cả làng diệt vong.
  - [x] Xử lý 1 Sói vs 1 Tanner ban ngày ➡️ Nếu cùng vote Tanner thì Tanner thắng.
  - [x] Tự động nhận diện chiến thắng: Tanner, Cặp Đôi khác phe sống sót, Sói áp đảo (số Sói $\ge$ số Dân), Dân làng diệt sạch hiểm họa, Hòa diệt vong.
- [x] **5.3. Xử Lý Sự Cố, Timeout AFK & Host Migration:**
  - [x] Grace Period khôi phục kết nối khi rớt mạng / F5.
  - [x] Timeout tự động skip phase khi người chơi AFK, không làm đơ phòng đấu.
  - [x] Cơ chế Host Migration: Tự động chuyển quyền Host cho người còn sống có số ghế nhỏ nhất kế tiếp khi Host rời phòng.
- [x] **5.4. Bảng Tổng Kết & Nút "Chơi Lại / Giữ Phòng" (Play Again):**
  - [x] Lật toàn bộ thẻ bài của tất cả người chơi (`allRoles`) hiển thị trên Modal Kết Thúc.
  - [x] Nút `[🔄 Chơi ván mới / Giữ phòng]` đưa cả phòng về lại Online Room Lobby với `isReady = false` (sẵn sàng ván mới mà không cần tạo lại phòng).
- [x] **5.5. Kiểm Thử Đa Nền Tảng (Cross-Platform E2E Testing):**
  - [x] Toàn bộ code Backend Node.js, Web Frontend Next.js và Mobile App React Native Expo biên dịch hoàn hảo 100% không lỗi.

---

### ĐỢT 2: EXPANSION 1 (SÓI BIẾN THỂ & CHỨC NĂNG TẤN CÔNG) — ĐÃ XONG 100%
- [x] **2.1. Sói Con (Wolf Cub):** Chết kích hoạt bầy Sói cuồng nộ cắn 2 nạn nhân vào đêm kế tiếp (`wolfTarget` và `wolfTarget2`).
- [x] **2.2. Sói Đầu Đàn (Alpha Wolf):** Kỹ năng "Lây Nhiễm" (1 lần/ván): Biến nạn nhân thành Ma Sói (join room chat sói) thay vì tử nạn.
- [x] **2.3. Sói Trắng (White Wolf):** Mỗi 2 đêm (Đêm 2, 4...) thức dậy riêng xé xác 1 con Sói khác; Thắng solo độc tôn khi là kẻ sống sót duy nhất.
- [x] **2.4. Sói Nguyền (Cursed Wolf):** Ban đầu là Dân (soi ra Dân); bị cắn mà không có Bảo Vệ che chở sẽ không chết mà thức tỉnh thành Ma Sói.
- [x] **2.5. Sói Già (Old Wolf):** Miễn nhiễm hoàn toàn với Thuốc Độc của Phù Thủy.
- [x] **2.6. Sói Ẩn (Hidden Wolf):** Che giấu tà khí tuyệt đối, Tiên Tri soi luôn trả về Phe Dân Làng.
- [x] **2.7. Đồng bộ Cross-Platform:** Hoàn tất 100% trên cả Backend Node.js, Web Frontend Next.js và Mobile App React Native Expo.

---

### ĐỢT 3: EXPANSION 2 (TƯƠNG TÁC PHỨC TẠP & PHE THỨ 3 NÂNG CAO) — ĐÃ XONG 100%
- [x] **3.1. Kẻ Trộm (Thief):** Đêm 1 xem 2 lá bài thừa ngoài rìa (`centerCards`) để chọn đổi vai hoặc giữ Dân.
- [x] **3.2. Người Hóa Sói (Doppelganger):** Đêm 1 chọn hình mẫu; khi hình mẫu tử nạn, Doppelganger lập tức thừa kế toàn bộ sức mạnh và vai trò.
- [x] **3.3. Kẻ Đánh Tráo (Troublemaker):** Đêm 1 bí mật hoán đổi vai trò của 2 người chơi khác cho nhau mà họ không biết thân phận mới.
- [x] **3.4. Già Làng (Elder):** Có 2 mạng trước Ma Sói; bị treo cổ hoặc bị đầu độc thì chết ngay và toàn bộ Phe Dân mất hết kỹ năng.
- [x] **3.5. Sát Thủ (Serial Killer):** Mỗi đêm đâm 1 người xuyên khiên Bảo Vệ; thắng solo khi là người sống sót duy nhất.
- [x] **3.6. Bán Sói (Lycan):** Phe Dân nhưng Tiên Tri soi ra Phe Sói.
- [x] **3.7. Đồng bộ Cross-Platform:** Toàn bộ Game Engine và UI trên Web Next.js lẫn Mobile React Native Expo đã sẵn sàng 100%.

---

### ĐỢT 4: EXPANSION 3 (VAI TRÒ PHỤ TRỢ & PHE TRUNG LẬP MỞ RỘNG) — ĐÃ XONG 100%
- [x] **4.1. Cupid Nâng Cao (Dark Cupid / Cupid Bóng Tối):**
  - Đêm 1 se duyên định mệnh 2 người bất kỳ (cho phép tự chọn bản thân).
  - Thuộc Phe Thứ 3: Giành chiến thắng khi Cặp Đôi (hoặc Cặp Đôi + Cupid Bóng Tối) là những người sống sót cuối cùng trên bàn cờ.
- [x] **4.2. Phù Thủy Thao Túng (Manipulator Witch):**
  - Mỗi đêm chọn 1 người sống để khống chế tâm trí; gửi thông báo ma mị kín đáo đến nạn nhân.
  - Ban ngày khi kiểm phiếu biểu quyết (Vòng 1 & Vòng 2 Hiệp Phụ), lá phiếu của con rối bị cưỡng bức tự động chuyển theo mục tiêu mà Phù Thủy Thao Túng bỏ phiếu.
- [x] **4.3. Thầy Bói (Fortune Teller):**
  - Phiên bản thần nhãn cao cấp của Tiên Tri; mỗi đêm soi thấu 1 người và hiển thị thẻ bài chân tướng chi tiết (`roleName`), Phe phái (`team`) và mô tả năng lực (`description`).
- [x] **4.4. Kẻ Phản Bội (Traitor / Tay Trong Của Sói):**
  - Phe Ma Sói nhưng sống trà trộn làm Dân Làng (Tiên Tri soi ra Phe Dân Làng).
  - Đêm 1 nhận thông báo danh tính bí mật của bầy Sói đồng minh.
  - Khi bầy Sói nguyên bản chết hết, Kẻ Phản Bội thức tỉnh thành Ma Sói mới (`Ma Sói (Thức Tỉnh)`), gia nhập kênh chat bầy Sói để tiếp tục cắn người; ván đấu không bị kết thúc sớm!
- [x] **4.5. Đồng bộ Cross-Platform & Kiểm Thử Tự Động:**
  - Hoàn tất Backend (`roles.js`, `socketEvents.js`, `nightEngine.js`, `dayEngine.js`).
  - Cập nhật giao diện Đêm trên Web Next.js (`NightActionSheet.jsx`) và Mobile Expo (`MobileNightActionSheet.js`).
  - Bộ kiểm thử tự động `backend/scripts/test_expansion_3.js` vượt qua 15/15 bài test (100% PASS).

---

### 🧪 KIỂM THỬ TỔNG THỂ VÁN ĐẤU ONLINE (E2E BOT SIMULATION TESTING) — ĐÃ XONG 100%
- [x] **Kịch Bản Giả Lập Ván Đấu Online Tự Động (6 Bot Simulation):**
  - [x] Tạo phòng trực tuyến `#XXXX` và 6 Bot Socket.IO kết nối thời gian thực.
  - [x] Bàn tròn ghế ngồi, tự động kích hoạt **Ready Check 100%** và Host bắt đầu ván.
  - [x] Hệ thống chia thẻ bài bí mật theo thuật toán xáo bài Fisher-Yates.
  - [x] **Đêm 1 (`NIGHT_START` ➡️ `NIGHT_GUARD` ➡️ `NIGHT_WOLF` ➡️ `NIGHT_SEER` ➡️ `NIGHT_END`)**: Bảo Vệ giương khiên, Ma Sói săn mồi, Tiên Tri soi bài chuẩn xác.
  - [x] **Bình Minh Ngày 1 (`DAY_ANNOUNCE`)**: Cáo phó danh sách tử nạn, cập nhật trạng thái sống/chết tức thì.
  - [x] **Bầu Cử Trưởng Làng (`DAY_MAYOR_ELECTION`)**: Bỏ phiếu kín, Trưởng Làng đắc cử nhận quyền hạn phiếu biểu quyết x2.
  - [x] **Thảo Luận Ban Ngày (`DAY_DISCUSS`)**: 90s tranh luận, chat tự do trên kênh thị trấn.
  - [x] **Bỏ Phiếu Chỉ Định Nghi Phạm (`DAY_VOTE`) & Hiệp Phụ (`DAY_VOTE_TIE_BREAKER`)**: Xử lý hòa phiếu và chốt nghi phạm lên bục xét xử.
  - [x] **Bục Biện Hộ Spotlight (`DAY_DEFENSE`) & Phán Quyết Treo Cổ (`DAY_JUDGEMENT`)**: Biểu quyết `GUILTY` (Có tội) áp đảo, kết án treo cổ nghi phạm.
  - [x] **Di Chúc Kế Vị Trưởng Làng (`MAYOR_SUCCESSION`)**: Khi Trưởng Làng tử nạn, chỉ định người sống tiếp theo kế thừa huy hiệu.
  - [x] **Đêm 2 & Ngày 2 Tiếp Nối**: Chu trình Đêm/Ngày tuần hoàn mượt mà không bị ngắt quãng.
  - [x] **Điều Kiện Thắng (`checkOnlineWinCondition` ➡️ `GAME_OVER`)**: Kích hoạt Game Over, vinh danh phe thắng cuộc và lật mở 100% thân phận tất cả người chơi trong phòng.

---

### ĐỢT 5: EXPANSION 4 (BẢO VỆ THẦN THÁNH, PHẢN KÍCH & PHÓNG HỎA) — ĐÃ XONG 100%
- [x] **5.1. Kẻ Độc Hành (Arsonist - Kẻ Phóng Hỏa):**
  - Phe Thứ 3 (Solo): Mỗi đêm chọn tẩm xăng 1-2 người (`ARSONIST_DOSE`) hoặc bấm Châm Lửa (`ARSONIST_IGNITE`).
  - Khi châm lửa: Thiêu rụi toàn bộ những ai đã dính xăng còn sống (xuyên khiên Bảo Vệ, kể cả Già Làng hay Sói Già).
  - Điều kiện thắng: Giành chiến thắng độc tôn tuyệt đối khi là kẻ duy nhất sống sót trong ngôi làng.
- [x] **5.2. Thầy Tu (Priest - Ban Phước & Hóa Giải):**
  - Phe Dân Làng: Mỗi đêm ban phước lành cho 1 người sống (`PRIEST_BLESS`).
  - Năng lực thần thánh: Giải trừ hoàn toàn dầu xăng của Kẻ Độc Hành, hóa giải lây nhiễm của Sói Đầu Đàn, và cứu sống nạn nhân nếu bị Bầy Sói cắn đêm đó.
- [x] **5.3. Hiệp Sĩ Ánh Sáng (Knight - Phản Đòn Kiếm Khí):**
  - Phe Dân Làng: Chiến binh quả cảm của ngôi làng.
  - Khi bị Ma Sói cắn tử nạn trong đêm, kiếm khí của Hiệp Sĩ vung lên chém chết con Ma Sói có khoảng cách số ghế gần nhất với mình theo vòng tròn ghế ngồi (`#1..#N`).
- [x] **5.4. Thẩm Phán (Judge - Phủ Quyết Treo Cổ):**
  - Phe Dân Làng: Một lần duy nhất trong ván đấu (`judgePardonUsed`), có quyền gõ búa Phủ Quyết (`JUDGE_PARDON`) để tha bổng ngay lập tức nghi phạm trước giá treo cổ ban ngày.
  - Sau khi gõ búa: Nghi phạm được giải cứu lập tức, toàn phòng nhận thông báo phán quyết và cả làng chuyển sang Đêm tiếp theo.
- [x] **5.5. Cô Bé (Little Girl - Nhìn Trộm Kênh Chat Sói):**
  - Phe Dân Làng: Ban đêm được tự động join vào `room_${roomCode}_wolf` để lén nhìn trộm toàn bộ tin nhắn bàn luận săn mồi của bầy Ma Sói theo thời gian thực nhằm thu thập manh mối cho làng.
- [x] **5.6. Đồng bộ Cross-Platform & Kiểm Thử Tự Động:**
  - Hoàn tất Backend (`roles.js`, `socketEvents.js`, `nightEngine.js`, `dayEngine.js`).
  - Cập nhật giao diện Đêm và Ngày trên Web Next.js (`NightActionSheet.jsx`, `DayVotingPanel.jsx`) và Mobile Expo (`MobileNightActionSheet.js`, `MobileDayVotingPanel.js`).
  - Bộ kiểm thử tự động `backend/scripts/test_expansion_4.js` đạt 18/18 bài test (100% PASS).

---

### ĐỢT 6: EXPANSION 5 (NHẬN DIỆN TIÊN TRI, KẾ THỪA & SĂN BÓNG ĐÊM — HOÀN THIỆN ĐỦ 34 LÁ BÀI 100%) — ĐÃ XONG 100%
- [x] **6.1. Người Quan Sát (Beholder / Kẻ Nhìn Trộm):**
  - Phe Dân Làng: Đêm 1 thức dậy được Thần linh mách bảo, hiển thị chính xác tên nhân vật và số ghế của Tiên Tri thật (`realSeer`) để hỗ trợ, tin tưởng và bảo vệ Tiên Tri.
- [x] **6.2. Tiên Tri Tập Sự (Apprentice Seer):**
  - Phe Dân Làng: Ban đầu ngủ say như Dân Làng. Khi Tiên Tri chính tử nạn, Tiên Tri Tập Sự lập tức kế thừa quả cầu pha lê (`apprenticeAwakened = true`), nâng cấp thành Tiên Tri mới của làng và bắt đầu soi bài từ đêm tiếp theo.
- [x] **6.3. Kẻ Say (Drunk):**
  - Phe Dân Làng: Tưởng mình là Dân Làng bình thường cho đến Đêm 3 mới tỉnh rượu (`drunkSobered = true`). Hệ thống tự động lật mở và cập nhật vai trò thật sự bí mật, tham gia bầy Sói nếu vai thật là Ma Sói.
- [x] **6.4. Thợ Săn Bóng Đêm (Shadow Hunter):**
  - Phe Dân Làng: Ban đêm sở hữu 1 phát đạn đặc biệt (`SHADOW_HUNTER_SHOOT`). Phát đạn chỉ tiêu diệt được những kẻ thuộc Phe Thứ 3 / Phe Trung Lập (Sát Thủ, Kẻ Độc Hành, Kẻ Chán Đời, Dark Cupid, Manipulator Witch,...); nếu bắn trúng Dân Làng hoặc Ma Sói thì phát đạn trượt vô hại.
- [x] **6.5. Hoàn Thiện Trọn Vẹn 34 Thẻ Bài & Dọn Dẹp Duplicate:**
  - Hợp nhất và dọn dẹp khai báo trùng lặp `ARSONIST` trong `backend/src/constants/roles.js`.
  - Hệ thống đạt chuẩn chính thức **đủ 34 lá bài 100%** theo đúng tài liệu đặc tả [NGHIEP_VU_GAME_CHI_TIET.md](file:///e:/Masoi/MaSoi/Docs/NGHIEP_VU_GAME_CHI_TIET.md).
- [x] **6.6. Đồng bộ Cross-Platform & Kiểm Thử Tự Động:**
  - Hoàn tất Backend (`roles.js`, `socketEvents.js`, `nightEngine.js`, `dayEngine.js`).
  - Cập nhật giao diện Đêm trên Web Next.js (`NightActionSheet.jsx`) và Mobile Expo (`MobileNightActionSheet.js`).
  - Bộ kiểm thử tự động `backend/scripts/test_expansion_5.js` đạt 22/22 bài test (100% PASS).
  - Toàn bộ 3 bộ test suite (`test_expansion_3.js`, `test_expansion_4.js`, `test_expansion_5.js`) đạt 55/55 bài test (100% PASS).


