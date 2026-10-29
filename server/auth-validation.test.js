import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePassword, validateUsername } from './auth-validation.js';

test('validates and trims account usernames', () => {
  assert.equal(validateUsername('  user.name_1  '), 'user.name_1');
  assert.throws(() => validateUsername('ab'), /Tên tài khoản cần từ 3–32 ký tự/);
  assert.throws(() => validateUsername('invalid name'), /Tên tài khoản cần từ 3–32 ký tự/);
});

test('validates password length without changing its value', () => {
  assert.equal(validatePassword('  valid password  '), '  valid password  ');
  assert.throws(() => validatePassword('short'), /Mật khẩu cần có từ 6 đến 128 ký tự/);
  assert.throws(() => validatePassword('x'.repeat(129)), /Mật khẩu cần có từ 6 đến 128 ký tự/);
});
