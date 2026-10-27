function describeStatus(status) {
  if (status === 'DOWN') return 'DOWN';
  if (status === 'SLOW') return 'SLOW';
  return 'UP';
}

export function diagnoseCheck(check, recentChecks, slowThresholdMs) {
  if (check.status === 'UP') return null;

  const evidence = [];
  const causes = [];
  const actions = [];
  const statusLabel = describeStatus(check.status);

  if (check.httpStatus !== null) {
    evidence.push(`Lượt kiểm tra nhận được HTTP ${check.httpStatus}.`);
    const matchingChecks = recentChecks.filter((item) => item.httpStatus === check.httpStatus);
    if (matchingChecks.length > 1) {
      evidence.push(`HTTP ${check.httpStatus} xuất hiện ${matchingChecks.length}/${recentChecks.length} lượt kiểm tra gần nhất.`);
    }
  }

  if (check.error) {
    evidence.push(`Lỗi ghi nhận: ${check.error}`);
    const matchingErrors = recentChecks.filter((item) => item.error === check.error);
    if (matchingErrors.length > 1) {
      evidence.push(`Lỗi này xuất hiện ${matchingErrors.length}/${recentChecks.length} lượt kiểm tra gần nhất.`);
    }
  }

  if (check.responseTimeMs !== null && check.responseTimeMs !== undefined) {
    evidence.push(`Thời gian phản hồi: ${check.responseTimeMs} ms${check.status === 'SLOW' ? ` (ngưỡng ${slowThresholdMs} ms)` : ''}.`);
  }

  if (check.error?.includes('địa chỉ nội bộ') || check.error?.includes('địa chỉ IP công khai')) {
    causes.push('Địa chỉ đích có thể đang trỏ tới IP nội bộ nên bị quy tắc an toàn URL từ chối.');
    actions.push('Kiểm tra DNS của tên miền và cấu hình URL để bảo đảm đích đến là địa chỉ IP công khai.');
  } else if (check.error?.includes('chuyển hướng quá 5 lần')) {
    causes.push('Website có thể đang tạo chuỗi chuyển hướng quá dài hoặc vòng lặp chuyển hướng.');
    actions.push('Kiểm tra chuỗi chuyển hướng HTTP và cấu hình canonical URL, HTTPS hoặc proxy.');
  } else if (check.httpStatus === 500) {
    causes.push('Ứng dụng hoặc máy chủ có thể gặp lỗi khi xử lý yêu cầu.');
    actions.push('Kiểm tra application log và stack trace tại thời điểm phát sinh lỗi.');
    actions.push('Đối chiếu thay đổi triển khai gần nhất và kiểm tra các dịch vụ phụ thuộc.');
  } else if (check.httpStatus === 502 || check.httpStatus === 503 || check.httpStatus === 504) {
    causes.push('Reverse proxy, backend hoặc dịch vụ phụ thuộc có thể không sẵn sàng.');
    actions.push('Kiểm tra trạng thái reverse proxy và backend service.');
    actions.push('Đối chiếu log máy chủ, tài nguyên và trạng thái các dịch vụ phụ thuộc.');
  } else if (check.httpStatus === 429) {
    causes.push('Yêu cầu có thể đang bị giới hạn tần suất.');
    actions.push('Kiểm tra request rate, phản hồi Retry-After và cấu hình rate limit.');
    actions.push('Xác minh có tác vụ hoặc client nào gửi nhiều yêu cầu bất thường không.');
  } else if (check.httpStatus === 401 || check.httpStatus === 403) {
    causes.push('Yêu cầu có thể thiếu xác thực hoặc không đủ quyền truy cập.');
    actions.push('Kiểm tra yêu cầu giám sát có cần token, đăng nhập hoặc quyền truy cập đặc biệt không.');
    actions.push('Xác minh chính sách xác thực, phân quyền và allowlist của website.');
  } else if (check.httpStatus === 404) {
    causes.push('URL hoặc endpoint được cấu hình có thể không tồn tại.');
    actions.push('Kiểm tra lại URL giám sát và đường dẫn endpoint.');
    actions.push('Xác minh cấu hình routing hoặc thay đổi đường dẫn sau khi triển khai.');
  } else if (check.httpStatus !== null && check.httpStatus >= 400) {
    causes.push(`Máy chủ trả về HTTP ${check.httpStatus}; ý nghĩa cụ thể phụ thuộc vào cấu hình website.`);
    actions.push('Kiểm tra nội dung phản hồi, tài liệu API và log máy chủ tại thời điểm phát sinh lỗi.');
    actions.push('Xác minh URL, quyền truy cập và cấu hình dịch vụ liên quan.');
  } else if (check.status === 'SLOW') {
    causes.push('Máy chủ bận, truy vấn database, mạng hoặc dịch vụ phụ thuộc có thể làm tăng độ trễ.');
    actions.push('Đo thời gian xử lý ở từng thành phần để xác định nơi phát sinh độ trễ.');
    actions.push('Kiểm tra tài nguyên máy chủ, truy vấn database và dịch vụ phụ thuộc.');
  } else if (!check.httpStatus) {
    causes.push('Máy chủ chưa phản hồi; lỗi máy chủ, mạng hoặc firewall có thể là nguyên nhân.');
    actions.push('Kiểm tra trạng thái máy chủ và khả năng truy cập từ mạng bên ngoài.');
    actions.push('Kiểm tra kết nối mạng, firewall và log máy chủ quanh thời điểm xảy ra lỗi.');
  }

  if (check.status === 'SLOW' && check.httpStatus !== null && check.httpStatus < 400) {
    causes.push('Máy chủ bận, truy vấn database, mạng hoặc dịch vụ phụ thuộc có thể làm tăng độ trễ.');
    actions.push('Đo thời gian xử lý ở từng thành phần; kiểm tra tài nguyên máy chủ, truy vấn database và dịch vụ phụ thuộc.');
  }

  if (actions.length === 0) {
    actions.push('Kiểm tra log máy chủ và cấu hình website tại thời điểm phát sinh dấu hiệu.');
  }

  return {
    signal: statusLabel,
    evidence,
    possibleCauses: causes,
    recommendedActions: actions,
    confidenceNote: 'Nguyên nhân trên chỉ là khả năng dựa trên dấu hiệu đã quan sát; cần log hoặc số liệu máy chủ để xác nhận.',
  };
}
