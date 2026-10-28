# TÀI LIỆU ĐẶC TẢ CHI TIẾT NGHIỆP VỤ GAME MA SÓI (WEREWOLF)
> **Dự án:** Ma Sói Monorepo (Backend Node.js/Socket.IO, Frontend Next.js, Mobile React Native Expo)  
> **Phiên bản kiến trúc:** 2.2 (Dual-Mode: Offline Companion & Online Remote - Complete Production Engine)  
> **Ngày cập nhật:** 22/10/2026

---

## MỤC LỤC
1. [TỔNG QUAN HỆ THỐNG VÀ LUỒNG CHỌN CHẾ ĐỘ (PORTAL SELECTION)](#1-tổng-quan-hệ-thống-và-luồng-chọn-chế-độ-portal-selection)
2. [QUẢN LÝ PHÒNG, ĐÁNH SỐ GHẾ & HUY HIỆU NGƯỜI CHƠI](#2-quản-lý-phòng-đánh-số-ghế--huy-hiệu-người-chơi)
3. [PHÂN LOẠI PHÒNG & THUẬT TOÁN GHÉP TRẬN NHANH](#3-phân-loại-phòng--thuật-toán-ghép-trận-nhanh)
4. [BỘ CÀI ĐẶT THỜI GIAN & 2 CHẾ ĐỘ CHỌN BÀI (MÁY TỰ CHỌN VS TỰ CHỌN)](#4-bộ-cài-đặt-thời-gian--2-chế-độ-chọn-bài-máy-tự-chọn-vs-tự-chọn)
5. [DANH MỤC CHI TIẾT 34 LÁ BÀI & CƠ CHẾ KỸ NĂNG](#5-danh-mục-chi-tiết-34-lá-bài--cơ-chế-kỹ-năng)
6. [KỊCH BẢN VÒNG LẶP PHA ĐÊM (NIGHT SEQUENCE ENGINE)](#6-kịch-bản-vòng-lặp-pha-đêm-night-sequence-engine)
7. [QUY TRÌNH 4 GIAI ĐOẠN BAN NGÀY (DAY LIFECYCLE ENGINE)](#7-quy-trình-4-giai-đoạn-ban-ngày-day-lifecycle-engine)
8. [MA TRẬN GIẢI QUYẾT XUNG ĐỘT KỸ NĂNG & HỒI KẾT 1V1](#8-ma-trận-giải-quyết-xung-đột-kỹ-năng--hồi-kết-1v1)
9. [MA TRẬN ĐIỀU KIỆN THẮNG / THUA TOÀN DIỆN (WIN CONDITIONS)](#9-ma-trận-điều-kiện-thắng--thua-toàn-diện-win-conditions)
10. [HỆ THỐNG GIAO TIẾP 4 KÊNH, CHAT NHANH & CHỐNG GIAN LẬN](#10-hệ-thống-giao-tiếp-4-kênh-chat-nhanh--chống-gian-lận)
11. [ÂM THANH TỰ ĐỘNG, APP CHẠY NGẦM & XỬ LÝ SỰ CỐ / AFK](#11-âm-thanh-tự-động-app-chạy-ngầm--xử-lý-sự-cố--afk)
12. [BẢNG TỔNG KẾT VẬN MỆNH & TÍNH NĂNG CHƠI LẠI (PLAY AGAIN)](#12-bảng-tổng-kết-vận-mệnh--tính-năng-chơi-lại-play-again)
13. [CHIẾN LƯỢC TRIỂN KHAI VÀ PHÂN KỲ BỘ BÀI (ENGINEERING ROADMAP)](#13-chiến-lược-triển-khai-và-phân-kỳ-bộ-bài-engineering-roadmap)

---

## 1. TỔNG QUAN HỆ THỐNG VÀ LUỒNG CHỌN CHẾ ĐỘ (PORTAL SELECTION)

Ngay sau khi người chơi **Đăng nhập / Đăng ký & Tạo tên nhân vật thành công**, hệ thống sẽ điều hướng trực tiếp tới **MÀN HÌNH CHỌN CHẾ ĐỘ CHƠI (Mode Selection Screen)** với 2 nút bấm nổi bật:

```
                  ┌──────────────────────────────────────────────┐
                  │   ĐĂNG NHẬP / TẠO TÊN NHÂN VẬT THÀNH CÔNG   │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │    MÀN HÌNH CHỌN CHẾ ĐỘ (MODE SELECTION)     │
                  │  (Có nút Back / Đổi Chế Độ trên thanh điều   │
                  │   hướng để người chơi quay lại chọn bất kỳ) │
                  └──────────────┬────────────────┬──────────────┘
                                 │                │
            ┌────────────────────┘                └────────────────────┐
            ▼                                                          ▼
┌────────────────────────────────────────┐   ┌────────────────────────────────────────┐
│  NÚT 1: 🃏 CHƠI NGOÀI ĐỜI               │   │  NÚT 2: 🌐 CHƠI ONLINE                 │
│  (Offline Companion Mode)              │   │  (Online Automated Mode)               │
├────────────────────────────────────────┤   ├────────────────────────────────────────┤
│ • VÀO THẲNG GIAO DIỆN HIỆN TẠI ĐÃ LÀM  │   │ • VÀO GIAO DIỆN CHƠI ONLINE TỰ ĐỘNG    │
│ • Sảnh nhập mã phòng 4 số / Tạo phòng  │   │ • Nút ⚡ Ghép trận nhanh (Quick Match)  │
│ • Chia bài Tarot 3D bí mật             │   │ • Danh sách phòng Public đang chờ      │
│ • Quản trò (Master Dashboard) giọng nói│   │ • Tạo phòng Public / Private (Mã PIN)  │
│ • Soundboard (Sói hú, Chuông đêm)      │   │ • Khung Chat 4 kênh (Làng/Sói/Cặp/Ma) │
│ • Đếm ngược thảo luận đồng bộ          │   │ • Máy chủ làm Quản trò tự động hóa     │
│ • Đánh dấu Sống/Chết & Báo Thắng/Thua  │   │ • Tự động gọi đêm, biểu quyết ban ngày │
└────────────────────────────────────────┘   └────────────────────────────────────────┘
```

### Quy tắc điều hướng & Khôi phục phiên (Session Persistence):
- **Nút Back / Đổi Chế Độ:** Ở cả hai chế độ (ngoài đời và online), trên thanh Header / Navbar luôn có nút `[Đổi Chế Độ]` để người chơi có thể thoát ra màn hình chọn bất kỳ lúc nào (khi đang ở Sảnh).
- **Ghi nhớ trạng thái (Session Persistence):** Nếu người chơi đang trong một ván chơi mà vô tình bấm F5 (Reload) hoặc rớt mạng, hệ thống tự động nhận diện `sessionToken` và đưa người chơi quay trở lại **đúng ván đấu của chế độ đó**, không bị văng về màn hình chọn chế độ.

---

## 2. QUẢN LÝ PHÒNG, ĐÁNH SỐ GHẾ & HUY HIỆU NGƯỜI CHƠI

### 2.1. Mã phòng & Định danh
- **Mã phòng:** Sinh ngẫu nhiên gồm 4 chữ số (từ `1000` đến `9999`).
- **Mật khẩu phòng (PIN Code):** Tùy chọn 4 số do Chủ phòng thiết lập (dành cho phòng riêng tư).
- **Session Token chống mạo danh:** Mỗi người chơi khi đăng nhập sẽ được cấp 1 `sessionToken` độc nhất để xác thực phiên kết nối.

### 2.2. Hệ thống Đánh số Ghế (#1 đến #N) & Bàn Tròn Ảo
- Trong phòng chơi Online, mỗi người chơi được cấp một **Số Ghế cố định (#1, #2, #3, ... #N)** theo thứ tự tham gia phòng.
- **Lợi ích:** Người chơi có thể gọi nhau nhanh chóng bằng số ghế (*"Tôi nghi ngờ số 3"*, *"Số 7 hãy biện hộ"*), không bị cản trở bởi tên nhân vật dài hoặc ký tự đặc biệt.

### 2.3. Hệ thống Huy Hiệu Động (Dynamic Badges) trên Avatar
Trên avatar người chơi hiển thị trực quan các trạng thái:
- 🌟 **Huy hiệu Trưởng Làng:** Người giữ huy hiệu có quyền lực x2 phiếu bầu.
- 💀 **Huy hiệu Đã Chết:** Avatar phủ màu xám tro u ám, hiển thị biểu tượng đầu lâu.
- 🎤 **Huy hiệu Đang Biện Hộ:** Spotlight chiếu sáng người đang trên bục biện hộ.
- ⚠️ **Huy hiệu Mất Kết Nối:** Báo hiệu người chơi đang bị ngắt kết nối (trong thời gian chờ 45s).
- 🐺 **Dấu hiệu Đồng Đội Sói:** Biểu tượng mắt sói đỏ (chỉ những người cùng phe Ma Sói mới nhìn thấy nhau).
- 💖 **Trái Tim Cặp Đôi:** Biểu tượng đôi cánh tình yêu (chỉ 2 người yêu nhau mới nhìn thấy).

### 2.4. Quyền hạn của Chủ phòng (Host) & Ràng buộc Khởi động
- **Kiểm tra Sẵn Sàng (Ready Check):** Chủ phòng chỉ được bấm *"Bắt Đầu"* khi **100% người chơi trong phòng đã bấm Sẵn Sàng**.
- **Quy định số lượng:** Tối thiểu **5 người**, tối đa **18 người**.
- **Cân bằng cơ bản:** Bắt buộc có ít nhất 1 Sói; tổng số Sói < 50% tổng số người; có ít nhất 2 người phe Dân hoặc Phe Thứ 3.

---

## 3. PHÂN LOẠI PHÒNG & THUẬT TOÁN GHÉP TRẬN NHANH

### 3.1. Phân loại phòng: Public vs Private
1. 🔒 **Phòng Riêng Tư (Private Room):** Không hiển thị sảnh công cộng, bắt buộc có Mã phòng (và Mật khẩu PIN nếu có).
2. 🌐 **Phòng Công Khai (Public Room):** Xuất hiện trên bảng danh sách phòng chung và tham gia thuật toán Ghép Trận Nhanh.

### 3.2. Thuật toán Ghép Trận Nhanh Thông Minh (Smart Quick Match Engine)
Khi người chơi bấm **⚡ GHÉP TRẬN NHANH**:
1. **Lọc phòng khả dụng:** `isPublic === true`, `gameState === "lobby"`, chưa đầy phòng.
2. **Ưu tiên phòng đông nhất (Greedy Fill):** Sắp xếp giảm dần theo số người, đưa người chơi vào phòng đông nhất để ván đấu bắt đầu sớm nhất.
3. **Dự phòng (Fallback):** Nếu không có phòng thỏa mãn, tự động tạo phòng Public mới và đặt người chơi làm Host.

---

## 4. BỘ CÀI ĐẶT THỜI GIAN & 2 CHẾ ĐỘ CHỌN BÀI (MÁY TỰ CHỌN VS TỰ CHỌN)

### 4.1. Cài đặt thời gian các pha (Timers)
Chủ phòng có thể điều chỉnh thời gian đếm ngược:
* **Thời gian gọi đêm mỗi vai:** Mặc định `20 giây` (tùy chọn: `10s - 45s`).
* **Thời gian gia hạn đồng nhất của Ma Sói:** Cố định `5 giây` (kích hoạt khi bầy Sói hòa phiếu cắn).
* **Thời gian thảo luận ban ngày:** Mặc định `90 giây` (tùy chọn: `60s`, `90s`, `120s`, `180s`).
* **Thời gian bỏ phiếu chỉ định nghi phạm:** Mặc định `30 giây` (tùy chọn: `20s`, `30s`, `45s`).
* **Thời gian biện hộ:** Mặc định `20 giây`.
* **Thời gian phán quyết [Có Tội / Vô Tội]:** Mặc định `15 giây`.
* **Thời gian Thợ Săn nổ súng:** Mặc định `15 giây`.
* **Thời gian Trưởng Làng để lại di chúc:** Mặc định `10 giây`.

### 4.2. Cài đặt Công Khai Thẻ Bài Khi Tử Nạn (Role Reveal on Death)
Trước khi bắt đầu trận, Chủ phòng / Quản trò được chọn 1 trong 2 chế độ hiển thị thân phận:
1. 🎴 **Công Khai Bài (Open Role - Mặc định):** Khi bất kỳ người chơi nào chết (bị Sói cắn, treo cổ, trúng đạn Thợ Săn, Phù Thủy độc,...), hệ thống sẽ công bố số ghế và lật mở công khai thẻ bài của người đó cho cả làng cùng biết.
2. 🎭 **Giấu Bài (Hidden Role / Dark Mode):** Khi người chơi tử nạn, hệ thống chỉ thông báo số ghế đã chết, tuyệt đối giấu kín vai trò cho đến khi toàn bộ ván đấu kết thúc ở Màn hình Tổng kết (phù hợp giải đấu hardcore).

### 4.3. Hai Cơ Chế Chọn Bộ Bài: "Máy Tự Chọn" vs "Quản Trò Tự Chọn"
Chủ phòng (hoặc Quản trò) có thể lựa chọn 1 trong 2 hình thức thiết lập bài:

1. 🤖 **CHẾ ĐỘ MÁY TỰ CHỌN (Auto-Select / Cân Bằng Thông Minh):**
   - Quản trò không cần mất thời gian chọn từng lá bài.
   - Khi phòng có $N$ người chơi, hệ thống tự động áp dụng công thức "Tỷ lệ vàng" chuẩn thi đấu để bốc bài ngẫu nhiên:
     - **5 - 6 người:** 1 Ma Sói, 1 Tiên Tri, 1 Bảo Vệ, 2-3 Dân Làng.
     - **7 - 8 người:** 2 Ma Sói, 1 Tiên Tri, 1 Bảo Vệ, 1 Phù Thủy, 2-3 Dân Làng.
     - **9 - 11 người:** 3 Ma Sói, 1 Tiên Tri, 1 Bảo Vệ, 1 Phù Thủy, 1 Thợ Săn, Dân Làng + 1 Vai Đặc Biệt (Cupid hoặc Già Làng).
     - **12+ người:** 3-4 Ma Sói (kèm Sói chức năng: Sói Đầu Đàn, Sói Con), đầy đủ phe Dân đặc biệt và Phe Thứ 3 (Kẻ Chán Đời, Sát Thủ,...).

2. 🎴 **CHẾ ĐỘ QUẢN TRÒ TỰ CHỌN (Manual Custom Deck):**
   - Quản trò / Chủ phòng được toàn quyền mở danh mục 34 lá bài, tick chọn hoặc tăng giảm số lượng từng vai trò theo ý thích.
   - **Ràng buộc kiểm tra bài:**
     - Nếu **có lá Kẻ Trộm (Thief)**: Bắt buộc chọn `Số lá bài = Số người chơi + 2 lá bài thừa ngoài rìa`.
     - Nếu **không có Kẻ Trộm**: Bắt buộc chọn `Số lá bài = Số người chơi`.
     - Phải có ít nhất 1 Ma Sói và tỷ lệ Sói < 50% tổng số người.

### 4.4. Quy Tắc Bỏ Phiếu Đồng Thời & Luật Hòa Phiếu Ban Ngày
* **Bỏ phiếu đồng thời:** Toàn bộ người chơi còn sống có thời gian biểu quyết như nhau và bấm vote cùng lúc trong thời gian quy định (mặc định 30s).
* **Nút Bỏ Phiếu Trắng:** Người chơi có quyền bấm `[Bỏ Phiếu Trắng / Tha bổng]` nếu không muốn vote treo cổ ai.
* **Quy tắc xử lý AFK / Quá giờ vote:** Nếu người chơi không bấm chọn ai và cũng không bấm Phiếu Trắng trước khi hết giờ, hệ thống sẽ **tự động gán lựa chọn là `[Phiếu Trắng]`** để đảm bảo tổng số phiếu luôn bằng tổng số người còn sống.
* **Luật Xử Lý Hòa Phiếu 2 Vòng (Two-Stage Tie-Breaker):**
  - **Vòng 1 (30s - Bỏ phiếu chỉ định toàn diện):**
    - Nếu có 1 người duy nhất đạt số phiếu cao nhất (và số phiếu đó > tổng Phiếu Trắng) ➡️ Đưa người đó lên Bục Biện Hộ.
    - Nếu **số Phiếu Trắng $\ge$ số phiếu của người bị vote nhiều nhất** ➡️ Cả làng đồng thuận tha bổng, kết thúc ngày, trời tối ngay lập tức.
    - Nếu có **từ 2 người trở lên có cùng số phiếu cao nhất** ➡️ Hệ thống kích hoạt **Vòng 2 Hiệp Phụ (Tie-breaker 15s)**.
  - **Vòng 2 Hiệp Phụ (15s):**
    - Toàn bộ dân làng chỉ được phép bỏ phiếu chọn 1 trong số những người đang bằng phiếu cao nhất ở Vòng 1 (hoặc tiếp tục chọn Phiếu Trắng).
    - Hết 15s Vòng 2, nếu phân định được 1 người cao nhất ➡️ Đưa lên Bục Biện Hộ.
    - Hết 15s Vòng 2 mà **vẫn tiếp tục hòa phiếu hoặc Phiếu Trắng đa số** ➡️ Lúc này mới chính thức **Tha bổng toàn bộ (Acquittal on Tie)**, kết thúc ngày, trời tối ngay lập tức.

---

## 5. DANH MỤC CHI TIẾT 34 LÁ BÀI & CƠ CHẾ KỸ NĂNG

> **LƯU Ý:** **Trưởng Làng** là **Danh hiệu Bầu Cử Ban Ngày (Mayor Badge)** do cả làng bầu vào Ngày 1, không phải lá bài ẩn ban đầu. Dưới đây là 34 lá bài vai trò:

### 🐺 NHÓM 1: PHE MA SÓI (8 LÁ)
1. **Ma Sói (Thường):** Thức dậy mỗi đêm cùng bầy Sói để vote cắn 1 con mồi. Nếu hết giờ mà hòa phiếu cắn, bầy Sói được gia hạn 5s kèm cảnh báo *"Sói hãy đồng nhất mục tiêu!"*. Sau 5s gia hạn nếu vẫn không đạt đa số tuyệt đối ➡️ Đêm đó Sói mất lượt cắn.
2. **Ma Sói Thường Dân:** Giống Ma Sói thường, không có năng lực phụ trợ.
3. **Sói Đầu Đàn (Alpha Wolf):** Có kỹ năng *"Lây Nhiễm"* (dùng 1 lần/ván). Nạn nhân không chết mà biến thành Ma Sói vào đêm hôm sau.
4. **Sói Con (Wolf Cub):** Cùng thức với bầy. Khi Sói Con chết, đêm tiếp theo bầy Sói được quyền cắn 2 nạn nhân (hệ thống mở 2 lượt vote cắn).
5. **Sói Trắng (White Wolf):** Đi cắn cùng bầy Sói. Cứ mỗi 2 đêm, sau khi bầy Sói ngủ, Sói Trắng thức riêng cắn chết 1 con Sói khác. Thắng khi là kẻ sống sót duy nhất.
6. **Sói Nguyền (Cursed Wolf):** Ban đầu ngủ cùng Dân Làng (Tiên Tri soi ra Dân). Nếu bị Ma Sói cắn (và không có khiên Bảo Vệ che chở), Sói Nguyền không chết mà chuyển phe thành Ma Sói từ đêm tiếp theo.
7. **Sói Già (Old Wolf):** Đi cắn cùng bầy. Thụ động miễn nhiễm với thuốc độc của Phù Thủy.
8. **Sói Ẩn (Hidden Wolf):** Che giấu tà khí. Khi Tiên Tri soi vào Sói Ẩn, kết quả trả về luôn là *"Phe Dân Làng"*.

### 🛡️ NHÓM 2: PHE DÂN LÀNG (12 LÁ)
9. **Dân Làng (Villager):** Ngủ say ban đêm. Thảo luận và biểu quyết ban ngày để tìm Sói.
10. **Tiên Tri (Seer):** Mỗi đêm chọn soi 1 người để biết người đó thuộc *Phe Sói* hay *Phe Dân*.
11. **Bảo Vệ (Guard):** Mỗi đêm bảo vệ 1 người trước móng vuốt Sói (được phép tự bảo vệ bản thân). Không bảo vệ cùng 1 người (kể cả chính mình) 2 đêm liên tiếp.
12. **Phù Thủy (Witch):** Có 1 bình Cứu và 1 bình Độc. Mỗi đêm chỉ được dùng tối đa 1 bình. Bình cứu chỉ dùng cho bản thân ở Đêm 1. Phù Thủy vẫn nhìn thấy nạn nhân bị Sói cắn nếu còn bình cứu (kể cả khi mục tiêu đó đã được Bảo Vệ che chắn thành công).
13. **Thợ Săn (Hunter):** Khi chết do bị Ma Sói cắn, bị Dân treo cổ hoặc bị Sát Thủ / Kẻ Độc Hành giết ➡️ Kích hoạt **15s nổ súng** kéo theo 1 người khác (chỉ được nhắm vào người còn sống). Nếu AFK hết 15s ➡️ Tự động bắn trượt. **NGOẠI LỆ:** Nếu Thợ Săn chết do **Thuốc Độc của Phù Thủy** (chết trong câm lặng/bất ngờ) ➡️ **Bị vô hiệu hóa phát đạn, không được nổ súng**.
14. **Cupid (Thần Tình Yêu):** Đêm 1 ghép đôi 2 người chơi thành Cặp Đôi. Mở kênh chat riêng `LOVERS_CHAT`. Sống cùng sống, chết cùng chết.
15. **Già Làng (Elder):** Có 2 mạng khi bị Sói cắn. Nếu bị Dân treo cổ hoặc Phù Thủy đầu độc thì chết ngay lập tức và toàn bộ Dân Làng bị tước hết kỹ năng đặc biệt.
16. **Thầy Tu (Priest):** Mỗi đêm ban phước cho 1 người, giải trừ bùa chú, lời nguyền hoặc trạng thái lây nhiễm.
17. **Pháp Sư (Sorcerer):** Soi bài cao cấp: Biết chính xác tên vai trò cụ thể thay vì chỉ biết phe.
18. **Hiệp Sĩ Ánh Sáng (Knight):** Nếu bị Sói cắn ban đêm, kiếm khí của Hiệp Sĩ chém chết ngay con Sói ngồi gần nhất bên tay trái.
19. **Bao Công / Thẩm Phán (Judge):** Một lần trong ván, có quyền phủ quyết một phán quyết treo cổ ban ngày để tha bổng nghi phạm.
20. **Cô Bé (Little Girl):** Được xem trộm tin nhắn trong phòng Chat của bầy Sói ban đêm, nhưng có nguy cơ bị phát hiện và chết thay con mồi.

### 🎭 NHÓM 3: PHE TRUNG LẬP / THỨ 3 (14 LÁ)
21. **Kẻ Chán Đời (Tanner):** Mục tiêu là làm sao để Dân Làng treo cổ mình vào ban ngày. Nếu bị treo cổ ➡️ Thắng ngay lập tức!
22. **Sát Thủ (Serial Killer):** Thức mỗi đêm và đâm chết 1 người. Đòn tấn công xuyên qua khiên Bảo Vệ. Thắng khi là người sống sót duy nhất.
23. **Kẻ Độc Hành (Arsonist):** Mỗi đêm tẩm xăng 1-2 người, hoặc bấm *"Châm Lửa"* thiêu rụi toàn bộ những người đã bị tẩm xăng. Ngọn lửa thiêu rụi xuyên qua khiên Bảo Vệ (trừ khi nạn nhân được Thầy Tu giải trừ dầu xăng). Thắng khi cả làng bị thiêu rụi.
24. **Người Hóa Sói (Doppelganger):** Đêm 1 chọn 1 người làm "hình mẫu". Khi người đó chết, thừa kế toàn bộ vai trò và phe của người đó, đồng thời **được làm mới 100% kỹ năng (Full Charge)** (ví dụ: thừa kế Phù Thủy sẽ được cấp lại đủ 2 bình Cứu & Độc mới; thừa kế Sói Đầu Đàn được dùng lại kỹ năng Lây Nhiễm 1 lần). Nếu ván đấu kết thúc khi hình mẫu chưa chết, Doppelganger tính là Phe Dân Làng.
25. **Bán Sói (Lycan):** Là người phe Dân Làng, nhưng trong người mang dòng máu Sói nên Tiên Tri soi ra Phe Sói.
26. **Kẻ Trộm (Thief):** Đêm 1 được lén xem 2 lá bài thừa ngoài rìa. Nếu cả 2 lá bài thừa đều là Ma Sói, Kẻ Trộm bắt buộc phải đổi lấy 1 lá Ma Sói; nếu có ít nhất 1 lá Dân Làng/Phe 3, Kẻ Trộm được quyền tự do chọn đổi lấy 1 lá hoặc giữ nguyên vai trò.
27. **Kẻ Đánh Tráo (Troublemaker):** Đêm 1 tráo đổi vai trò 2 người chơi khác cho nhau. **Quy tắc bảo mật chống lộ Sói:** Kẻ Đánh Tráo chỉ được tráo bài giữa 2 người thuộc Phe Dân Làng hoặc Phe Thứ 3 (hệ thống tự động loại trừ Ma Sói khỏi danh sách chọn), HOẶC nếu tráo thì người bị tráo **chỉ nhận thông báo đã bị tráo nhưng bị GIẤU THÂN PHẬN MỚI** cho đến khi tự khám phá qua gợi ý/hết ván (triệt tiêu 100% nguy cơ người từ Sói bị biến thành Dân rồi lật mặt tố cáo đồng đội Sói ở Ngày 1).
28. **Kẻ Báo Thù (Avenger):** Nếu bị giết ban đêm, trước khi chết sẽ kéo theo 1 người chơi khác cùng tử nạn trước bình minh (chỉ được chọn người còn sống).
29. **Thợ Săn Bóng Đêm:** Mang 1 viên đạn đặc biệt chỉ bắn hạ được người thuộc Phe Trung Lập / Phe Thứ 3.
30. **Cupid Bóng Tối:** Ghép đôi 2 người, nhưng thắng độc lập nếu cặp đôi đó là 2 người sống sót cuối cùng.
31. **Cặp Đôi (Lovers):** Phe độc lập (nếu Sói + Dân). Nhiệm vụ tiêu diệt toàn bộ người khác để là 2 người sống sót cuối cùng.
32. **Kẻ Say (Drunk):** Tưởng mình là Dân Làng, đến ngày thứ 3 mới tỉnh rượu và phát hiện vai trò thật của mình.
33. **Kẻ Nhìn Trộm:** Đêm 1 được xem 1 lá bài dư ngoài bàn để biết vai nào không xuất hiện trong trận.
34. **Tiên Tri Mù:** Soi bài với độ chính xác khoảng 70% (kết quả có thể bị nhiễu).

---

## 6. KỊCH BẢN VÒNG LẶP PHA ĐÊM (NIGHT SEQUENCE ENGINE)

Mỗi đêm, Game Engine duyệt qua danh sách lá bài còn sống và kích hoạt theo đúng thứ tự:

```
[BƯỚC 1: THIẾT LẬP - DUY NHẤT ĐÊM 1]
Doppelganger (Chọn hình mẫu) ➡️ Kẻ Trộm (Đổi bài thừa; nếu 2 lá đều là Sói thì bắt buộc đổi Sói) ➡️ Kẻ Đánh Tráo (Tráo 2 người) ➡️ Cupid (Ghép đôi & mở Lovers Chat)
       ⬇
[BƯỚC 2: BẢO VỆ & HỖ TRỢ]
Bảo Vệ (Dựng khiên chặn cắn; được tự bảo vệ mình nhưng không liên tiếp 2 đêm) ➡️ Thầy Tu (Giải bùa/trừ tà/hóa giải dầu xăng)
       ⬇
[BƯỚC 3: PHE TẤN CÔNG]
Bầy Ma Sói (Mở Wolf Chat & Vote cắn con mồi. Nếu hết giờ hòa phiếu ➡️ Gia hạn 5s kèm cảnh báo "Sói hãy đồng nhất mục tiêu!". Sau 5s vẫn hòa ➡️ Sói mất lượt cắn)
Sói Trắng (Cắn Sói khác - mỗi 2 đêm) ➡️ Sát Thủ (Đâm dao xuyên khiên) ➡️ Kẻ Độc Hành (Tẩm xăng / Châm lửa thiêu xuyên khiên)
       ⬇
[BƯỚC 4: SOI DANH TÍNH]
Tiên Tri / Pháp Sư / Tiên Tri Mù
       ⬇
[BƯỚC 5: PHÙ THỦY]
Thông báo nạn nhân bị Sói cắn (nếu Phù Thủy còn bình cứu, kể cả khi nạn nhân đã được Bảo Vệ che chắn) ➡️ Chọn Dùng Bình Cứu / Bình Độc / Bỏ qua
```

### Quy tắc kỹ thuật trong đêm:
- **Nút "Xong Lượt / Đi Ngủ Sớm":** Chuyển phase ngay lập tức khi người chơi hành động xong.
- **Tự động Skip khi Timeout từng Phase (10s - 30s):** Hết thời gian riêng của từng vai mà người chơi AFK hoặc mất mạng, server tự động skip sang phase tiếp theo ngay để ván chơi không bị ngưng trệ (không cần chờ đủ 45s Grace Period).
- **Fake Delay & Fake Phase (Chế độ Giấu Bài - Hidden Role):**
  - Độ trễ ngẫu nhiên (`5s - 8s`) chống người chơi đếm giây đoán vai trò còn sống hay chết.
  - **ĐẶC BIỆT:** Khi phòng bật chế độ **Giấu Bài (Hidden Role)**, ngay cả khi các vai trò đặc biệt (Tiên Tri, Bảo Vệ, Phù Thủy,...) **đã chết**, Server vẫn phải giả lập một **Fake Phase** (đếm ngược ngẫu nhiên `6s - 12s`) với màn hình đêm trước khi nhảy sang phase kế tiếp, nhằm bảo mật tuyệt đối tình trạng sống chết của các vai trò này.

---

## 7. QUY TRÌNH 4 GIAI ĐOẠN BAN NGÀY (DAY LIFECYCLE ENGINE)

```
┌────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 1: BÌNH MINH & CÁO PHÓ (10s)                                 │
│ • Chuông sáng reo, hiển thị danh sách người tử nạn đêm qua             │
│ • Công bố vai trò nếu phòng bật "Công Khai Bài" (hoặc giấu vai trò)    │
│ • Kích hoạt 15s cho Thợ Săn nổ súng (chỉ nhắm vào người còn sống;      │
│   vô hiệu hóa nếu chết do Thuốc Độc của Phù Thủy)                      │
│ • Kích hoạt tự sát nếu người yêu trong Cặp Đôi chết                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ GIAI ĐOẠN 2: BẦU CỬ TRƯỞNG LÀNG (Chỉ Ngày 1 - 30s)                     │
│ • Cả làng bỏ phiếu bầu 1 người làm Trưởng Làng (x2 vote)               │
│ • HÒA PHIẾU BẦU TRƯỞNG LÀNG: Nếu từ 2 người bằng phiếu cao nhất hoặc   │
│   không ai đạt đa số ➡️ Ngày 1 không ai giữ huy hiệu. Sang Ngày 2      │
│   sẽ mở lại phiên Bầu Cử Trưởng Làng trước giờ thảo luận.              │
│ • Nếu Trưởng Làng chết: Có 10s di chúc truyền huy hiệu                 │
│   (Hết 10s AFK ➡️ Server tự chuyển ngẫu nhiên cho người còn sống)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ GIAI ĐOẠN 3: THẢO LUẬN TỰ DO (60s - 180s)                              │
│ • Mở kênh Town Chat cho toàn bộ người sống.                             │
│ • Hỗ trợ bàn phím Chat Nhanh (Quick Chat Presets).                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ GIAI ĐOẠN 4: BIỂU QUYẾT ĐỒNG THỜI & PHÁN QUYẾT (2 VÒNG)                │
│ • VÒNG 1: Bỏ phiếu chỉ định nghi phạm (30s). Có nút Phiếu Trắng        │
│   (Người chơi AFK/quá giờ tự động tính là Bỏ Phiếu Trắng).             │
│ • NẾU HÒA PHIẾU CHỈ ĐỊNH (từ 2 người cùng số phiếu cao nhất):          │
│   ➡️ Mở VÒNG 2 HIỆP PHỤ (Tie-breaker 15s) chỉ giữa các nghi phạm đó.    │
│   ➡️ Hết Vòng 2 mà vẫn tiếp tục hòa hoặc Phiếu Trắng đa số:            │
│      THA BỔNG CẢ LÀNG, KẾT THÚC NGÀY, TRỜI TỐI NGAY LẬP TỨC.           │
│ • NẾU PHÂN ĐỊNH 1 NGƯỜI DUY NHẤT BỊ VOTE CAO NHẤT:                     │
│   ➡️ Đưa lên Bục Biện Hộ (20s - chỉ nghi phạm được chat/nói,           │
│      toàn bộ người chơi khác bị mute trên Town Chat)                   │
│   ➡️ Phán quyết toàn làng: [Có Tội 💀] vs [Vô Tội ✨] (15s):            │
│      - Nghi phạm trên bục bị KHÓA vote (tuyệt đối KHÔNG được tự vote). │
│      - Phiếu của Trưởng Làng (nếu có) được tính nhân đôi (x2 vote).   │
│      - Có Tội > Vô Tội: Xử tử treo cổ (lật mở bài theo cài đặt phòng). │
│      - Vô Tội ≥ Có Tội: Tha bổng, kết thúc ngày, trời tối.             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 8. MA TRẬN GIẢI QUYẾT XUNG ĐỘT KỸ NĂNG & HỒI KẾT 1V1

### 8.1. Xung đột Kỹ năng
- **Bảo Vệ tự bảo vệ bản thân:** Được quyền tự bảo vệ mình, nhưng tuyệt đối không được bảo vệ cùng 1 người (kể cả chính mình) 2 đêm liên tiếp.
- **Bảo Vệ vs Thuốc Độc Phù Thủy:** Khiên Bảo Vệ chỉ đỡ được móng vuốt Sói, **không đỡ được Thuốc Độc**.
- **Kẻ Độc Hành (Arsonist) vs Khiên Bảo Vệ:** Ngọn lửa thiêu rụi khi châm lửa thiêu xuyên khiên Bảo Vệ (chỉ Thầy Tu mới hóa giải được dầu xăng trước đó).
- **Bảo Vệ + Phù Thủy cùng cứu 1 người:** Phù Thủy vẫn nhìn thấy nạn nhân bị Sói cắn nếu còn bình cứu. Nếu Phù Thủy quyết định dùng bình Cứu thì nạn nhân an toàn, nhưng Phù Thủy vẫn bị tiêu hao mất 1 bình Cứu.
- **Phù Thủy tự cứu mình:** Chỉ dùng cho bản thân ở Đêm 1. Mỗi đêm chỉ dùng tối đa 1 bình.
- **Bầy Sói hòa phiếu vote cắn:** Hết giờ đếm ngược mà hòa phiếu thì kích hoạt **5s gia hạn** kèm dòng chữ đỏ: *"Sói hãy đồng nhất mục tiêu!"*. Sau 5s vẫn hòa phiếu ➡️ Bầy Sói mất lượt cắn đêm đó.
- **Sói trong Cặp Đôi (Lovers):** Để bảo vệ tình yêu và tránh tự sát dây chuyền, hệ thống **khóa (disable) mục tiêu người yêu** trên giao diện vote cắn ban đêm của con Sói đó (Sói không thể tự vote cắn người yêu của mình).
- **Kẻ Trộm (Thief) Đêm 1:** Nếu 2 lá bài thừa ngoài rìa đều là Ma Sói ➡️ Bắt buộc đổi thành Ma Sói. Nếu có lá Dân/Phe 3 ➡️ Được tự do đổi hoặc giữ nguyên.
- **Già Làng:** Bị Sói cắn lần 1 mất 1 mạng. Bị Phù Thủy đầu độc hoặc Dân treo cổ chết ngay lập tức và toàn bộ Dân Làng bị tước hết kỹ năng đặc biệt.
- **Thợ Săn nổ súng:**
  - Nếu Thợ Săn chết do Thuốc Độc của Phù Thủy ➡️ Chết trong câm lặng, **không được nổ súng**.
  - Danh sách mục tiêu của Thợ Săn trên giao diện chỉ hiển thị **những người còn sống** (loại bỏ những ai đã tử nạn cùng đêm).
- **Bảo Vệ vs Sói Nguyền:** Nếu bầy Sói chọn cắn Sói Nguyền nhưng đêm đó Bảo Vệ đã dựng khiên cho Sói Nguyền ➡️ Khiên Bảo Vệ chặn thành công vết cắn. Sói Nguyền hoàn toàn an toàn, **không bị thương và KHÔNG biến thành Ma Sói** (vẫn tiếp tục giữ thân phận Phe Dân Làng cho đến khi bị cắn trúng mà không có khiên).
- **Sói Nguyền bị Sói cắn (khi không có khiên):** Không chết, chuyển phe thành Sói. Phù Thủy nhận báo *"Không có ai bị thương"*.
- **Người Hóa Sói (Doppelganger) & Kẻ Đánh Tráo (Troublemaker):** Khi Doppelganger kích hoạt thừa kế, nhận lại toàn bộ kỹ năng ở trạng thái mới (Full Charge). Khi Troublemaker tráo bài, State Machine cập nhật quyền hạn âm thầm mà không làm lộ danh tính phe Sói.
- **Cơ chế Hàng Đợi Tử Nạn & Phản Ứng Dây Chuyền (Death Queue - FIFO):**
  - Khi một hoặc nhiều người tử nạn, Server đưa nạn nhân vào `deathQueue` và giải quyết tuần tự theo nguyên tắc First-In, First-Out:
    1. Nạn nhân chính tử nạn (do Sói cắn / Treo cổ / Đâm chém / Thuốc độc).
    2. Nếu nạn nhân là **Thợ Săn** (và không chết do thuốc độc): Kích hoạt 15s nổ súng ➡️ Mục tiêu bị trúng đạn được đẩy vào `deathQueue`.
    3. Giải quyết hiệu ứng **Cặp Đôi (Lovers)**: Nếu 1 người chết, người kia lập tức tự sát vì tình và được đẩy vào `deathQueue`.
    4. Giải quyết hiệu ứng **Kẻ Báo Thù (Avenger)**: Kéo theo mục tiêu báo thù vào `deathQueue`.
    5. Lặp lại tuần tự cho đến khi `deathQueue` hoàn toàn rỗng.
    6. **Chỉ sau khi toàn bộ chuỗi tử nạn kết thúc**, Server mới chạy hàm kiểm tra Ma Trận Thắng / Thua (Win Condition) để tránh phán quyết vội vàng khi còn người sắp chết theo dây chuyền.
- **Cặp Đôi:** Một người chết, người kia lập tức tự sát vì tình (kích hoạt đạn Thợ Săn nếu người tự sát là Thợ Săn).

### 8.2. Quy tắc Phán Quyết ở Hồi Kết Tay Đôi (End-Game 1v1 Climax)
Khi ván đấu chỉ còn đúng 2 người sống sót:
1. **1 Ma Sói vs 1 Dân Làng:** Phe Ma Sói **thắng ngay lập tức** (vì ban ngày biểu quyết hòa phiếu, ban đêm Sói chắc chắn cắn chết Dân).
2. **1 Ma Sói vs 1 Thợ Săn:** Ban đêm Sói cắn Thợ Săn ➡️ Thợ Săn nổ súng bắn chết Sói ➡️ Cả 2 cùng chết ➡️ **Kết quả: HÒA (Cả làng diệt vong)**.
3. **1 Ma Sói vs 1 Sát Thủ (Serial Killer):** Ban đêm Sói cắn Sát Thủ, Sát Thủ đâm chết Sói ➡️ **Kết quả: HÒA (Cả làng diệt vong)**.
4. **1 Ma Sói vs 1 Kẻ Chán Đời (Tanner) vào Ban Đêm:** Sói cắn chết Tanner ➡️ **Phe Ma Sói thắng**.
5. **1 Ma Sói vs 1 Kẻ Chán Đời (Tanner) vào Ban Ngày:** Nếu cả 2 cùng bỏ phiếu treo cổ Tanner (2 phiếu) ➡️ Tanner bị đưa lên giàn treo ➡️ **Kẻ Chán Đời (Tanner) THẮNG NGAY LẬP TỨC**.

---

## 9. MA TRẬN ĐIỀU KIỆN THẮNG / THUA TOÀN DIỆN (WIN CONDITIONS)

Sau mỗi lần có người chết và `deathQueue` đã rỗng hoàn toàn, Server tự động kiểm tra:

| Trường hợp | Phe Chiến Thắng | Thông Điệp Kết Thúc |
| :--- | :--- | :--- |
| **Kẻ Chán Đời (Tanner) bị treo cổ ban ngày** | 🤡 **Kẻ Chán Đời** | *"Kẻ Chán Đời đã đạt được ước nguyện bị treo cổ và giành chiến thắng ngoạn mục!"* |
| **Không còn ai sống sót** | 💀 **Hòa (Cả làng diệt vong)** | *"Không một ai sống sót sau đêm kinh hoàng! Cả bầy Sói và Dân Làng đều đã tử nạn."* |
| **Cặp Đôi khác phe là 2 người sống sót cuối** | 💘 **Cặp Đôi Yêu Nhau** | *"Tình yêu vượt qua ranh giới chủng tộc! Cặp đôi đã sống sót đến cuối cùng."* |
| **Sói Trắng là người duy nhất sống sót** | 🐺 **Sói Trắng** | *"Sói Trắng đã tiêu diệt cả Dân Làng lẫn bầy đồng loại để độc chiếm vương quốc bóng đêm!"* |
| **Sát Thủ / Kẻ Độc Hành sống sót cuối cùng** | 🔪 **Phe Thứ 3 (Solo)** | *"Kẻ sát nhân cô độc đã thanh trừng toàn bộ ngôi làng và giành chiến thắng tuyệt đối!"* |
| **Số Sói $\ge$ Tổng người còn lại VÀ không còn Phe Thứ 3 thù địch (Sát Thủ, Kẻ Độc Hành, Sói Trắng) VÀ không có Cặp Đôi khác phe sống sót** | 🐺 **Phe Ma Sói** | *"Số lượng Ma Sói đã áp đảo hoàn toàn các thế lực còn lại! Ngôi làng chìm trong bóng tối vĩnh hằng."* |
| **Toàn bộ Sói và Phe Thứ 3 thù địch (Sát Thủ, Kẻ Độc Hành, Sói Trắng) đều đã chết, và Cặp Đôi khác phe không còn** | 🎉 **Phe Dân Làng** | *"Toàn bộ hiểm họa bóng đêm đã bị tiêu diệt! Bình yên và ánh sáng đã trở lại với ngôi làng."* |
| **3 ngày 3 đêm liên tiếp không có ai chết** | ⚖️ **Hòa (Stalemate)** | *"Trận đấu kéo dài bất phân thắng bại trong hòa bình! Kết thúc hòa."* |

---

## 10. HỆ THỐNG GIAO TIẾP 4 KÊNH, CHAT NHANH & CHỐNG GIAN LẬN

### 10.1. Phân quyền 4 Kênh Chat thời gian thực
1. `TOWN_CHAT`: Mở ban ngày cho người sống. Ban đêm tự động mute toàn bộ.
2. `WOLF_CHAT`: Mở ban đêm riêng cho bầy Ma Sói.
3. `LOVERS_CHAT`: Kênh riêng mở liên tục 24/24 cho 2 người trong Cặp Đôi.
4. `GHOST_CHAT`: Dành riêng cho người đã chết và khán giả.

### 10.2. Chống Gian Lận & Metagaming (Discord / Zalo Leaks)
- **Người chết trong `GHOST_CHAT` tuyệt đối không nhìn thấy thân phận của người còn sống** cho đến khi trận đấu kết thúc hoàn toàn (chống việc người chết mách bài qua Discord/Zalo).
- Giới hạn cooldown gửi tin nhắn tối thiểu 1.5s/tin.

### 10.3. Hệ Thống Chat Nhanh (Quick Chat Presets)
Trên Web và Mobile đều có các nút biểu mẫu 1-chạm:
- `[Dân Làng]` *"Tôi là Dân Làng lương thiện!"*
- `[Nghi Ngờ]` *"Tôi nghi ngờ người số [Ghế X]!"*
- `[Tiên Tri]` *"Đêm qua tôi soi người số [Ghế X] ra Sói!"*
- `[Bảo Vệ]` *"Đêm qua tôi đã bảo vệ an toàn!"*
- `[Kêu Oan]` *"Tôi vô tội, đừng vote tôi!"*
- `[Phiếu Trắng]` *"Đề nghị cả làng bỏ phiếu trắng hôm nay."*

---

## 11. ÂM THANH TỰ ĐỘNG, APP CHẠY NGẦM & XỬ LÝ SỰ CỐ / AFK

### 11.1. Hệ thống Âm Thanh Tự Động & Cài Đặt Âm Lượng
- Server tự động gửi sự kiện phát âm thanh theo phase:
  - Trời tối ➡️ Tiếng Sói hú rùng rợn.
  - Bình minh ➡️ Tiếng chuông nhà thờ ban mai.
  - Xử tử treo cổ ➡️ Tiếng giá treo cổ sập xuống.
  - Thợ Săn nổ súng ➡️ Tiếng súng trường vang dội.
  - Đếm ngược 5 giây cuối ➡️ Tiếng đồng hồ tích tắc hồi hộp.
- **Nút Cài Đặt Âm Lượng:** Trên Header Web & Mobile có nút **Tắt / Bật Âm Thanh (Mute)** và thanh trượt âm lượng độc lập.

### 11.2. Xử lý Ứng dụng Chạy Ngầm trên Mobile (`AppState`)
- Lắng nghe sự kiện `AppState` trên React Native:
  - Khi người chơi chuyển sang app khác (Zalo, gọi điện) rồi quay lại (`active`), ứng dụng tự động phát event `reconnect_game` kèm `sessionToken` và `currentRoomCode` để đồng bộ lại State mới nhất mà không bị văng ra Sảnh.

### 11.3. Grace Period 45s & Xử lý Bỏ Cuộc (Abandonment)
- Giữ nguyên trạng thái và vị trí ghế của người chơi trong **45 giây** khi mất mạng hoặc out app.
- **Tự động chuyển phase (Auto-skip per phase):** Trong thời gian 45s này, nếu đến lượt hành động cá nhân (như soi bài, bình phù thủy, biện hộ), hệ thống chỉ chờ hết thời gian đếm ngược của phase đó (15s - 30s) rồi tự động chuyển phase ngay để ván chơi không bị ngưng trệ. Người chơi vẫn có thể reconnect vào các phase tiếp theo trong vòng 45s.
- Quá 45s không vào lại ➡️ Nhân vật rơi vào trạng thái **"Đột tử do kiệt sức"** vào đầu phase kế tiếp (không kích hoạt phản đòn).
- Người chơi cố tình thoát ván bị trừ **10 Điểm Uy Tín** và **cấm tìm trận 5 phút**.

### 11.4. Cơ Chế Chuyển Giao Quyền Chủ Phòng (Host Migration)
- Nếu Chủ phòng (Host) chủ động bấm *"Rời phòng"* hoặc mất kết nối quá thời gian **Grace Period 45s**:
  - Hệ thống tự động kích hoạt **Host Migration**: Chuyển giao quyền Host (quyền bấm Chơi Lại, đuổi người, cài đặt phòng) cho người chơi còn sống có **Số Ghế (#Seat) nhỏ nhất** kế tiếp trong phòng.
  - Thông báo toàn phòng trên hệ thống: *"Chủ phòng đã ngắt kết nối. Người chơi số [Ghế X] hiện là Chủ phòng mới!"*.

---

## 12. BẢNG TỔNG KẾT VẬN MỆNH & TÍNH NĂNG CHƠI LẠI (PLAY AGAIN)

### 12.1. Màn Hình Vinh Danh & Lật Toàn Bộ Thẻ Bài
Khi ván đấu kết thúc:
- Hiển thị hiệu ứng chiến thắng của phe thắng cuộc (Pháo hoa / Khói đen quỷ dị).
- Lật mở công khai thẻ bài của toàn bộ người chơi trong phòng.
- Vinh danh các danh hiệu MVP: *Người sống sót xuất sắc*, *Thám tử soi đúng nhiều nhất*, *Sát thủ cắn nhiều nhất*.
- Xem lại dòng sự kiện trận đấu (Event Timeline).

### 12.2. Nút "Chơi Lại / Giữ Phòng" (Play Again / Rematch)
- Chủ phòng bấm nút **`[Chơi Lại / Giữ Phòng]`**:
  - Toàn bộ người chơi trong phòng được đưa về lại Sảnh phòng chờ (Room Lobby) với mã phòng 4 số cũ.
  - Trạng thái tất cả thành viên chuyển về `isReady = false`.
  - Mọi người không cần phải thoát ra sảnh ngoài và gõ lại mã phòng, sẵn sàng bắt đầu ngay ván mới!

---

## 13. CHIẾN LƯỢC TRIỂN KHAI VÀ PHÂN KỲ BỘ BÀI (ENGINEERING ROADMAP)

Nhằm tối ưu hóa hiệu năng, giảm thiểu xung đột logic và đảm bảo Game State Machine trên Backend vận hành tuyệt đối ổn định, hệ thống được phân kỳ triển khai bộ bài theo 3 giai đoạn:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CHIẾN LƯỢC 3 ĐỢT TRIỂN KHAI                     │
│                                                                        │
│  [ĐỢT 1] Core Deck (Bộ 7 Vai Chuẩn - MVP Engine)                       │
│          • Dân, Sói Thường, Tiên Tri, Bảo Vệ, Phù Thủy, Thợ Săn        │
│          • Danh hiệu Trưởng Làng & Kẻ Chán Đời / Cupid                 │
│          ➡️ Chạy mượt mà 100% vòng lặp Ngày/Đêm & 4 Kênh Chat          │
│       │                                                                │
│  [ĐỢT 2] Expansion 1 (Sói Chức Năng & Biến Thể Tấn Công)              │
│          • Sói Con, Sói Đầu Đàn, Sói Trắng, Sói Nguyền, Sói Ẩn, Sói Già│
│       │                                                                │
│  [ĐỢT 3] Expansion 2 (Tương Tác Phức Tạp & Phe Thứ 3 Nâng Cao)         │
│          • Kẻ Trộm, Doppelganger, Troublemaker, Sát Thủ, Kẻ Độc Hành, │
│            Già Làng, Thầy Tu, Pháp Sư, Hiệp Sĩ, v.v.                   │
└────────────────────────────────────────────────────────────────────────┘
```

### 13.1. Đợt 1: Bộ Bài Cốt Lõi (Core Deck - 7 Vai Kinh Điển)
* **Mục tiêu:** Xây dựng khung xương sống vững chắc cho Game Engine, hoàn thiện toàn bộ luồng kết nối Socket.IO, State Machine ngày/đêm, 4 kênh chat, bầu cử, biện hộ và kiểm tra thắng/thua.
* **Danh sách vai trò:**
  1. 🐺 **Ma Sói (Thường):** Cơ chế vote cắn đêm, gia hạn 5s khi hòa phiếu.
  2. 🌾 **Dân Làng:** Ngủ say ban đêm, thảo luận ban ngày.
  3. 🔮 **Tiên Tri:** Soi ra Sói hoặc Dân.
  4. 🛡️ **Bảo Vệ:** Dựng khiên chặn cắn (không kê 1 người 2 đêm liên tiếp).
  5. 🧪 **Phù Thủy:** 1 bình Cứu, 1 bình Độc (tự cứu đêm 1, mỗi đêm tối đa 1 bình).
  6. 🏹 **Thợ Săn:** Chết kích hoạt 15s nổ súng ban ngày.
  7. 🌟 **Trưởng Làng:** Danh hiệu bầu cử Ngày 1 (x2 vote, di chúc 10s khi chết).
  8. 🤡 **Kẻ Chán Đời (Tanner) / 💘 Cupid:** Phe thứ 3 / cặp đôi cơ bản.

### 13.2. Đợt 2: Mở Rộng Sói Biến Thể (Expansion 1)
* Tích hợp các kỹ năng biến dị của bầy Sói:
  * Sói Con (cắn 2 người đêm sau khi chết).
  * Sói Đầu Đàn (lây nhiễm).
  * Sói Trắng (cắn sói khác mỗi 2 đêm).
  * Sói Nguyền (hóa sói khi bị cắn mà không có khiên Bảo Vệ).
  * Sói Ẩn (kháng soi Tiên Tri) & Sói Già (kháng độc).

### 13.3. Đợt 3: Mở Rộng Toàn Diện 34 Lá (Expansion 2)
* Hoàn thiện các cơ chế hoán đổi và phá cách:
  * Kẻ Trộm (chọn từ 2 lá rìa thừa).
  * Người Hóa Sói (Doppelganger - thừa kế full charges).
  * Kẻ Đánh Tráo (Troublemaker - tráo 2 người, cập nhật role mới).
  * Sát Thủ & Kẻ Độc Hành (đòn tấn công xuyên khiên).
  * Già Làng (2 mạng, phạt mất phép cả làng), Thầy Tu (giải tà/xăng), Pháp Sư, Cô Bé.

