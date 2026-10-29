import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSmtpTransportOptions } from './smtp-config.js';

test('removes spaces from Gmail app passwords copied in grouped format', () => {
  assert.deepEqual(buildSmtpTransportOptions({
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: 'sender@example.com',
    SMTP_PASS: 'abcd efgh ijkl mnop',
  }), {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: 'sender@example.com', pass: 'abcdefghijklmnop' },
  });
});

test('preserves password whitespace for non-Gmail SMTP providers', () => {
  const options = buildSmtpTransportOptions({
    SMTP_HOST: 'smtp.example.com',
    SMTP_USER: 'sender@example.com',
    SMTP_PASS: ' pass with spaces ',
  });
  assert.equal(options.auth.pass, ' pass with spaces ');
});
