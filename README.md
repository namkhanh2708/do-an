# Website Reliability Dashboard

Dashboard theo dõi tính sẵn sàng và hiệu suất của website, xây dựng bằng React, Node.js, Express và MongoDB.

## Chạy dự án

**Yêu cầu:** Node.js 20.19+ hoặc 22.12+ và npm. MongoDB Community hoặc MongoDB Atlas là tùy chọn khi chạy thử; không có MongoDB, backend vẫn chạy ở chế độ RAM cho dữ liệu giám sát, nhưng chức năng đăng ký/đăng nhập không khả dụng.

1. Cài thư viện:

   ```bash
   npm install
   ```

2. Sao chép `.env.example` thành `.env` và cập nhật `MONGODB_URI` nếu muốn lưu dữ liệu trong MongoDB.

   Để tạo Admin đầu tiên, đặt `ADMIN_USERNAME` và `ADMIN_PASSWORD` trong `.env` trước khi khởi động backend. Tài khoản được khởi tạo nếu username chưa tồn tại; nếu username đã được đăng ký dưới quyền User, backend sẽ dừng khởi động để tránh tự nâng quyền nhầm — hãy chọn username Admin khác. Đăng ký công khai luôn tạo tài khoản User.

3. Chạy giao diện và API:

   ```bash
   npm run dev
   ```

   Mở [http://localhost:3000](http://localhost:3000). Vite chuyển tiếp các yêu cầu `/api` tới Express ở cổng 4000.

4. Kiểm tra mã nguồn và tạo bản build:

   ```bash
   npm test
   npm run lint
   npm run build
   ```

   Chạy bản production bằng `npm start` sau khi đã build. Express phục vụ API và các tệp trong `dist`.

### Truy cập từ thiết bị khác cùng Wi-Fi

1. Kết nối máy chạy ứng dụng và thiết bị còn lại vào cùng một mạng Wi-Fi.
2. Trên máy chạy ứng dụng, mở Command Prompt và chạy `ipconfig`; lấy địa chỉ **IPv4** của bộ điều hợp Wi-Fi (thường có dạng `192.168.x.x` hoặc `10.x.x.x`).
3. Khởi chạy ứng dụng bằng `npm run dev`, rồi mở `http://<IPv4>:3000` trên thiết bị còn lại, thay `<IPv4>` bằng địa chỉ vừa tìm được.
4. Nếu không kết nối được, cho phép Node.js qua Windows Defender Firewall trên mạng **Private** hoặc tạo quy tắc cho cổng TCP `3000`. Không bật cho mạng **Public**, không chuyển tiếp cổng trên router; một số Wi-Fi có chế độ cô lập thiết bị cần được tắt mới truy cập được.

Vite và Express lắng nghe trên các giao diện mạng của máy chạy ứng dụng. Khi dùng bản production (`npm run build` rồi `npm start`), truy cập `http://<IPv4>:4000` thay vì cổng `3000`.

## Chức năng

- **Dashboard:** tổng số lượt kiểm tra, uptime theo khoảng thời gian, thời gian phản hồi trung bình, số sự cố, thời gian khôi phục trung bình, biểu đồ độ trễ và trạng thái UP/SLOW/DOWN.
- **Quản lý website:** thêm, sửa, xóa URL; bật/tắt giám sát; tìm kiếm; kiểm tra thủ công; xem lịch sử từng lượt kiểm tra. Xóa website sẽ xóa cả lịch sử kiểm tra và sự cố liên quan.
- **Tự động giám sát:** kiểm tra HTTP định kỳ mỗi 1, 5 hoặc 15 phút; ghi nhận mã HTTP, độ trễ và thời điểm; phân loại DOWN khi lỗi kết nối hoặc HTTP 4xx/5xx, SLOW khi vượt ngưỡng cấu hình, các phản hồi khác là UP.
- **Lịch sử sự cố:** mở sự cố khi website chuyển sang DOWN, tránh ghi lặp trong cùng sự cố và lưu thời điểm phục hồi cùng thời gian gián đoạn.
- **Phân tích sự cố:** chẩn đoán theo quy tắc từ HTTP status, timeout, response time và tối đa 5 lượt kiểm tra gần nhất; hiển thị bằng chứng, nguyên nhân có thể và hướng xử lý trong nhật ký sự cố/lịch sử kiểm tra. Nguyên nhân chỉ là giả thuyết, không thay thế log hoặc số liệu máy chủ.
- **Thông báo email:** gửi email một lần khi DOWN (kèm bằng chứng và khuyến nghị chẩn đoán) và một lần khi phục hồi. Có thể cấu hình email riêng trên monitor hoặc dùng `ALERT_EMAIL` mặc định.
- **Báo cáo:** lọc theo website và 24 giờ/7 ngày/30 ngày, thống kê từng website và xuất CSV.
- **Phân quyền:** phiên đăng nhập dùng cookie HttpOnly; Admin quản lý tài khoản, thay đổi role, khóa/mở khóa và xóa tài khoản. Chỉ Admin được cấu hình website hoặc kiểm tra thủ công. Admin gán mỗi website cho một User; User chỉ xem website được gán, cùng dữ liệu lịch sử và báo cáo của website đó. Website chưa gán chỉ Admin xem được. Xóa tài khoản sẽ thu hồi phiên đăng nhập và gỡ gán website, không xóa dữ liệu website.
- **Tài khoản:** đăng ký và đăng nhập qua API; tài khoản lưu trong MongoDB và mật khẩu được băm bằng scrypt. Cần cấu hình `MONGODB_URI` để sử dụng. Phiên đăng nhập bị xóa khi backend khởi động lại.
- **An toàn URL:** chỉ nhận HTTP/HTTPS công khai; từ chối localhost/địa chỉ nội bộ và kiểm tra lại địa chỉ đích khi theo dõi/chuyển hướng.
- **Tự làm mới:** dashboard tải lại dữ liệu định kỳ mỗi 30 giây; API health báo trạng thái MongoDB và SMTP.

## Tra cứu mã nguồn

Bảng dưới đây dẫn tới các tệp chính theo từng chức năng để tiện xem hướng dẫn hoặc chỉnh sửa:

| Chức năng | Tệp liên quan |
| --- | --- |
| Đăng ký, đăng nhập, phiên và API tài khoản |
 [server/auth.js](./server/auth.js), 
 [src/api/auth.ts](./src/api/auth.ts), 
 [src/components/AuthScreen.tsx](./src/components/AuthScreen.tsx) |

| Phân quyền Admin/User và kiểm soát truy cập | 
[server/authorization.js](./server/authorization.js), 
[server/authorization.test.js](./server/authorization.test.js), 
[src/App.tsx](./src/App.tsx) |

| Quản lý tài khoản, role, khóa và xóa User | 
[src/views/UsersPage.tsx](./src/views/UsersPage.tsx), 
[src/api/auth.ts](./src/api/auth.ts) |

| Gán website cho User | 
[src/views/UsersPage.tsx](./src/views/UsersPage.tsx), 
[src/components/monitor-management.tsx](./src/components/monitor-management.tsx), 
[server/index.js](./server/index.js) |

| Dashboard và biểu đồ | 
[src/views/DashboardPage.tsx](./src/views/DashboardPage.tsx), 
[src/components/charts.tsx](./src/components/charts.tsx), 
[src/components/dashboard-widgets.tsx](./src/components/dashboard-widgets.tsx) |

| Quản lý website, cấu hình và email nhận cảnh báo | 
[src/views/MonitorsPage.tsx](./src/views/MonitorsPage.tsx), 
[src/components/monitor-management.tsx](./src/components/monitor-management.tsx), 
[server/index.js](./server/index.js) |

| Lịch sử sự cố và chẩn đoán | 
[src/views/IncidentsPage.tsx](./src/views/IncidentsPage.tsx), 
[server/diagnosis.js](./server/diagnosis.js), 
[server/diagnosis.test.js](./server/diagnosis.test.js) |

| Báo cáo và xuất CSV | 
[src/views/ReportsPage.tsx](./src/views/ReportsPage.tsx), 
[src/api/reports.ts](./src/api/reports.ts), 
[src/App.tsx](./src/App.tsx) |

| Cấu hình MongoDB, Admin đầu tiên và SMTP | 
[.env.example](./.env.example) |

| Kiểu dáng chung và tiện ích giao diện | 
[src/index.css](./src/index.css), 
[src/views/tailwind.ts](./src/views/tailwind.ts) |

## Cấu hình

| Biến | Mục đích |
| --- | --- |
| `MONGODB_URI` | MongoDB local/Atlas. Bỏ trống để chạy chế độ RAM. |
| `PORT` | Cổng Express API, mặc định `4000`. |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Tạo Admin đầu tiên nếu username chưa được đăng ký. Không dùng chung mật khẩu yếu; giữ thông tin này ngoài Git. |
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

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/auth/admin/users`, `POST /api/auth/admin/users`, `PATCH /api/auth/admin/users/:id`, `DELETE /api/auth/admin/users/:id` (Admin)
- `GET /api/health`, `GET /api/monitors`, `POST /api/monitors` (Admin)
- `PATCH /api/monitors/:id`, `DELETE /api/monitors/:id`
- `POST /api/monitors/:id/check`, `GET /api/monitors/:id/checks?range=7d`
- `GET /api/incidents?range=7d`, `GET /api/reports?range=7d&monitorId=...`

Ngoại trừ `GET /api/health` và các API đăng nhập/đăng ký, API dữ liệu yêu cầu phiên đăng nhập. API quản lý website và kiểm tra thủ công yêu cầu Admin; dữ liệu đọc của User được lọc ở backend theo website đã gán. `range` hỗ trợ `1d`, `7d`, `30d`. Đây là đồ án giám sát và cảnh báo; hệ thống không tự động sửa website được theo dõi.
