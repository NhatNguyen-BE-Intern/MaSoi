---
trigger: always_on
---

UI Design Rules — React Native + Expo
Phạm vi: Áp dụng cho mọi tác vụ tạo mới, chỉnh sửa hoặc review giao diện trong dự án React Native + Expo.

Chế độ đề xuất: Always On. Cách bật phụ thuộc công cụ AI Agent đang dùng; chỉ tạo file này không đảm bảo mọi nền tảng tự nạp nó.

1. Nguyên tắc ưu tiên
Khi có xung đột hoặc thiếu thông tin, áp dụng theo thứ tự:
1. Yêu cầu hệ thống, bảo mật và giới hạn của nền tảng.
2. Yêu cầu cụ thể của người dùng trong tác vụ hiện tại.
3. DESIGN.md đã được người dùng chốt.
4. Các quy tắc trong file này.
5. Quy ước và kiến trúc đang có trong codebase.
Không âm thầm bỏ qua xung đột quan trọng. Nêu rõ xung đột và chọn cách ít phá vỡ nhất; hỏi người dùng khi quyết định có thể làm thay đổi đáng kể sản phẩm.
2. Cổng thiết kế trước khi code
- Trước khi sửa UI, đọc DESIGN.md ở thư mục gốc nếu có. Đây là nguồn chuẩn cho visual direction, tokens, giọng điệu và signature interaction.
- Nếu chưa có DESIGN.md và yêu cầu là tạo màn hình mới hoặc thiết kế lại đáng kể, không viết code UI ngay. Chạy /design-brief trước.
- Nếu nền tảng không hỗ trợ slash workflow hoặc workflow không tồn tại, hãy nói rõ giới hạn đó và thực hiện phần Design Brief theo .agent/workflows/design-brief.md; không giả vờ đã chạy lệnh.
- Với một sửa lỗi nhỏ không làm đổi định hướng thị giác (ví dụ sửa lỗi tràn chữ), có thể sửa trực tiếp theo ngôn ngữ giao diện hiện có, nhưng không được tự ý tạo một hướng thiết kế mới.
- Không tự thay đổi hướng đã duyệt chỉ vì một giải pháp khác dễ code hơn. Nếu cần đổi, nêu lý do và ghi lại quyết định.
3. Khảo sát codebase trước khi sửa
Trước khi cài package hoặc chỉnh component:
1. Đọc package.json, app.json hoặc app.config.*, cấu trúc app/, routing, theme/, component dùng chung và các màn hình liên quan.
2. Tìm xem dự án đã có Screen, Text, Button, token hoặc quy ước tương đương chưa. Tái sử dụng và mở rộng trước; không tạo bản trùng lặp.
3. Kiểm tra trạng thái Git và tránh ghi đè thay đổi chưa commit của người dùng.
4. Ưu tiên thay đổi nhỏ, nhất quán với kiến trúc hiện tại; không refactor ngoài phạm vi chỉ để tiện triển khai UI.
4. Kỹ thuật bắt buộc: Expo + React Native
- Stack mục tiêu: Expo, Expo Router và TypeScript, trừ khi repository hiện tại đã có quyết định kiến trúc khác được xác nhận.
- Xác định phiên bản Expo SDK từ dependency expo trong package.json và kiểm tra cấu hình dự án trước khi chọn API/package. Không đoán phiên bản và không tự nâng SDK.
- Với API hoặc package có yêu cầu tương thích phiên bản, kiểm tra tài liệu Expo/React Native đúng phiên bản dự án và phiên bản package đang cài. Không dùng API đã deprecated khi có lựa chọn được khuyến nghị tương thích.
- Sau khi thêm hoặc cập nhật package, dùng công cụ kiểm tra tương thích phù hợp với dự án, chẳng hạn npx expo install --check nếu phiên bản Expo hỗ trợ; không coi lệnh này là thay thế cho việc đọc lỗi và tài liệu.
- Nếu package cần native code hoặc không hoạt động trong Expo Go, báo rõ trước khi dựa vào nó; nêu rằng cần development build và các bước bổ sung tương ứng. Không khẳng định chạy được trong Expo Go nếu chưa xác minh.
- Không thêm dependency chỉ để tạo hiệu ứng trang trí. Nêu lợi ích, chi phí, rủi ro tương thích và phương án không thêm package khi chúng ảnh hưởng đáng kể đến dự án.
- Không thay đổi routing, dữ liệu giả lập, API, authentication hoặc business logic ngoài phạm vi màn hình nếu không cần thiết và không được yêu cầu.
5. Design tokens và component nền
- Mọi màu, typography, spacing, radius, shadow/elevation và motion phải lấy từ theme/ (hoặc hệ thống token tương đương đã có).
- Không hardcode mã màu, pixel/spacing, radius hoặc shadow rải rác trong component. Literal chỉ được định nghĩa tại file token/theme hoặc nơi thư viện bắt buộc, kèm lý do.
- Nếu thiếu token, bổ sung token có tên mang ý nghĩa và dùng lại được; không tạo token riêng cho một chỗ nếu chưa có lý do.
- Mọi màn hình dùng component Screen dùng chung nếu dự án đã có; component này là nơi thống nhất safe area, keyboard handling và scrolling. Không lồng nhiều lớp xử lý safe area/keyboard gây xung đột.
- Dùng component Text, Button, input và các primitive dùng chung nếu đã có. Nếu chưa có, xác định nhu cầu và tạo nền tảng ở giai đoạn phù hợp; không tái tạo các component đã tồn tại.
- Không dùng View/Text thuần làm lý do để bỏ qua hệ thống component, nhưng cũng không thêm abstraction cho mọi phần tử nhỏ.
6. Typography và tiếng Việt
- Font phải hỗ trợ đầy đủ ký tự tiếng Việt có dấu. Trước khi chốt font, kiểm tra chuỗi mẫu: Ắ Ề Ổ Ữ Ự ặ ệ ổ ữ ự.
- Có thể dùng expo-font hoặc package font phù hợp với SDK. Chỉ giữ splash screen cho đến khi font và các tài nguyên bắt buộc đã sẵn sàng; phải có xử lý lỗi hoặc fallback để app không treo vô hạn.
- Xác định rõ vai trò font, thang cỡ chữ, line height và weight trong DESIGN.md/theme/. Không tự ý trộn nhiều font hoặc weight không có trong hệ thống.
- Kiểm tra tên tiếng Việt dài, nội dung có nhiều dấu, xuống dòng và kích thước chữ lớn; tránh cắt chữ hoặc dùng ellipsis khi làm mất thông tin quan trọng.
7. Tương tác, khả năng tiếp cận và phản hồi
- Ưu tiên Pressable thay cho TouchableOpacity trong code mới, trừ khi có lý do tương thích rõ ràng.
- Mọi phần tử tương tác phải có phản hồi khi nhấn và trạng thái cần thiết: mặc định, pressed, disabled, loading, success hoặc error. Không bắt buộc mọi thành phần có cùng hiệu ứng.
- Vùng chạm mục tiêu tối thiểu 44 × 44 logical points khi có thể; nếu phần hiển thị nhỏ hơn, mở rộng hit area mà không làm sai bố cục.
- Gắn nhãn/role/accessibility state phù hợp cho nút, icon button, input và các phần tử không có nhãn hiển thị rõ ràng. Không dùng màu sắc làm tín hiệu duy nhất.
- Đảm bảo tương phản chữ đủ đọc; ưu tiên kiểm tra theo WCAG cho văn bản và thành phần tương tác. Không tuyên bố đạt chuẩn nếu chưa đo hoặc kiểm tra.
- Hỗ trợ keyboard/focus khi có web hoặc bàn phím vật lý, nhãn input rõ ràng, và thứ tự đọc hợp lý cho công nghệ hỗ trợ.
- Tránh animation gây khó chịu. Với react-native-reanimated, tôn trọng useReducedMotion/thiết lập giảm chuyển động của hệ thống và cung cấp trạng thái thay thế phù hợp.
- Dùng Platform.select hoặc nhánh nền tảng khi thật sự cần cho khác biệt iOS/Android về status bar, safe area, font, shadow/elevation, keyboard và scrolling; không tối ưu riêng một nền tảng rồi giả định nền tảng còn lại giống hệt.
8. Chọn công cụ tạo bản sắc
Chọn công cụ khi nó phục vụ một ý đồ được nêu trong DESIGN.md:
- react-native-reanimated + react-native-gesture-handler: chuyển động, gesture, kéo thả.
- expo-linear-gradient, expo-blur: gradient hoặc blur có vai trò nội dung.
- @shopify/react-native-skia: đồ họa tuỳ biến hoặc hiệu ứng mà View/SVG không đáp ứng tốt.
- lottie-react-native: animation vector có ý nghĩa.
- expo-haptics: phản hồi xúc giác ở hành động có ý nghĩa.
Trước khi thêm, kiểm tra tương thích SDK, yêu cầu native build, tác động bundle/performance, accessibility và fallback. Không thêm chỉ vì danh sách có đề xuất.
9. Tránh giao diện đại trà
Các mẫu dưới đây không bị cấm tuyệt đối, nhưng chỉ dùng khi được DESIGN.md lựa chọn có chủ đích và có lý do gắn với sản phẩm:
- Gradient tím–xanh theo mặc định; gradient không có vai trò thông tin.
- Nền kem + serif + đất nung, hoặc nền đen + neon, khi không liên quan đến thương hiệu/ngữ cảnh.
- Mọi nội dung đều nằm trong những card giống hệt nhau, cùng radius, shadow và spacing.
- Một giá trị radius duy nhất cho mọi loại thành phần.
- Nhãn IN HOA giãn chữ trên mọi tiêu đề; metadata nối liên tục bằng dấu chấm; mũi tên gắn vào mọi nút/link.
- Đánh số 01 / 02 / 03 khi không có chuỗi bước thật.
- Tô màu hoặc in nghiêng một từ trong tiêu đề chỉ để trang trí.
- Dùng font mặc định cho toàn bộ giao diện mà không có quyết định typography.
- Sao chép cùng một bố cục cho mọi màn hình dù nhiệm vụ người dùng khác nhau.
- Dùng cùng hiệu ứng fade/slide/press cho mọi section hoặc card.
Mỗi màn hình phải có thứ bậc thị giác phù hợp với nhiệm vụ. Không thêm hình khối, shadow, animation hay màu nhấn nếu chúng không giúp hiểu, điều hướng hoặc hành động.
10. Nội dung giao diện
- Viết từ góc nhìn người dùng, bằng tiếng Việt tự nhiên nếu sản phẩm phục vụ người dùng tiếng Việt. Không dùng lorem ipsum hoặc nội dung mẫu vô nghĩa.
- Nhãn hành động phải nói đúng kết quả: Lưu thay đổi, Đăng nhập, Xóa bản nháp thay vì nhãn chung chung như Gửi khi ngữ cảnh yêu cầu rõ hơn.
- Giữ thuật ngữ nhất quán trong cả luồng; tên hành động trên nút, thông báo thành công và xác nhận phải khớp nhau.
- Empty state nên nói điều gì đang thiếu và gợi ý bước tiếp theo. Error state phải nói vấn đề có thể hiểu được và cách khắc phục; không dùng lời xin lỗi mơ hồ thay cho thông tin.
- Phân biệt rõ dữ liệu thật, dữ liệu giả lập, trạng thái loading và lỗi. Không tạo số liệu hoặc trạng thái nghiệp vụ giả rồi trình bày như dữ liệu thật.
11. Chuyển động và điểm nhấn
- Mỗi app nên có tối đa một signature interaction được mô tả trong DESIGN.md. Đầu tư chất lượng vào tương tác đó; các chuyển động còn lại nên tiết chế và phục vụ phản hồi.
- Chuyển động tự phát khi mở màn hình phải ít, ngắn gọn và có mục đích. Ưu tiên animation do hành động người dùng kích hoạt khi chúng làm rõ sự thay đổi trạng thái.
- Kiểm tra tốc độ, gesture conflict, hiệu năng trên thiết bị trung bình và chế độ giảm chuyển động. Không dựa vào animation để truyền đạt thông tin duy nhất.
12. Quy trình làm từng màn hình
- Làm một màn hình một lần. Trước khi code, xác định mục tiêu, trạng thái và dữ liệu màn hình.
- Sau khi hoàn thiện một màn hình, chạy /ui-review trước khi chuyển sang màn tiếp theo.
- Nếu workflow không khả dụng, thực hiện theo .agent/workflows/ui-review.md và nêu rõ phần nào không thể chạy/thẩm định.
- Không nói đã chụp ảnh, chạy test, kiểm tra iOS/Android hoặc xác minh tương phản nếu thực tế chưa làm.
13. Hoàn thiện và ghi log
- Trước khi kết thúc, bỏ ít nhất một chi tiết trang trí không có chức năng nếu đang có chi tiết như vậy; nếu không tìm thấy, ghi ngắn gọn điều đã cân nhắc.
- Ghi quyết định thiết kế quan trọng, vấn đề đã sửa, trade-off và việc còn mở vào docs/design-log.md.
- Chạy các kiểm tra liên quan mà dự án có sẵn (typecheck, lint, test, Expo compatibility check). Báo đúng lệnh đã chạy và kết quả; không tuyên bố thành công khi chưa có bằng chứng.
- Báo cáo ngắn gọn: file/màn hình thay đổi, điểm chính đã sửa, kiểm tra đã chạy, giới hạn chưa kiểm tra được và bước thủ công cần thực hiện trên thiết bị thật.