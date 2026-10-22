---
description: Chạy bản web của Expo, chụp ảnh, tự phê bình theo DESIGN.md rồi sửa, lặp tối đa 3 vòng
---

Workflow: UI Review — Chụp ảnh, phê bình và cải thiện
Lệnh dự kiến: /ui-review

Mục tiêu: Đánh giá UI dựa trên bằng chứng từ ảnh, tương tác và kiểm tra kỹ thuật; sửa các vấn đề quan trọng mà không viết lại màn hình tuỳ tiện.

Điều kiện: Cần có DESIGN.md đã được chốt. Workflow phải trung thực về môi trường và công cụ thực sự khả dụng.

Bước 0 — Xác định phạm vi và khả năng kiểm tra
1. Xác định màn hình vừa tạo/sửa, routes liên quan và các trạng thái cần đánh giá.
2. Đọc DESIGN.md, .agent/rules/ui-design-rules.md, docs/design-log.md nếu có và code của màn hình.
3. Xác nhận phiên bản Expo SDK từ package.json; không nâng SDK để phục vụ review.
4. Kiểm tra lệnh chạy app, script lint/typecheck/test và công cụ browser/Playwright hiện có.
5. Kiểm tra trạng thái Git để không ghi đè thay đổi khác.
Nếu thiếu DESIGN.md, dừng việc phán xét mức độ bám thiết kế; đề nghị chạy /design-brief. Nếu không có browser hoặc không thể tạo screenshot, không được tuyên bố đã chụp ảnh hay hoàn tất visual review. Hãy thực hiện những kiểm tra còn khả thi và ghi rõ giới hạn.
Bước 1 — Khởi chạy bản web hoặc môi trường phù hợp
- Ưu tiên lệnh/script đã được dự án định nghĩa và tài liệu tương thích với SDK đang dùng.
- Nếu cần Web, kiểm tra cấu hình Expo Web hiện tại trước. Chỉ cài react-native-web, react-dom, @expo/metro-runtime hoặc package khác khi thực sự thiếu, tương thích với SDK và có lý do rõ ràng.
- Không thay đổi dependency chỉ để làm cho review “trông có vẻ chạy được”. Nếu có lỗi môi trường, phân biệt lỗi môi trường với lỗi UI và ghi lại nguyên nhân.
- Dùng browser agent/Playwright thực sự có sẵn để mở đúng route. Không bịa kết quả từ một lần chạy không thành công.
Bước 2 — Tạo bộ screenshot có thể so sánh
Với mỗi màn hình vừa thay đổi, chụp tại viewport:
- 390 × 844 — tham chiếu kích thước iPhone phổ biến.
- 360 × 800 — tham chiếu thiết bị Android nhỏ.
Lưu ảnh trong .screenshots/ (đảm bảo thư mục đã được thêm vào .gitignore) theo dạng:

<screen>-<state>-<viewport>-v<round>.png

Ví dụ: profile-loaded-390x844-v1.png.

Chụp các trạng thái có liên quan và có thể tái hiện:
- Loaded/default.
- Empty.
- Loading.
- Error/retry.
- Nội dung dài: tên người, tiêu đề, câu tiếng Việt nhiều dấu, dữ liệu dài.
- Disabled/pressed hoặc trạng thái mở rộng khi có tương tác tương ứng.
- Các trạng thái nghiệp vụ đặc thù như mất mạng, quyền bị từ chối hoặc danh sách rất dài khi có liên quan.
Không cần tạo trạng thái không tồn tại trong sản phẩm chỉ để đủ checklist. Dùng fixtures hoặc dữ liệu kiểm thử tách biệt khi có thể; không ghi dữ liệu giả vào backend production. Nếu không thể tái hiện trạng thái, ghi rõ là chưa kiểm tra.

Nếu đã có screenshot vòng trước, giữ lại để so sánh. Không tuyên bố “trước/sau” khi không có ảnh vòng trước thực tế.
Bước 3 — Tự phê bình bằng văn bản
Đánh giá từng mục; với mỗi vấn đề, ghi vị trí cụ thể, tác động, mức độ ưu tiên và bằng chứng (ảnh, hành vi hoặc kết quả kiểm tra).
1. Bám DESIGN.md: Màu, font, spacing, radius, depth và motion có dùng đúng tokens/hướng đã chốt không?
2. Thứ bậc thị giác: Trong 2 giây đầu, mắt đi đâu? Có một điểm nhấn phù hợp hay nhiều phần tử cùng tranh chú ý?
3. Tính đặc trưng: Nếu che logo, giao diện có còn mang ngôn ngữ của sản phẩm không? Signature interaction có xuất hiện đúng chỗ không?
4. Mẫu đại trà: Đối chiếu với danh sách trong rules. Nêu đúng thành phần cụ thể và lý do nó không phù hợp; không loại bỏ một pattern chỉ vì nó phổ biến.
5. Nhịp và căn lề: Spacing có theo token? Căn lề có nhất quán? Có vùng quá chật hoặc quá rỗng không?
6. Typography và tiếng Việt: Có tràn/cắt chữ, xuống dòng xấu, glyph thiếu dấu, line height bất hợp lý hoặc ellipsis làm mất thông tin không?
7. Màu và tương phản: Trạng thái có phân biệt được không? Chữ, icon và điều khiển có dễ nhìn? Nếu chưa đo tương phản, ghi là cần kiểm tra chứ không khẳng định đạt chuẩn.
8. Vùng chạm và trạng thái tương tác: Khu vực bấm có đủ lớn, dễ nhận biết? Pressed/disabled/loading/error có cho biết điều gì xảy ra không?
9. Khả năng tiếp cận: Có accessibility label/role/state phù hợp? Có phụ thuộc hoàn toàn vào màu? Focus/keyboard và reduced motion có được cân nhắc không?
10. Trạng thái dữ liệu: Loading, empty, error, nội dung dài và trường hợp không có quyền có dễ hiểu, có bước tiếp theo phù hợp không?
11. Nền tảng và độ ổn định: Có giả định riêng cho web làm lệch iOS/Android? Có lỗi console, warning, layout jump, gesture conflict hoặc vấn đề hiệu năng rõ ràng không?
12. Bớt đi một thứ: Chi tiết trang trí nào có thể bỏ mà không làm giảm hiểu biết hoặc khả năng sử dụng?
Không suy ra hành vi native từ ảnh web. Một screenshot đẹp không chứng minh keyboard, safe area, haptics, blur, shadow native hay gesture hoạt động tốt.
Bước 4 — Xếp hạng và sửa
Xếp vấn đề thành:
- P0 — Chặn phát hành: Luồng chính hỏng, crash, dữ liệu/ quyền truy cập sai hoặc nội dung thiết yếu không thể dùng.
- P1 — Quan trọng: Gây hiểu nhầm, cản trở hoàn thành nhiệm vụ, lỗi layout lớn, vùng chạm/đọc khó khăn.
- P2 — Tinh chỉnh: Chi tiết thị giác hoặc tương tác có tác động nhỏ.
Chọn tối đa 5 vấn đề có tác động lớn nhất trong một vòng. Ưu tiên P0 rồi P1 trước P2.

Với mỗi vấn đề:
1. Nêu ngắn gọn nguyên nhân.
2. Sửa đúng phạm vi; không viết lại toàn màn hình nếu một thay đổi nhỏ giải quyết được vấn đề.
3. Dùng token trong theme/; nếu thiếu token, bổ sung token có tên và vai trò phù hợp.
4. Không thêm package/animation chỉ để che vấn đề bố cục.
5. Chạy các kiểm tra phù hợp sau khi sửa và ghi nhận kết quả thực tế.
Bước 5 — Chụp lại và so sánh
1. Chụp lại cùng viewport, cùng route và cùng trạng thái bằng hậu tố vòng tăng một, ví dụ v2.
2. So sánh ảnh trước/sau: vấn đề đã giảm chưa, có lỗi mới không, thứ bậc có cải thiện không?
3. Lặp Bước 3–5 tối đa 3 vòng tổng cộng. Dừng sớm khi không còn P0/P1 và các vấn đề P2 còn lại không đáng để sửa.
4. Nếu sau 3 vòng vẫn còn vấn đề, ghi rõ vấn đề, lý do chưa giải quyết và quyết định cần người dùng đưa ra. Không tiếp tục thay đổi vô hạn.
Bước 6 — Kiểm tra kỹ thuật
Chỉ chạy các lệnh thực sự có trong dự án hoặc đã xác minh phù hợp; ví dụ:
- TypeScript/typecheck.
- Lint.
- Unit/component tests liên quan.
- Expo compatibility/dependency check phù hợp với SDK.
- Kiểm tra console và hành vi tương tác trên route được sửa.
Báo rõ lệnh nào đã chạy, lệnh nào thất bại và lệnh nào không có. Không khẳng định build/native test thành công khi chỉ chạy bản web.
Bước 7 — Báo cáo và ghi log
Báo cáo cuối cùng phải ngắn gọn nhưng có thể kiểm chứng, gồm:
- Màn hình và trạng thái đã review.
- Đường dẫn screenshot trước/sau thực tế, nếu có.
- Các vấn đề P0/P1/P2 đã sửa và lý do.
- Kiểm tra đã chạy cùng kết quả.
- Giới hạn chưa kiểm tra được.
- Checklist cần kiểm tra thủ công trên simulator hoặc thiết bị thật.
Cập nhật docs/design-log.md với quyết định thiết kế mới, những gì đã thử, lý do chọn phương án cuối và các vấn đề còn mở. Nếu chưa có thư mục docs/, tạo nó khi phù hợp và không làm thay đổi cấu trúc dự án ngoài nhu cầu.
Checklist bắt buộc trên simulator/thiết bị thật
Không đánh dấu các mục này là đạt chỉ dựa trên web screenshot:
- Safe area, tai thỏ, status bar và thanh điều hướng.
- Bàn phím che input, keyboard avoiding, focus và cuộn đến field đang nhập.
- Shadow/elevation thực tế trên iOS và Android.
- Font native và toàn bộ dấu tiếng Việt.
- expo-blur, Skia, haptics hoặc API native nếu được sử dụng.
- Độ mượt của animation, gesture và trạng thái reduced motion.
- VoiceOver/TalkBack hoặc kiểm tra trợ năng native phù hợp với phạm vi dự án.
Tiêu chí hoàn tất
Một màn hình chỉ được báo là hoàn tất review khi:
- Có đối chiếu với DESIGN.md.
- Các P0 đã được xử lý hoặc được nêu rõ là blocker chưa giải quyết.
- Đã kiểm tra các trạng thái quan trọng có thể tái hiện.
- Các lệnh kiểm tra và screenshot được báo trung thực.
- Các giới hạn native còn lại được nêu rõ.
- docs/design-log.md đã được cập nhật khi có quyết định đáng lưu lại.