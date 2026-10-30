import assert from 'node:assert/strict';
import test from 'node:test';
import { getAlertRecipients, normalizeEmailAddress, parseEmailRecipients } from './email-recipients.js';

test('parses one or more comma-separated email recipients', () => {
  assert.deepEqual(parseEmailRecipients('one@example.com'), ['one@example.com']);
  assert.deepEqual(parseEmailRecipients('one@example.com, two@example.com'), [
    'one@example.com',
    'two@example.com',
  ]);
});

test('returns an empty list when no recipient is configured', () => {
  assert.deepEqual(parseEmailRecipients('  '), []);
});

test('rejects malformed or empty recipient entries', () => {
  assert.equal(parseEmailRecipients('not-an-email'), null);
  assert.equal(parseEmailRecipients('one@example.com, '), null);
  assert.equal(parseEmailRecipients('one@example.com;two@example.com'), null);
});

test('normalizes user email addresses and allows an empty optional email', () => {
  assert.equal(normalizeEmailAddress('  User@Example.com '), 'user@example.com');
  assert.equal(normalizeEmailAddress(''), '');
  assert.equal(normalizeEmailAddress(undefined), '');
  assert.throws(() => normalizeEmailAddress('invalid-address'), /Địa chỉ email không hợp lệ/);
  assert.throws(() => normalizeEmailAddress(`${'a'.repeat(250)}@example.com`), /Địa chỉ email không hợp lệ/);
  assert.throws(() => normalizeEmailAddress(null), /Địa chỉ email không hợp lệ/);
});

test('sends alerts to every active Admin and the assigned active User', () => {
  const users = [
    { _id: 'admin-one', role: 'admin', isActive: true, email: 'admin@example.com' },
    { _id: 'admin-two', role: 'admin', isActive: true, email: 'second-admin@example.com' },
    { _id: 'assigned', role: 'user', isActive: true, email: 'owner@example.com' },
    { _id: 'other', role: 'user', isActive: true, email: 'other@example.com' },
    { _id: 'locked', role: 'admin', isActive: false, email: 'locked@example.com' },
  ];
  assert.deepEqual(
    getAlertRecipients(users, 'assigned', ''),
    ['admin@example.com', 'second-admin@example.com', 'owner@example.com'],
  );
});

test('adds optional global recipients and removes duplicates', () => {
  const users = [
    { id: 'admin', role: 'admin', isActive: true, email: 'admin@example.com' },
    { id: 'owner', role: 'user', isActive: true, email: 'team@example.com' },
  ];
  assert.deepEqual(
    getAlertRecipients(users, 'owner', 'admin@example.com, global@example.com'),
    ['admin@example.com', 'global@example.com', 'team@example.com'],
  );
  assert.deepEqual(getAlertRecipients([], '', ''), []);
});

test('rejects invalid global or stored user email addresses', () => {
  assert.equal(getAlertRecipients([], '', 'broken-address'), null);
  assert.equal(getAlertRecipients([
    { id: 'admin', role: 'admin', isActive: true, email: 'broken-address' },
  ], '', ''), null);
});
