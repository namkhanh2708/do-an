# Website Reliability Dashboard

Dashboard theo dõi tính sẵn sàng và hiệu suất của website, xây dựng bằng React, Node.js, Express và MongoDB.

## Chạy dự án

**Yêu cầu:** Node.js 20.19+ hoặc 22.12+ và npm. MongoDB Community hoặc MongoDB Atlas là tùy chọn khi chạy thử; không có MongoDB, backend vẫn chạy ở chế độ RAM và sẽ thông báo dữ liệu không được lưu sau khi khởi động lại.

1. Cài thư viện:

   ```bash
   npm install
   ```

2. Sao chép `.env.example` thành `.env` và cập nhật `MONGODB_URI` nếu muốn lưu dữ liệu trong MongoDB.

3. Chạy giao diện và API:

   ```bash
   npm run dev
   ```

   Mở [http://localhost:3000](http://localhost:3000). Vite chuyển tiếp các yêu cầu `/api` tới Express ở cổng 4000.

4. Kiểm tra mã nguồn và tạo bản build:

   ```bash
   npm run lint
   npm run build
   ```

   Chạy bản production bằng `npm start` sau khi đã build. Express phục vụ API và các tệp trong `dist`.

## Chức năng

- **Dashboard:** tổng số lượt kiểm tra, uptime theo khoảng thời gian, thời gian phản hồi trung bình, số sự cố, thời gian khôi phục trung bình, biểu đồ độ trễ và trạng thái UP/SLOW/DOWN.
- **Quản lý website:** thêm, sửa, xóa URL; bật/tắt giám sát; tìm kiếm; kiểm tra thủ công; xem lịch sử từng lượt kiểm tra. Xóa website sẽ xóa cả lịch sử kiểm tra và sự cố liên quan.
- **Tự động giám sát:** kiểm tra HTTP định kỳ mỗi 1, 5 hoặc 15 phút; ghi nhận mã HTTP, độ trễ và thời điểm; phân loại DOWN khi lỗi kết nối hoặc HTTP 4xx/5xx, SLOW khi vượt ngưỡng cấu hình, các phản hồi khác là UP.
- **Lịch sử sự cố:** mở sự cố khi website chuyển sang DOWN, tránh ghi lặp trong cùng sự cố và lưu thời điểm phục hồi cùng thời gian gián đoạn.
- **Thông báo email:** gửi email một lần khi DOWN và một lần khi phục hồi. Có thể cấu hình email riêng trên monitor hoặc dùng `ALERT_EMAIL` mặc định.
- **Báo cáo:** lọc theo website và 24 giờ/7 ngày/30 ngày, thống kê từng website và xuất CSV.
- **An toàn URL:** chỉ nhận HTTP/HTTPS công khai; từ chối localhost/địa chỉ nội bộ và kiểm tra lại địa chỉ đích khi theo dõi/chuyển hướng.
- **Tự làm mới:** dashboard tải lại dữ liệu định kỳ mỗi 30 giây; API health báo trạng thái MongoDB và SMTP.

## Cấu hình

| Biến | Mục đích |
| --- | --- |
| `MONGODB_URI` | MongoDB local/Atlas. Bỏ trống để chạy chế độ RAM. |
| `PORT` | Cổng Express API, mặc định `4000`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Máy chủ SMTP và cổng gửi email. |
| `SMTP_USER`, `SMTP_PASS` | Tài khoản SMTP, nếu máy chủ yêu cầu xác thực. |
| `SMTP_FROM` | Địa chỉ người gửi; mặc định dùng `SMTP_USER`. |
| `ALERT_EMAIL` | Email nhận cảnh báo mặc định nếu monitor chưa có email riêng. |

### Gửi cảnh báo đến Gmail

Gmail không cho dùng mật khẩu đăng nhập thông thường để gửi SMTP. Bật xác minh 2 bước cho tài khoản gửi, sau đó tạo **App Password** trong Google Account → Security → App passwords. Chỉ nhập App Password vào `.env`; không gửi mật khẩu này qua chat hoặc commit lên Git.

Thêm cấu hình sau vào `.env` (thay địa chỉ và App Password bằng giá trị của bạn):

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-account@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=your-account@gmail.com
ALERT_EMAIL=recipient@gmail.com
```

Lưu lại rồi **khởi động lại backend** (`npm run dev`). Trong form thêm/sửa website, nhập email muốn nhận cảnh báo; nếu để trống, ứng dụng dùng `ALERT_EMAIL`. Backend chỉ gửi một thư khi trạng thái chuyển sang DOWN và một thư khi website phục hồi, không gửi lặp ở mỗi lượt kiểm tra trong cùng sự cố. Mục “Thông báo email” ở thanh bên báo SMTP đã được cấu hình hay chưa.

Trong bản `.env.example` hiện tại, các biến SMTP còn trống nên email **chưa gửi được cho đến khi bạn cấu hình**. Nếu sai App Password hoặc Gmail từ chối đăng nhập, xem lỗi `[alert]` trong terminal backend. Cấu hình SMTP không hợp lệ cũng có thể khiến Gmail từ chối gửi.

## API chính

- `GET /api/health`, `GET /api/monitors`, `POST /api/monitors`
- `PATCH /api/monitors/:id`, `DELETE /api/monitors/:id`
- `POST /api/monitors/:id/check`, `GET /api/monitors/:id/checks?range=7d`
- `GET /api/incidents?range=7d`, `GET /api/reports?range=7d&monitorId=...`

`range` hỗ trợ `1d`, `7d`, `30d`. Đây là đồ án giám sát và cảnh báo; hệ thống không tự động sửa website được theo dõi.
