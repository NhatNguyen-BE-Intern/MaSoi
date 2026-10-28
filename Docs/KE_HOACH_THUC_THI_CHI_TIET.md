# KẾ HOẠCH THỰC THI CHI TIẾT (TECHNICAL IMPLEMENTATION ACTION PLAN)
> **Dự án:** Ma Sói Monorepo (Node.js/Socket.IO, Next.js, React Native Expo)  
> **Tài liệu tham chiếu:** [NGHIEP_VU_GAME_CHI_TIET.md](file:///e:/Masoi/MaSoi/Docs/NGHIEP_VU_GAME_CHI_TIET.md) & [TIEN_DO_VA_LO_TRINH_PHAT_TRIEN.md](file:///e:/Masoi/MaSoi/Docs/TIEN_DO_VA_LO_TRINH_PHAT_TRIEN.md)  
> **Mục tiêu:** Xây dựng hoàn chỉnh Game Engine Chơi Online Tự Động Từ Xa (Online Automated Remote Mode) theo lộ trình 5 Sprint kỹ thuật.

---

## I. NGUYÊN TẮC KIẾN TRÚC & PHÂN KỲ PHÁT TRIỂN

1. **Cô lập kiến trúc 2 chế độ (Dual-Mode Separation):**
   * Giữ nguyên 100% logic chế độ Chơi Ngoài Đời (Offline Companion) đang chạy ổn định.
   * Chế độ Chơi Online sẽ được tổ chức trong module riêng: `backend/src/socket/online/` và các component frontend/mobile chuyên biệt.
2. **Chiến lược phân kỳ bộ bài (3 Đợt):**
   * **Đợt 1 (Core Deck - 7 vai kinh điển):** Dân Làng, Ma Sói Thường, Tiên Tri, Bảo Vệ, Phù Thủy, Thợ Săn, Trưởng Làng, Kẻ Chán Đời / Cupid. 👉 *Đạt chuẩn MVP chạy mượt mà toàn bộ vòng lặp Ngày/Đêm.*
   * **Đợt 2 (Expansion 1):** Sói Biến Thể (Sói Con, Sói Đầu Đàn, Sói Trắng, Sói Nguyền, Sói Già, Sói Ẩn).
   * **Đợt 3 (Expansion 2):** Toàn bộ 34 lá bài & Kỹ năng phức tạp (Kẻ Trộm, Doppelganger, Troublemaker, Sát Thủ, Kẻ Độc Hành, v.v.).

---

## II. LỘ TRÌNH 5 SPRINT KỸ THUẬT CHI TIẾT

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LỘ TRÌNH 5 SPRINT KỸ THUẬT                      │
│                                                                        │
│  [SPRINT 1] Portal Chọn Chế Độ, Ghép Trận & Sảnh Bàn Tròn Đánh Số Ghế │
│      │                                                                 │
│  [SPRINT 2] Khung Chat Thời Gian Thực 4 Kênh & Chat Nhanh 1-Chạm       │
│      │                                                                 │
│  [SPRINT 3] Game State Machine Pha Đêm & Giao Diện Hành Động Cá Nhân   │
│      │                                                                 │
│  [SPRINT 4] Chu Trình Ban Ngày (Bình Minh, Bầu Cử, Tie-Breaker 2 Vòng) │
│      │                                                                 │
│  [SPRINT 5] Âm Thanh Tự Động, Hồi Kết 1v1, Host Migration & Chơi Lại   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### SPRINT 1: PORTAL CHỌN CHẾ ĐỘ, GHÉP TRẬN NHANH & SẢNH BÀN TRÒN ĐÁNH SỐ GHẾ

#### 1. Mục tiêu Sprint
* Người chơi sau khi đăng nhập chọn được chế độ chơi (*Ngoài đời* vs *Online*).
* Vào sảnh Online: Tìm thấy danh sách phòng công khai, tạo phòng Public/Private, và bấm nút Ghép Trận Nhanh.
* Vào phòng chờ Online: Có ghế ngồi cố định quanh bàn (#1 đến #N), cơ chế Ready Check bắt buộc và 2 chế độ chọn bộ bài.

#### 2. Công việc Backend (`backend/`) — ĐÃ HOÀN THÀNH 100%
- [x] **Mở rộng Data Model & State (`backend/src/socket/state.js`):**
  - [x] Bổ sung trường `gameMode: 'offline' | 'online'` vào Room State.
  - [x] Bổ sung `isPublic: boolean`, `pinCode: string | null`, `autoDeck: boolean`, `roleRevealOnDeath: 'open' | 'hidden'`.
  - [x] Cấu trúc danh sách người chơi trong phòng có `seatNumber: number` (1..N) và `isReady: boolean`.
- [x] **Cập nhật Room Handler (`backend/src/socket/handlers/roomHandler.js`):**
  - [x] Socket event `create_online_room`: Tạo phòng Online, sinh mã phòng 4 số, cấp ghế #1 cho Host (`isReady = true`).
  - [x] Socket event `quick_match`: Quét tìm phòng Online Public đang có `gameState === 'lobby'` và số người đông nhất (Greedy Fill); tự động tạo phòng mới nếu không có.
  - [x] Socket event `toggle_ready`: Người chơi bật/tắt trạng thái sẵn sàng.
  - [x] Socket event `update_room_settings`: Host đổi thời gian phase, chế độ chọn bài (Máy tự chọn / Tự chọn), công khai/giấu bài khi chết.
  - [x] Ràng buộc bấm `start_game`: Chỉ cho phép Host bắt đầu khi 100% người chơi `isReady === true`, số lượng 5 - 18 người, số Sói < 50%.
  - [x] Cơ chế Host Migration: Tự động trao quyền Host cho người có ghế nhỏ nhất tiếp theo khi Host rời phòng.

#### 3. Công việc Frontend Web (`frontend/`) — ĐÃ HOÀN THÀNH 100%
- [x] **Màn hình Chọn Chế Độ (`frontend/src/components/ModeSelectionModal.jsx`):**
  - [x] Popup hoặc view chuyển hướng ngay sau khi đăng nhập: Nút 1 `🃏 Chơi Ngoài Đời` ➡️ Vào `LobbySection.jsx` hiện tại; Nút 2 `🌐 Chơi Online` ➡️ Vào `OnlineLobby.jsx`.
  - [x] Nút `[Đổi Chế Độ]` trên `Navbar.jsx`.
- [x] **Sảnh Game Online (`frontend/src/components/online/OnlineLobby.jsx`):**
  - [x] Nút lớn `⚡ Ghép Trận Nhanh (Quick Match)`.
  - [x] Bảng danh sách các phòng Public đang chờ kèm số lượng ghế (ví dụ: 6/10).
  - [x] Form Tạo phòng Online: Tên phòng, Checkbox Công khai / Riêng tư (có mã PIN 4 số).
- [x] **Phòng Chờ Bàn Tròn Online (`frontend/src/components/online/OnlineRoomLobby.jsx`):**
  - [x] Bàn tròn ảo hiển thị các vị trí ghế `#1` đến `#N`.
  - [x] Avatar người chơi kèm huy hiệu Host, trạng thái `Ready` (Xanh/Xám).
  - [x] Bảng cài đặt bên phải cho Host: Bộ đếm thời gian, Tùy chọn Máy tự chọn vs Tự chọn bài, Nút Bắt đầu (bị khóa nếu chưa đủ 100% Ready).

#### 4. Công việc Mobile App (`mobile/`) — ĐÃ HOÀN THÀNH 100%
- [x] Tạo màn hình `ModeSelectionScreen.js` sau màn hình Auth.
- [x] Tạo màn hình `OnlineLobbyScreen.js` (Ghép nhanh + Tạo phòng PIN).
- [x] Tạo màn hình `OnlineRoomLobbyScreen.js` với danh sách ghế ngồi và nút Ready Check.
- [x] Tích hợp `OnlineGameScreen.js` với Lật bài 3D, Night Action Sheet, Day Voting Panel và Khung Chat 4 kênh.

---

### SPRINT 2: KHUNG CHAT THỜI GIAN THỰC 4 KÊNH & PHÍM CHAT NHANH 1-CHẠM — ĐÃ HOÀN THÀNH 100%

#### 1. Mục tiêu Sprint
* Thiết lập hệ thống phân quyền 4 kênh chat độc lập (`TOWN_CHAT`, `WOLF_CHAT`, `LOVERS_CHAT`, `GHOST_CHAT`).
* Chống gian lận / Anti-metagaming: Người chết tuyệt đối không thấy thân phận người sống.
* Thanh Chat Nhanh (Quick Chat Presets) 1-chạm giúp thao tác tức thì.

#### 2. Công việc Backend (`backend/`) — ĐÃ HOÀN THÀNH
- [x] **Tạo Module Chat Handler (`backend/src/socket/online/chatHandler.js`):**
  - Quản lý 4 socket rooms per game:
    * `room_${code}_town`: Mở ban ngày, tự động mute toàn bộ ban đêm.
    * `room_${code}_wolf`: Chỉ người phe Ma Sói tham gia, mở ban đêm.
    * `room_${code}_lovers`: Kênh riêng 2 người trong Cặp Đôi, mở 24/24.
    * `room_${code}_ghost`: Dành cho người tử nạn và khán giả.
  - Kiểm tra điều kiện gửi tin `send_chat_message`:
    * Kiểm tra đúng phase (Ví dụ: Ban đêm cấm chat `town`).
    * Rate limiting: Cooldown tối thiểu 1.5s/tin nhắn per user.
    * Không gửi kèm thông tin role của người còn sống vào payload của `ghost_chat`.

#### 3. Công việc Frontend Web (`frontend/`) — ĐÃ HOÀN THÀNH
- [x] **Component Khung Chat Đa Kênh (`frontend/src/components/online/ChatBox.jsx`):**
  - Hệ thống Tab thông minh: Tự động active tab `Làng` (ban ngày), tab `Ma Sói` (ban đêm nếu là Sói), tab `Cặp Đôi` (nếu là Lovers).
  - Thu nhỏ / mở rộng dạng trượt mượt mà (Drawer / Floating Panel) không che khuất bài.
  - Hàng phím Chat Nhanh 1-chạm:
    * `[Dân Làng]` *"Tôi là Dân Làng lương thiện!"*
    * `[Nghi Ngờ]` *"Tôi nghi ngờ ghế số [Chọn Ghế]!"*
    * `[Phiếu Trắng]` *"Đề nghị cả làng bỏ phiếu trắng hôm nay."*
    * `[Kêu Oan]` *"Tôi vô tội, xin đừng vote tôi!"*

---

### SPRINT 3: GAME ENGINE PHA ĐÊM (NIGHT STATE MACHINE & ACTION SHEETS) — ĐÃ HOÀN THÀNH 100%

#### 1. Mục tiêu Sprint
* Xây dựng cỗ máy trạng thái tự động duyệt các vai trò ban đêm theo đúng thứ tự logic.
* Hỗ trợ giao diện thao tác đêm (Night Action Sheet) cho từng vai: Vote cắn sói, Soi bài Tiên Tri, Bình Phù Thủy, Khiên Bảo Vệ.
* Vận hành cơ chế `Fake Delay` và `Fake Phase` chống đếm giây đoán vai trò.

#### 2. Công việc Backend (`backend/`) — ĐÃ HOÀN THÀNH
- [x] **Xây dựng State Machine Pha Đêm (`backend/src/socket/online/nightEngine.js`):**
  - Hàm điều phối thứ tự phase:
    1. `NIGHT_SETUP` (Đêm 1): Cupid ghép đôi.
    2. `NIGHT_DEFENSE`: Bảo Vệ (chặn cắn, không kê 1 người 2 đêm liên tiếp).
    3. `NIGHT_ATTACK`: Bầy Sói (vote cắn). Xử lý hòa phiếu: Gia hạn 5s kèm event cảnh báo; sau 5s vẫn hòa thì Sói mất lượt; cấm Sói vote cắn người yêu.
    4. `NIGHT_INFO`: Tiên Tri (soi phe Sói/Dân).
    5. `NIGHT_WITCH`: Phù Thủy (thấy nạn nhân nếu còn bình cứu; dùng bình Cứu / Độc).
  - Bộ đếm thời gian tự động (Timer per phase): AFK tự động skip sang phase kế tiếp mà không làm đơ phòng.
  - Nút `skip_night_turn`: Người chơi thao tác xong chuyển phase ngay lập tức.
  - Cơ chế `Fake Phase` (6s - 8s): Giả lập phase đêm nếu vai trò đó đã chết khi phòng bật chế độ Giấu Bài.

#### 3. Công việc Frontend Web (`frontend/`) — ĐÃ HOÀN THÀNH
- [x] **Giao diện Màn Đêm & Bảng Hành Động (`frontend/src/components/online/NightActionSheet.jsx`):**
  - Màn hình phủ tối u ám với hiệu ứng trăng sao, sương mù.
  - Khi đến lượt: Màn hình sáng lên với danh sách người chơi còn sống dạng lưới kèm số ghế.
  - **Giao diện Bầy Sói:** Hiển thị mục tiêu vote của đồng đội Sói theo thời gian thực (icon móng vuốt đỏ), đồng hồ 5s gia hạn khi hòa phiếu. Khóa không cho Sói vote cắn người yêu nếu là Cặp Đôi.
  - **Giao diện Tiên Tri:** Bấm vào 1 người ➡️ Thẻ bài lật mở hiệu ứng hào quang báo Phe Sói / Phe Dân.
  - **Giao diện Phù Thủy:** Báo danh tính nạn nhân bị cắn đêm qua; 2 nút `Dùng Bình Cứu` / `Dùng Bình Độc`.

---

### SPRINT 4: CHU TRÌNH BAN NGÀY (DAY LIFECYCLE, TIE-BREAKER 2 VÒNG & BẦU CỬ) — ĐÃ HOÀN THÀNH 100%

#### 1. Mục tiêu Sprint
* Tự động hóa toàn bộ 4 giai đoạn ban ngày: Bình minh, Bầu Trưởng Làng, Thảo luận, Biểu quyết & Phán quyết.
* Giải quyết hàng đợi tử nạn FIFO (`deathQueue`) chuẩn xác (Thợ Săn nổ súng, Cặp Đôi tự sát).
* Vận hành Luật Hòa Phiếu 2 Vòng (Two-Stage Tie-Breaker) chuẩn thể thức thi đấu.

#### 2. Công việc Backend (`backend/`) — ĐÃ HOÀN THÀNH
- [x] **Xây dựng Day Engine (`backend/src/socket/online/dayEngine.js`):**
  - **Giai đoạn 1: Bình minh & Cáo phó (10s):**
    - Kiểm tra `deathQueue` FIFO: Nạn nhân đêm $\rightarrow$ Thợ Săn nổ súng 15s (chỉ chọn người còn sống; vô hiệu nếu chết do độc) $\rightarrow$ Cặp Đôi tự sát.
  - **Giai đoạn 2: Bầu cử Trưởng Làng (Ngày 1 - 30s):**
    - Bỏ phiếu Trưởng Làng (vote x2). Hòa phiếu $\rightarrow$ Ngày 1 không ai giữ huy hiệu; Ngày 2 mở lại phiên bầu Trưởng Làng.
    - Di chúc Trưởng Làng (10s khi chết): AFK tự động random cho người sống.
  - **Giai đoạn 3: Thảo luận tự do (60s - 180s):**
    - Mở `TOWN_CHAT`.
  - **Giai đoạn 4: Biểu quyết 2 Vòng:**
    - Vòng 1 (30s): Bỏ phiếu chỉ định có nút Phiếu Trắng (AFK auto Phiếu Trắng).
    - Tie-breaker: Nếu $\ge 2$ người bằng phiếu cao nhất $\rightarrow$ Kích hoạt Vòng 2 Hiệp Phụ (15s).
    - Bục Biện Hộ (20s): Chỉ nghi phạm được chat/nói, cả làng bị mute.
    - Phán quyết (15s): [Có Tội] vs [Vô Tội], nghi phạm bị khóa vote, Trưởng Làng x2.

#### 3. Công việc Frontend Web (`frontend/`) — ĐÃ HOÀN THÀNH
- [x] **Giao diện Cáo Phó Bình Minh (`DeathAnnouncementModal.jsx`):** Danh sách người tử nạn với thẻ bài lật mở (hoặc giấu bài).
- [x] **Giao diện Biểu Quyết Ban Ngày (`DayVotingPanel.jsx`):**
  - Hiển thị danh sách người sống kèm số vote thời gian thực, nút `[Bỏ Phiếu Trắng]`.
  - Bục Biện Hộ: Hiệu ứng Spotlight chiếu sáng nghi phạm, icon Micro 🎤.
  - Thanh trượt Phán Quyết: 2 nút lớn `[Có Tội 💀]` vs `[Vô Tội ✨]`.
  - Tích hợp Thợ Săn nổ súng & Di chúc Trưởng Làng.

---

### SPRINT 5: ÂM THANH TỰ ĐỘNG, HỒI KẾT 1V1, HOST MIGRATION & CHƠI LẠI — ĐÃ HOÀN THÀNH 100%

#### 1. Mục tiêu Sprint
* Tự động phát âm thanh theo phase (sói hú, chuông bình minh, treo cổ, súng nổ).
* Ma trận phán định Thắng / Thua toàn diện và Hồi kết 1v1 (Sói vs Dân, Sói vs Thợ Săn, Sói vs Tanner).
* Cơ chế xử lý rớt mạng, Host Migration và nút Chơi Lại (Play Again) giữ nguyên phòng.

#### 2. Công việc Backend (`backend/`) — ĐÃ HOÀN THÀNH
- [x] **Hàm Kiểm Tra Thắng Thua Toàn Diện (`dayEngine.js`):**
  - Chạy sau mỗi lần `deathQueue` rỗng.
  - Phán định Sói thắng, Dân Làng thắng, Tanner thắng, Cặp Đôi khác phe thắng, Hòa cả làng cùng diệt vong.
  - Xử lý hồi kết 1v1 Climax (1 Sói vs 1 Thợ Săn ➡️ Hòa cả làng diệt vong; 1 Sói vs 1 Dân ➡️ Sói thắng ngay lập tức).
- [x] **Cơ chế Host Migration & Quản lý AFK:**
  - Lắng nghe sự kiện ngắt kết nối: Giữ chỗ với Grace Period khi F5.
  - Hết giờ từng phase tự động skip hoặc chuyển tiếp, chống đơ phòng.
  - Nếu Host rời phòng ➡️ Tự động chuyển quyền Host cho người sống có số ghế nhỏ nhất kế tiếp (`assignLowestSeatNumber`).
- [x] **Socket Event `play_again`:** Đưa cả phòng về lại trạng thái `gameState = 'in_room'` với mã phòng cũ, reset `isReady = false`, dọn dẹp state online.

#### 3. Công việc Frontend Web (`frontend/`) — ĐÃ HOÀN THÀNH
- [x] **Trình quản lý Âm thanh tự động:** Đồng bộ âm thanh qua `sound_triggered` (wolf, morning, bell, death, revive), lưu trạng thái mute ở `localStorage`.
- [x] **Bảng Tổng Kết Vận Mệnh (`GameOverModal` trong `page.js`):** Lật toàn bộ 100% thẻ bài của tất cả người chơi trong phòng (`allRoles`), vinh danh phe thắng kèm confetti, nút `[🔄 Chơi ván mới]` cho Host.

---

### ĐỢT 2: EXPANSION 1 (SÓI BIẾN THỂ & CHỨC NĂNG TẤN CÔNG) — ĐÃ HOÀN THÀNH 100%

#### 1. Mục tiêu Đợt 2
* Mở rộng thêm 6 vai Ma Sói biến thể theo đúng tài liệu thiết kế: **Sói Con, Sói Đầu Đàn, Sói Trắng, Sói Nguyền, Sói Già, Sói Ẩn**.
* Cập nhật đồng bộ toàn bộ Game Engine ban đêm & ban ngày, giao diện Web và Mobile React Native.

#### 2. Chi tiết thực thi:
- [x] **Sói Con (Wolf Cub):** Chết kích hoạt cờ `wolfCubExtraKill = true`, đêm kế tiếp bầy Sói cuồng nộ cắn 2 nạn nhân (`wolfTarget` & `wolfTarget2`). Hiển thị banner lửa cuồng nộ trên Web & Mobile.
- [x] **Sói Đầu Đàn (Alpha Wolf):** Kỹ năng `ALPHA_WOLF_INFECT` (1 lần/ván): Nạn nhân bị cắn biến đổi thành Ma Sói (join Wolf Room & Wolf Chat) thay vì tử nạn.
- [x] **Sói Trắng (White Wolf):** Cứ mỗi 2 đêm (Đêm 2, Đêm 4...) thức riêng để cắn 1 con Sói khác (`WHITE_WOLF_KILL`). Thắng solo độc tôn khi là kẻ sống sót duy nhất.
- [x] **Sói Nguyền (Cursed Wolf):** Ban đầu là Dân (soi ra Dân), nếu bị cắn mà không có Bảo Vệ che chắn sẽ không chết mà thức tỉnh thành Ma Sói từ đêm sau.
- [x] **Sói Già (Old Wolf):** Miễn nhiễm hoàn toàn với Thuốc Độc của Phù Thủy (server âm thầm bỏ qua không đưa vào danh sách tử nạn).
- [x] **Sói Ẩn (Hidden Wolf):** Che giấu tà khí tuyệt đối, Tiên Tri soi bài luôn trả về Phe Dân Làng.
- [x] **Tự động Upsert DB (`seedCards.js` & `roles.js`):** Khởi tạo sẵn 6 thẻ bài mở rộng vào MongoDB khi server khởi động.

---

### ĐỢT 3: EXPANSION 2 (TƯƠNG TÁC PHỨC TẠP & PHE THỨ 3 NÂNG CAO) — ĐÃ HOÀN THÀNH 100%

#### 1. Mục tiêu Đợt 3
* Mở rộng thêm 8 vai tương tác đa dạng: **Kẻ Trộm, Người Hóa Sói (Doppelganger), Kẻ Đánh Tráo (Troublemaker), Già Làng, Sát Thủ (Serial Killer), Kẻ Độc Hành (Arsonist), Bán Sói (Lycan), Kẻ Báo Thù (Avenger)**.
* Đồng bộ Game Engine ban đêm/ban ngày, hỗ trợ xuyên khiên, chia 2 lá bài rìa thừa, bảo mật tráo vai và thừa kế vai trò.

#### 2. Chi tiết thực thi:
- [x] **Kẻ Trộm (Thief):** Đêm 1 thức dậy xem 2 lá bài thừa ngoài rìa (`centerCards`) để chọn đổi vai; nếu đổi thành Sói thì tự động join phòng/chat Sói.
- [x] **Người Hóa Sói (Doppelganger):** Đêm 1 chọn 1 người sống làm hình mẫu; khi người đó tử nạn, Doppelganger lập tức thừa kế toàn bộ sức mạnh và vai trò của người đó (cấp lại full charge kỹ năng).
- [x] **Kẻ Đánh Tráo (Troublemaker):** Đêm 1 bí mật hoán đổi vai trò của 2 người chơi khác cho nhau mà họ không biết thân phận mới (triệt tiêu nguy cơ lộ Sói).
- [x] **Già Làng (Elder):** Có 2 mạng khi bị Ma Sói cắn. Nếu bị Dân Làng treo cổ hoặc bị Phù Thủy đầu độc, chết ngay và toàn bộ Phe Dân mất hết kỹ năng đặc biệt (`villageStripped = true`).
- [x] **Sát Thủ (Serial Killer):** Mỗi đêm đâm chết 1 người xuyên khiên Bảo Vệ. Thắng solo độc tôn khi là người duy nhất sống sót cuối cùng.
- [x] **Bán Sói (Lycan):** Thuộc phe Dân Làng, nhưng Tiên Tri soi ra Phe Ma Sói.
- [x] **Đồng bộ Cross-Platform 100%:** Toàn bộ UI thao tác đêm trên Web Next.js và Mobile React Native Expo đã sẵn sàng hoạt động.

---

### ĐỢT 4: EXPANSION 3 (VAI TRÒ PHỤ TRỢ & PHE TRUNG LẬP MỞ RỘNG) — ĐÃ HOÀN THÀNH 100%

#### 1. Mục tiêu Đợt:
* Triển khai nhóm vai trò tương tác đặc biệt và phe trung lập mở rộng: **Cupid Nâng Cao (Dark Cupid)**, **Phù Thủy Thao Túng (Manipulator Witch)**, **Thầy Bói (Fortune Teller)**, và **Kẻ Phản Bội (Traitor)**.
* Đồng bộ cơ chế thao túng phiếu biểu quyết ban ngày và cơ chế thức tỉnh khi bầy Sói nguyên bản chết hết.

#### 2. Chi tiết thực thi:
- [x] **Cupid Nâng Cao (Dark Cupid / Cupid Bóng Tối):**
  - Thuộc Phe Thứ 3: Đêm 1 thức dậy se duyên 2 người bất kỳ (được phép tự ghép bản thân).
  - Giành chiến thắng vinh quang độc lập khi Cặp Đôi (hoặc Cặp Đôi + Cupid Bóng Tối) là những người sống sót cuối cùng trên bàn cờ.
- [x] **Phù Thủy Thao Túng (Manipulator Witch):**
  - Mỗi đêm chọn 1 người sống để khống chế tâm trí; gửi thông báo ma mị kín đáo đến nạn nhân.
  - Ban ngày khi kiểm phiếu biểu quyết (Vòng 1 & Vòng 2 Hiệp Phụ), lá phiếu của nạn nhân bị cưỡng bức tự động chuyển theo mục tiêu mà Phù Thủy Thao Túng bỏ phiếu.
- [x] **Thầy Bói (Fortune Teller):**
  - Phiên bản thần nhãn cao cấp của Tiên Tri; mỗi đêm soi thấu 1 người và hiển thị thẻ bài chân tướng chi tiết (`roleName`), Phe phái (`team`) và mô tả năng lực (`description`).
- [x] **Kẻ Phản Bội (Traitor / Tay Trong Của Sói):**
  - Phe Ma Sói nhưng sống trà trộn làm Dân Làng (Tiên Tri soi ra Phe Dân Làng).
  - Đêm 1 nhận thông báo danh tính bí mật của bầy Sói đồng minh.
  - Khi bầy Sói nguyên bản chết hết, Kẻ Phản Bội thức tỉnh thành Ma Sói mới (`Ma Sói (Thức Tỉnh)`), gia nhập kênh chat bầy Sói để tiếp tục cắn người; ván đấu không bị kết thúc sớm!
- [x] **Đồng bộ Cross-Platform 100% & Kiểm thử tự động:**
  - Cập nhật Game Engine (`roles.js`, `socketEvents.js`, `nightEngine.js`, `dayEngine.js`).
  - Cập nhật UI ban đêm trên Web Next.js (`NightActionSheet.jsx`) và Mobile React Native Expo (`MobileNightActionSheet.js`).
  - Bộ kiểm thử tự động `backend/scripts/test_expansion_3.js` vượt qua 15/15 bài test (100% PASS).

---

## III. BẢNG THEO DÕI CÁC TẬP TIN CẦN TẠO MỚI HOẶC CHỈNH SỬA

| Phân hệ | Đường dẫn tập tin | Trạng thái | Nhiệm vụ chính |
| :--- | :--- | :---: | :--- |
| **Backend** | `backend/src/socket/state.js` | **Đã hoàn thành** | Bổ sung model phòng Online, số ghế `#1..#N`, `isReady`, cài đặt bài |
| **Backend** | `backend/src/socket/handlers/roomHandler.js` | **Đã hoàn thành** | Thêm quick_match, toggle_ready, Host Migration |
| **Backend** | `backend/src/socket/online/chatHandler.js` | **Đã hoàn thành** | Quản lý 4 kênh socket chat, rate-limit, chống lộ role |
| **Backend** | `backend/src/socket/online/nightEngine.js` | **Đã hoàn thành** | State machine pha đêm, timeout từng phase, fake delay/phase |
| **Backend** | `backend/src/socket/online/dayEngine.js` | **Đã hoàn thành** | Chu trình ngày, deathQueue FIFO, tie-breaker 2 vòng, phán quyết & 1v1 Climax |
| **Frontend** | `frontend/src/components/ModeSelectionModal.jsx` | **Đã hoàn thành** | Modal chọn chế độ Chơi Ngoài Đời vs Chơi Online |
| **Frontend** | `frontend/src/components/online/OnlineLobby.jsx` | **Đã hoàn thành** | Sảnh online: Nút Ghép nhanh, Danh sách phòng public, Tạo phòng PIN |
| **Frontend** | `frontend/src/components/online/OnlineRoomLobby.jsx`| **Đã hoàn thành** | Bàn tròn ảo đánh số ghế, Ready check, Thiết lập bộ bài Host |
| **Frontend** | `frontend/src/components/online/ChatBox.jsx` | **Đã hoàn thành** | Khung chat 4 tab, nút chat nhanh 1-chạm, floating drawer |
| **Frontend** | `frontend/src/components/online/NightActionSheet.jsx`| **Đã hoàn thành** | Giao diện đêm: Lưới chọn mục tiêu, vote cắn sói, soi bài, 2 bình phù thủy |
| **Frontend** | `frontend/src/components/online/DeathAnnouncementModal.jsx` | **Đã hoàn thành** | Cáo phó bình minh với danh sách tử nạn và thân phận |
| **Frontend** | `frontend/src/components/online/DayVotingPanel.jsx` | **Đã hoàn thành** | Giao diện vote ngày, bục biện hộ Spotlight, thanh phán quyết Có Tội/Vô Tội |
| **Mobile** | `mobile/src/screens/ModeSelectionScreen.js` | **Đã hoàn thành** | Màn hình chọn chế độ Mobile |
| **Mobile** | `mobile/src/screens/OnlineLobbyScreen.js` | **Đã hoàn thành** | Sảnh online mobile (Ghép nhanh + Tạo phòng) |
| **Mobile** | `mobile/src/screens/OnlineRoomLobbyScreen.js` | **Đã hoàn thành** | Bàn tròn online đánh số ghế, Ready check |
| **Mobile** | `mobile/src/screens/OnlineGameScreen.js` | **Đã hoàn thành** | Màn hình chính ván đấu online, Night/Day Engine & Chat trên Expo |
| **Mobile** | `mobile/src/components/online/` | **Đã hoàn thành** | Chat Drawer 4 kênh, Night Action Sheet, Cáo phó, Day Voting |

---

## IV. TIÊU CHUẨN NGHIỆM THU (DEFINITION OF DONE - DoD)

Mỗi Sprint chỉ được đánh dấu hoàn thành khi đạt đủ các tiêu chí:
1. **Hoạt động song song độc lập:** Kiểm tra Chế độ Ngoài Đời (Offline Companion) vẫn chạy mượt mà 100%, không bị ảnh hưởng bởi code Online.
2. **Xử lý trơn tru Timeout & AFK:** Không một tình huống nào khiến Server bị "treo" (hết giờ tự động skip phase, tự gán Phiếu Trắng).
3. **Bảo mật tuyệt đối thông tin:** Client không nhận được bất kỳ payload nhạy cảm nào ngoài phạm vi vai trò của mình (người chết không soi được role người sống, dân không thấy Wolf Chat).
4. **Kiểm thử E2E Đa thiết bị:** Giả lập phòng 6-8 người chơi đồng thời trên Web Next.js và Mobile Expo vượt qua toàn bộ chu trình ván đấu từ Sảnh đến Màn hình Vinh danh.
