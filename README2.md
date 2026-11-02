# Cách code được tổ chức và triển khai

Tài liệu này giải thích các mẫu code đang dùng trong dự án và nơi tìm chúng khi cần đọc hoặc chỉnh sửa.

Hướng dẫn cài đặt, chạy dự án và cấu hình dịch vụ nằm trong [README.md](./README.md).

## Công nghệ và luồng chạy

- **Giao diện:** React + TypeScript. `src/main.tsx` tạo React root; `src/App.tsx` quản lý phiên đăng nhập, tải dữ liệu và điều phối các trang.
- **API phía trình duyệt:** các hàm gọi API được nhóm theo chức năng trong `src/api/`; kiểu dữ liệu dùng chung nằm trong `src/types/`.
- **Máy chủ:** Express chạy bằng Node.js trong `server/index.js`; MongoDB là nơi lưu dữ liệu nếu cấu hình `MONGODB_URI`, nếu không ứng dụng dùng bộ nhớ RAM.
- **Kiểm tra website:** máy chủ lên lịch mỗi phút bằng `node-cron`, sau đó chỉ kiểm tra website đã đến hạn. Quy tắc phân quyền, chẩn đoán, URL và email được tách thành các module riêng trong `server/`.

Luồng dữ liệu thường gặp:

1. Trang hoặc component gọi hàm phù hợp trong `src/api/`.
2. `src/api/client.ts` gửi HTTP request cùng cookie phiên đăng nhập, đọc JSON và chuyển lỗi HTTP thành `ApiError`.
3. Route tương ứng trong `server/index.js` xác thực quyền, đọc hoặc cập nhật dữ liệu, rồi trả JSON.
4. React cập nhật state và render lại giao diện.

## Kẻ bảng: dùng HTML table và dữ liệu React

Dự án không dùng thư viện tạo bảng riêng. Mỗi bảng được dựng bằng các thẻ HTML `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>` và `<td>`. Dữ liệu hàng được lặp bằng `.map()`; mỗi hàng có `key` ổn định để React nhận biết khi danh sách thay đổi.

| Bảng | Nơi dựng bảng | Cách tạo hàng |
| --- | --- | --- |
| Website giám sát | `src/components/monitor-management.tsx`, component `MonitorTable` | Lọc theo tên hoặc URL, rồi `filtered.map(...)`; lấy số liệu báo cáo tương ứng từ `Map` theo `monitor.id`. Cột ngày kiểm tra và hành động được ẩn/hiện theo `compact` và `readOnly`. |
| Lịch sử kiểm tra | `src/components/monitor-management.tsx`, component `HistoryDialog` | `checks.map(...)`; mỗi hàng hiển thị thời điểm, trạng thái, HTTP, độ trễ và lỗi/chẩn đoán. |
| Hiệu suất báo cáo | `src/views/ReportsPage.tsx` | `selectedReport.monitors.map(...)`; các giá trị được định dạng qua helper trong `src/utils/format.ts`. |
| Tài khoản | `src/views/UsersPage.tsx` | `accounts.map(...)`; các ô có thể chứa điều khiển như chọn role và nút khóa, sửa, gán website hoặc xóa. |

Mẫu tối giản của một bảng danh sách:

```tsx
<table>
  <thead>
    <tr><th>TÊN</th><th>TRẠNG THÁI</th></tr>
  </thead>
  <tbody>
    {items.map((item) => (
      <tr key={item.id}>
        <td>{item.name}</td>
        <td>{item.status}</td>
      </tr>
    ))}
  </tbody>
</table>
```

Các màn hình bọc bảng trong phần tử có class `table-scroll` hoặc `users-table-scroll` để cuộn ngang trên màn hình nhỏ. Kiểu chung của bảng (`width`, `border-collapse`, màu tiêu đề, khoảng cách ô và hover) nằm trong `src/index.css`; các kiểu riêng theo chức năng cũng nằm trong file CSS này. Hàm `tw()` ở cuối `src/components/monitor-management.tsx` và `src/views/tailwind.ts` ánh xạ một số tên class sang tiện ích Tailwind; tên class không được ánh xạ vẫn được dùng như CSS class thông thường.

## Component, state và truyền dữ liệu

- Mỗi màn hình được tách theo chức năng trong `src/views/` và được ghép ở `src/views/PageContent.tsx`.
- Luồng hiển thị trang: menu trong `src/components/AppShell.tsx` gọi `onPageChange(id)` → `src/App.tsx` cập nhật state `page` và truyền vào `PageContent` → `src/views/PageContent.tsx` dùng `switch (props.page)` để chọn component trang.
- Bảng dưới đây chỉ rõ trang nào xuất hiện theo từng mục menu và component chịu trách nhiệm hiển thị nội dung:

| Mục trên menu | Giá trị `page` | Component hiển thị | Nội dung chính |
| --- | --- | --- | --- |
| Tổng quan | `dashboard` | `src/views/DashboardPage.tsx` | Thẻ chỉ số, trạng thái website, sự cố đang diễn ra, biểu đồ uptime và bảng hiệu suất website. |
| Website giám sát | `monitors` | `src/views/MonitorsPage.tsx` → `MonitorTable` trong `src/components/monitor-management.tsx` | Danh sách website, tìm kiếm, trạng thái và thao tác quản lý; dialog thêm/sửa và lịch sử cũng ở `monitor-management.tsx`. |
| Lịch sử sự cố | `incidents` | `src/views/IncidentsPage.tsx` | Danh sách sự cố, lọc theo trạng thái/website và xem bản ghi được chọn từ biểu đồ. |
| Báo cáo | `reports` | `src/views/ReportsPage.tsx` | Chỉ số tổng hợp, biểu đồ phản hồi, bảng theo website và nút xuất CSV. |
| Quản lý tài khoản | `users` | `src/views/UsersPage.tsx` | Tạo/sửa tài khoản, Gmail, role, khóa/mở khóa, xóa và gán website. Chỉ Admin thấy mục này. |
| Đăng nhập / đăng ký / quên mật khẩu | Không thuộc menu; hiển thị khi chưa có phiên đăng nhập | `src/components/AuthScreen.tsx` và `src/components/ForgotPasswordForm.tsx` | `src/App.tsx` hiển thị `AuthScreen` khi `currentUser` chưa có; biểu mẫu gọi API trong `src/api/auth.ts`. |
| Đăng xuất | Nút trong thanh bên của ứng dụng | `src/components/AppShell.tsx` → `handleLogout` trong `src/App.tsx` | Nút Đăng xuất gọi callback; callback gửi `POST /api/auth/logout`, xóa dữ liệu phiên khỏi state và quay về màn hình đăng nhập. |

- Trạng thái trang hiện tại được khai báo kiểu `Page` trong `src/types/app.ts`; danh sách menu được tạo trong `src/App.tsx`. Trang tài khoản chỉ được thêm vào menu khi `currentUser.role === 'admin'`, còn `UsersPage` cũng kiểm tra quyền trước khi hiển thị nội dung.
- Component con nhận dữ liệu và callback qua props; ví dụ `MonitorsPage` chuyển danh sách và các thao tác xuống `MonitorTable`.
- State giao diện dùng `useState`; tác vụ phụ thuộc dữ liệu hoặc vòng đời dùng `useEffect`. Ví dụ `HistoryDialog` tải lịch sử khi website hoặc khoảng thời gian thay đổi trong `src/components/monitor-management.tsx`.
- `src/App.tsx` là nơi điều phối dữ liệu cấp ứng dụng. Hàm `refresh` tải các nhóm dữ liệu đồng thời bằng `Promise.all`; dashboard tự làm mới mỗi 30 giây.
- Kiểu props của trang được tập trung trong `src/views/types.ts`, kiểu dữ liệu API trong `src/types/monitor.ts` và `src/types/app.ts`.

## API và backend

- `src/api/monitors.ts`, `src/api/reports.ts`, `src/api/incidents.ts`, `src/api/auth.ts` và `src/api/health.ts` đóng gói endpoint theo nhóm chức năng.
- `src/api/client.ts` là lớp gọi HTTP dùng chung. Request dùng `credentials: 'same-origin'` để gửi cookie; response lỗi được ném thành `ApiError` thay vì trả dữ liệu thành công giả.
- Route Express được khai báo trong `server/index.js`. Ví dụ API website gồm `GET/POST /api/monitors`, `PATCH/DELETE /api/monitors/:id` và `POST /api/monitors/:id/check`.
- Kiểm tra quyền được tách trong `server/authorization.js`; các module liên quan khác gồm `server/auth.js`, `server/diagnosis.js`, `server/ai-diagnosis.js` và `server/email-delivery.js`.
- Schema MongoDB cho website, lượt kiểm tra và sự cố được khai báo bằng Mongoose trong `server/index.js`.

## Biểu đồ, định dạng và xuất báo cáo

- `src/components/charts.tsx` dựng biểu đồ SVG và các thành phần hiển thị trạng thái như `StatusBadge`.
- `src/components/dashboard-widgets.tsx` chứa các widget dùng lại, chẳng hạn thẻ chỉ số và phần hiển thị chẩn đoán.
- `src/utils/format.ts` định dạng ngày, thời lượng, độ trễ và phần trăm; `src/utils/report.ts` chứa nhãn/khoảng thời gian và dữ liệu báo cáo mặc định.
- Xuất CSV được xử lý trong `src/App.tsx`: tạo hàng từ báo cáo hiện đang lọc, escape dấu ngoặc kép và giá trị có thể bị hiểu là công thức bảng tính, rồi tải xuống bằng `Blob`.

## Kiểm thử và kiểm tra kiểu

- Backend dùng test runner tích hợp của Node.js (`node:test`) và assertion (`node:assert/strict`); các test nằm cạnh module, ví dụ `server/authorization.test.js` và `server/diagnosis.test.js`.
- Chạy `npm test` để chạy test, `npm run lint` để kiểm tra TypeScript, và `npm run build` để tạo bản build giao diện.
- Khi thêm logic độc lập phía máy chủ, nên đặt test cạnh module tương ứng; khi thêm API hoặc trường dữ liệu, cập nhật đồng bộ kiểu trong `src/types/`, lớp API, route máy chủ và màn hình sử dụng dữ liệu đó.
