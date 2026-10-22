---
description: Phân tích dự án và đề xuất 3 hướng thiết kế khác nhau trước khi viết code UI
---

Workflow: Design Brief
Lệnh dự kiến: /design-brief

Mục tiêu: Hiểu sản phẩm, biến yêu cầu mơ hồ thành một hướng thiết kế có lý do, cho người dùng chọn trước khi triển khai UI.

Ràng buộc: Trong các bước 1–6, không viết code màn hình, không cài package và không thay đổi codebase. Chỉ đọc/kiểm tra dự án và trình bày đề xuất.

Khi nào chạy workflow này?
Chạy khi bắt đầu dự án UI mới, tạo màn hình mới mà chưa có hướng thiết kế được chốt, hoặc khi người dùng yêu cầu thiết kế lại đáng kể. Không cần chạy lại chỉ để sửa một lỗi giao diện nhỏ nếu DESIGN.md hiện có đủ hướng dẫn.
Bước 1 — Khảo sát dự án
Đọc những phần hiện có, nếu có:
- README.md, package.json, app.json/app.config.*.
- Cấu trúc app/, routes, các màn hình chính và component dùng chung.
- DESIGN.md, thư mục theme/, các tài liệu trong docs/.
- Mọi ảnh tham chiếu trong docs/references/.
- Các pattern về dữ liệu, trạng thái loading/error/empty và điều hướng liên quan đến màn hình cần làm.
Ghi nhận phiên bản Expo SDK từ dependency expo trong package.json; không đoán hoặc tự nâng phiên bản. Phân biệt rõ điều đã quan sát từ repository và điều đang suy luận.

Nếu không có source hoặc tài liệu cần thiết, không bịa rằng đã đọc. Nêu thiếu gì và đưa ra đề xuất dựa trên thông tin sẵn có.
Bước 2 — Xác định sản phẩm và nhiệm vụ người dùng
Tóm tắt thành 3 câu ngắn:
1. Sản phẩm: App này giúp ai làm việc gì?
2. Người dùng và bối cảnh: Ai sử dụng, ở đâu/khi nào, với thiết bị hoặc giới hạn nào?
3. Nhiệm vụ quan trọng nhất: Người dùng cần hoàn thành việc gì nhanh, rõ và đáng tin cậy?
Trước khi hỏi, hãy tận dụng bằng chứng trong README, routes, UI hiện tại và yêu cầu người dùng. Nếu một thông tin còn thiếu nhưng có thể suy luận hợp lý, đưa ra giả định có ghi nhãn thay vì hỏi dồn dập. Chỉ hỏi khi câu trả lời có thể làm thay đổi rõ rệt hướng thiết kế; nếu workflow yêu cầu dừng để người dùng trả lời, chỉ hỏi câu hỏi quan trọng nhất.
Bước 3 — Chẩn đoán UI hiện có
Nếu đã có UI, đánh giá theo từng màn hình liên quan. Mỗi nhận xét cần chỉ rõ:
- Thành phần hoặc vùng cụ thể.
- Hành vi/vấn đề quan sát được.
- Tác động lên người dùng.
- Hướng cải thiện đề xuất.
Đối chiếu với .agent/rules/ui-design-rules.md, nhưng không gọi mọi mẫu quen thuộc là xấu theo mặc định. Có thể giữ pattern đang hiệu quả và nhất quán với sản phẩm.

Nếu chưa có UI, ghi rõ đây là dự án mới và không giả tạo phần chẩn đoán.
Bước 4 — Phân tích tham chiếu
Với mỗi ảnh trong docs/references/, ghi nhận:
- Bố cục và thứ bậc thông tin.
- Nhịp spacing/căn lề.
- Màu và cách phân vai trò màu.
- Typography, độ dài dòng và tương phản.
- Hình khối, border, shadow/depth.
- Tương tác/chuyển động có thể quan sát được; không suy đoán phần không thấy trong ảnh.
Rút ra nguyên tắc có thể áp dụng cho dự án. Không sao chép nguyên màn hình, thương hiệu hoặc tài sản nhận diện của tham chiếu.
Bước 5 — Đề xuất 3 hướng thiết kế thực sự khác nhau
Ba hướng phải khác biệt về cảm xúc và ít nhất hai yếu tố cấu trúc (ví dụ: bố cục, cách điều hướng, phân cấp thông tin, mô hình tương tác, cách biểu diễn dữ liệu), không chỉ đổi màu.

Mỗi hướng phải có đủ các mục:
1. Tên hướng + cảm xúc: Một câu mô tả cảm giác và ấn tượng muốn tạo.
2. Lý do phù hợp: Liên hệ trực tiếp với người dùng, tình huống sử dụng và nhiệm vụ chính.
3. Màu: 4–6 màu có tên, mã hex và vai trò. Kiểm tra rằng màu chữ/nền chính có tương phản đọc được; ghi nhận màu semantic cho success, warning, error nếu cần.
4. Typography: Một hoặc hai font, vai trò, weight, thang cỡ chữ/line height. Font phải có Vietnamese subset; chưa xác minh thì ghi là cần kiểm tra, không khẳng định đã xác minh.
5. Hình khối và chiều sâu: Radius theo nhóm thành phần, quy tắc border/shadow và cách tạo phân cấp.
6. Bố cục: Mô tả cấu trúc, quy tắc căn lề và wireframe ASCII cho màn hình quan trọng nhất. Wireframe phải có nội dung đúng ngữ cảnh, không chỉ là các ô chung chung.
7. Tương tác: Phong cách chuyển động, một signature interaction cụ thể, lúc nào xuất hiện, phản hồi của nó và thư viện dự kiến. Không đề xuất thư viện khi chưa có nhu cầu thực tế.
8. Trạng thái UI: Cách xử lý loading, empty, error, disabled và nội dung dài nếu chúng liên quan đến màn hình.
9. Khả năng tiếp cận: Vùng chạm, tương phản, nhãn hỗ trợ và reduced motion.
10. Rủi ro/trade-off: Khó khăn về khả năng đọc, dữ liệu, hiệu năng, native dependency, Expo Go/development build hoặc chi phí duy trì.
11. Điểm dễ trở thành giao diện đại trà: Mẫu nào cần tránh trong hướng này và sẽ tránh bằng cách nào.
Wireframe mẫu (chỉ minh họa định dạng)
┌─────────────────────────────┐
│ Thanh điều hướng / ngữ cảnh │
├─────────────────────────────┤
│ Nội dung chính của nhiệm vụ │
│ Dữ liệu hoặc trạng thái cần  │
│ người dùng chú ý             │
├─────────────────────────────┤
│ Hành động chính              │
└─────────────────────────────┘
Thay các nhãn khái quát bằng nội dung đúng sản phẩm. Không sử dụng wireframe mẫu này thay cho thiết kế cụ thể.
Bước 6 — Tự phản biện
Với từng hướng, trả lời:
- Nếu đổi tên app và logo, hướng này có thể dùng nguyên xi cho nhiều app khác không? Nếu có, làm nó đặc trưng hơn bằng ngữ cảnh và nhiệm vụ thật.
- Có đang dựa vào một trong các mẫu “đại trà” trong rules mà chưa có lý do không?
- Điểm nhấn có cạnh tranh với quá nhiều thành phần khác không?
- Thiết kế có khả thi trên phiên bản Expo SDK và kiến trúc hiện có không?
- Có trạng thái lỗi, dữ liệu dài, tiếng Việt và khả năng tiếp cận nào chưa được tính đến không?
Không dùng lời khen chung chung để thay cho phân tích trade-off.
Bước 7 — Trình bày và dừng
Trình bày:
1. Tóm tắt sản phẩm, người dùng và nhiệm vụ chính.
2. Những gì đang tốt/vướng trong UI hiện tại (nếu có).
3. Ba hướng thiết kế theo cùng một cấu trúc để dễ so sánh.
4. Bảng so sánh ngắn: bản sắc, độ dễ dùng, độ phức tạp triển khai, rủi ro chính.
5. Khuyến nghị một hướng, kèm lý do và trade-off; không ép người dùng phải chọn hướng được khuyến nghị.
Sau đó dừng. Không code màn hình, không tạo package, không áp dụng tokens và không tự chọn thay người dùng. Người dùng có thể chọn một hướng, phối hợp có chủ đích hoặc yêu cầu đề xuất lại.
Bước 8 — Sau khi người dùng chốt hướng
Chỉ thực hiện sau khi người dùng chọn hoặc xác nhận hướng:
1. Tạo/cập nhật DESIGN.md ở thư mục gốc theo mẫu bên dưới. Giữ lại thông tin hữu ích hiện có; không ghi đè phần không liên quan.
2. Tạo/cập nhật theme/ hoặc hệ thống tokens hiện tại cho màu, typography, spacing, radius, shadow/elevation và motion. Không tạo hệ thống token thứ hai nếu dự án đã có.
3. Kiểm tra component nền hiện có. Tái sử dụng Screen, Text, Button; chỉ tạo mới khi thực sự thiếu và tuân thủ kiến trúc dự án.
4. Ghi quyết định vào docs/design-log.md.
5. Chọn một màn hình đại diện làm prototype và chạy /ui-review trước khi triển khai hàng loạt.
6. Sau đó làm từng màn hình một, tuân thủ rules và review sau mỗi màn hình.
Mẫu DESIGN.md
# Design System

## Sản phẩm
- Mô tả:
- Người dùng chính và bối cảnh:
- Nhiệm vụ quan trọng nhất:
- Nền tảng/thiết bị ưu tiên:

## Hướng thiết kế đã chọn
- Tên và cảm xúc:
- Vì sao phù hợp:
- Trade-off đã chấp nhận:

## Tokens
- Màu: tên, giá trị, vai trò và màu semantic
- Typography: font, Vietnamese subset đã xác minh/chưa xác minh, weight, size, line height
- Spacing: thang và quy tắc áp dụng
- Radius: giá trị theo loại thành phần
- Độ sâu: border, shadow/elevation và trường hợp sử dụng
- Motion: thời lượng/nguyên tắc và reduced-motion fallback

## Bố cục
- Mô hình điều hướng:
- Quy tắc căn lề:
- Quy tắc thích ứng theo kích thước màn hình:

## Signature interaction
- Mô tả:
- Màn hình/trạng thái:
- Thư viện (nếu có):
- Fallback/reduced motion:

## Thành phần và trạng thái chuẩn
- Component dùng chung:
- Loading/empty/error/disabled:
- Accessibility:

## Điều tuyệt đối tránh trong dự án này
- ...

## Nội dung và giọng điệu
- Giọng điệu:
- Từ vựng cố định cho hành động chính: