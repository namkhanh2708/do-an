export function validateUsername(value) {
  const username = typeof value === 'string' ? value.trim() : '';
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
    throw Object.assign(new Error('Tên tài khoản cần từ 3–32 ký tự, chỉ gồm chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.'), { status: 400 });
  }
  return username;
}

export function validatePassword(value) {
  if (typeof value !== 'string' || value.length < 6 || value.length > 128) {
    throw Object.assign(new Error('Mật khẩu cần có từ 6 đến 128 ký tự.'), { status: 400 });
  }
  return value;
}
