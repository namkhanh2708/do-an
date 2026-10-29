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

- **Dashboard:** tổng số lượt kiểm tra, uptime theo khoảng thời gian, thời gian phản hồi trung bình, số sự cố, thời gian khôi phục trung bình, danh sách sự cố cuộn theo khoảng thời gian đang chọn và trạng thái UP/SLOW/DOWN. Mỗi lượt kiểm tra ghi nhận DOWN tạo một bản ghi và email riêng, kể cả khi website vẫn đang DOWN; khi website phục hồi, tất cả bản ghi DOWN đang mở được đánh dấu đã khôi phục. Chọn một mục để mở đúng bản ghi lịch sử; danh sách tự làm mới mỗi 30 giây.
- **Quản lý website:** thêm, sửa, xóa URL; bật/tắt giám sát; tìm kiếm; kiểm tra thủ công; xem lịch sử từng lượt kiểm tra. Xóa website sẽ xóa cả lịch sử kiểm tra và sự cố liên quan.
- **Tự động giám sát:** kiểm tra HTTP định kỳ mỗi 1, 5 hoặc 15 phút; ghi nhận mã HTTP, độ trễ và thời điểm; phân loại DOWN khi lỗi kết nối hoặc HTTP 4xx/5xx, SLOW khi vượt ngưỡng cấu hình, các phản hồi khác là UP.
- **Lịch sử sự cố:** lưu một bản ghi mỗi lượt kiểm tra DOWN và cập nhật trạng thái/thời điểm phục hồi cùng thời gian gián đoạn. Khi website phục hồi, các bản ghi DOWN đang mở trong đợt đó đều được đánh dấu đã khôi phục. Khi đổi tên website, tên mới cũng được cập nhật cho toàn bộ lịch sử sự cố cũ.
- **Phân tích sự cố:** giữ dấu hiệu thực đo từ HTTP status, lỗi, độ trễ và lịch sử; dùng Groq AI để đề xuất nguyên nhân và hướng xử lý cho sự cố DOWN mới và mỗi 3 lượt SLOW liên tiếp. Nếu AI lỗi hoặc chưa cấu hình, dùng chẩn đoán theo quy tắc. Lịch sử kiểm tra và sự cố hiển thị nguồn phân tích.
- **Thông báo email:** chỉ gửi email cho website đang bật giám sát, gồm email ở mỗi lượt kiểm tra ghi nhận DOWN (kể cả sự cố đang mở), cảnh báo SLOW theo ngưỡng và email phục hồi; người nhận là tất cả Admin có Gmail cùng User đang được gán cho website. Website tạm dừng sẽ không gửi email và sự cố đang mở của website tạm dừng sẽ không được kiểm tra lại khi backend khởi động. Khi gán User vào website đang DOWN và còn bật giám sát, User đó cũng được gửi thông tin sự cố hiện tại. Admin quản lý tên đăng nhập, mật khẩu và Gmail trong trang tài khoản; không cần nhập email thủ công trên từng website. `ALERT_EMAIL` vẫn có thể dùng làm địa chỉ nhận thêm tùy chọn.
- **Báo cáo:** lọc theo website và 24 giờ/7 ngày/30 ngày, thống kê từng website và xuất CSV.
- **Phân quyền:** phiên đăng nhập dùng cookie HttpOnly; Admin quản lý tài khoản, thay đổi role, khóa/mở khóa và xóa tài khoản. Chỉ Admin được cấu hình website hoặc kiểm tra thủ công. Admin gán mỗi website cho một User; User chỉ xem website được gán, cùng dữ liệu lịch sử và báo cáo của website đó. Website chưa gán chỉ Admin xem được. Xóa tài khoản sẽ thu hồi phiên đăng nhập và gỡ gán website, không xóa dữ liệu website.
- **Tài khoản:** đăng ký và đăng nhập qua API; tài khoản lưu trong MongoDB và mật khẩu được băm bằng scrypt. Cần cấu hình `MONGODB_URI` để sử dụng. Phiên đăng nhập bị xóa khi backend khởi động lại.
- **URL giám sát:** hỗ trợ HTTP/HTTPS công khai, localhost và IP IPv4 riêng (10/8, 172.16/12, 192.168/16); kiểm tra URL chuyển hướng để tránh chuyển từ website công khai vào mạng riêng. Link local được truy cập từ máy chạy backend; chỉ thêm thiết bị/dịch vụ mà bạn có quyền giám sát.
- **Tự làm mới:** dashboard tải lại dữ liệu định kỳ mỗi 30 giây; API health báo trạng thái MongoDB, SMTP và cấu hình AI.

### Công thức tính thời gian phản hồi và uptime

- **Thời gian phản hồi mỗi lượt (ms):** `thời điểm nhận được HTTP response - thời điểm bắt đầu kiểm tra`. Thời gian này tính cả bước phân giải/kiểm tra DNS và các lần chuyển hướng, nhưng dừng khi nhận được response; không tính thời gian tải toàn bộ nội dung website. Nếu kiểm tra lỗi hoặc timeout, hệ thống vẫn ghi thời gian đã trôi qua, nhưng lượt DOWN đó không được tính vào thời gian phản hồi trung bình.
- **Thời gian phản hồi trung bình:** `tổng thời gian phản hồi của các lượt UP và SLOW có số đo / số lượt UP và SLOW có số đo`. Lượt DOWN bị loại khỏi phép tính; lượt SLOW vẫn được tính.
- **Uptime (%):** `(số lượt UP + số lượt SLOW) / tổng số lượt kiểm tra × 100`. Vì vậy, SLOW được tính là website có phản hồi; DOWN được tính là không khả dụng. Dashboard áp dụng công thức trên cho các lượt trong khoảng thời gian đang chọn; báo cáo từng website áp dụng riêng cho các lượt của website đó.

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
| `ALERT_EMAIL` | Địa chỉ nhận thêm mọi cảnh báo (tùy chọn); nhiều email phân tách bằng dấu phẩy. |
| `GROQ_API_KEY` | API key Groq để bật phân tích nguyên nhân và hướng xử lý bằng AI (tùy chọn). |
| `GROQ_MODEL` | Model Groq; mặc định `openai/gpt-oss-20b`. |

AI chỉ hỗ trợ phân tích, không thay thế email cảnh báo. Backend gửi tên website, hostname, trạng thái, mã HTTP, lỗi, độ trễ và thời điểm kiểm tra tới Groq; không gửi URL đầy đủ hoặc query string. Mục “Phân tích AI” trong thanh bên chỉ cho biết API key đã được cấu hình, không xác nhận key/model hợp lệ. Nếu AI lỗi, xem log backend có tiền tố `[ai-diagnosis]`; ứng dụng sẽ giữ chẩn đoán theo quy tắc.

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
ALERT_EMAIL=recipient@gmail.com,team@example.com
```

Lưu lại rồi **khởi động lại backend** (`npm run dev`). Với Gmail, có thể dán App Password ở dạng chia nhóm có dấu cách; backend tự bỏ khoảng trắng trước khi xác thực SMTP. Nhập Gmail khi tạo hoặc sửa tài khoản trong trang Quản lý tài khoản. Admin đang hoạt động có Gmail sẽ nhận cảnh báo của mọi website; User đang hoạt động có Gmail chỉ nhận cảnh báo website được gán. Khi gán User vào website đang DOWN, hệ thống gửi email sự cố đang mở cho User đó. Backend gửi email ở mỗi lượt kiểm tra DOWN, bao gồm cả khi sự cố đã mở; do đó email DOWN sẽ lặp theo chu kỳ kiểm tra (1, 5 hoặc 15 phút) cho đến khi website phục hồi. Cảnh báo SLOW vẫn gửi sau mỗi 3 lượt SLOW liên tiếp và gửi email phục hồi khi website trở lại hoạt động. `ALERT_EMAIL` dùng để gửi bản sao tùy chọn ngoài danh sách người dùng. Mục “Thông báo email” ở thanh bên chỉ báo SMTP đã được cấu hình, không xác nhận máy chủ email đã chấp nhận thư.

Trong bản `.env.example` hiện tại, các biến SMTP còn trống nên email **chưa gửi được cho đến khi bạn cấu hình**. Nếu sai App Password hoặc Gmail từ chối đăng nhập, xem lỗi `[alert]` trong terminal backend. Cấu hình SMTP không hợp lệ cũng có thể khiến Gmail từ chối gửi.

## API chính

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/auth/admin/users`, `POST /api/auth/admin/users`, `PATCH /api/auth/admin/users/:id`, `DELETE /api/auth/admin/users/:id` (Admin)
- `GET /api/health`, `GET /api/monitors`, `POST /api/monitors` (Admin)
- `PATCH /api/monitors/:id`, `DELETE /api/monitors/:id`
- `POST /api/monitors/:id/check`, `GET /api/monitors/:id/checks?range=7d`
- `GET /api/incidents?range=7d`, `GET /api/reports?range=7d&monitorId=...`

Ngoại trừ `GET /api/health` và các API đăng nhập/đăng ký, API dữ liệu yêu cầu phiên đăng nhập. API quản lý website và kiểm tra thủ công yêu cầu Admin; dữ liệu đọc của User được lọc ở backend theo website đã gán. `range` hỗ trợ `1d`, `7d`, `30d`. Đây là đồ án giám sát và cảnh báo; hệ thống không tự động sửa website được theo dõi.
