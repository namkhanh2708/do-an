import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

export function generatePasswordResetCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashPasswordResetCode(code) {
  return createHash('sha256').update(code).digest('hex');
}

export function passwordResetCodeMatches(code, expectedHash) {
  const actual = Buffer.from(hashPasswordResetCode(code), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
