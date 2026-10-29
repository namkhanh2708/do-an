import assert from 'node:assert/strict';
import test from 'node:test';
import { getAcceptedRecipients, getPendingRecipients } from './email-delivery.js';

test('returns only recipients accepted by the SMTP server', () => {
  assert.deepEqual(getAcceptedRecipients({
    accepted: ['ADMIN@example.com'],
    rejected: ['user@example.com'],
  }, ['admin@example.com', 'user@example.com']), ['admin@example.com']);
});

test('returns no recipients when SMTP reports none accepted', () => {
  assert.deepEqual(getAcceptedRecipients({ accepted: [] }, ['admin@example.com']), []);
});

test('retries only unconfirmed recipients and removes case-insensitive duplicates', () => {
  assert.deepEqual(getPendingRecipients([
    'admin@example.com',
    'ADMIN@example.com',
    'user@example.com',
  ], ['Admin@Example.com']), ['user@example.com']);
});
