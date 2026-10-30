import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generatePasswordResetCode,
  hashPasswordResetCode,
  passwordResetCodeMatches,
} from './password-reset.js';

test('generates six-digit reset codes including leading zeroes', () => {
  for (let index = 0; index < 100; index += 1) {
    assert.match(generatePasswordResetCode(), /^\d{6}$/);
  }
});

test('hashes reset codes and compares them without accepting a different code', () => {
  const code = '004271';
  const hash = hashPasswordResetCode(code);

  assert.notEqual(hash, code);
  assert.equal(passwordResetCodeMatches(code, hash), true);
  assert.equal(passwordResetCodeMatches('004272', hash), false);
  assert.equal(passwordResetCodeMatches('123', hash), false);
});
