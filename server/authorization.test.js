import test from 'node:test';
import assert from 'node:assert/strict';
import { canViewMonitor, isAdmin, visibleMonitors } from './authorization.js';

const admin = { id: 'admin-id', role: 'admin' };
const firstUser = { id: 'user-one', role: 'user' };
const secondUser = { id: 'user-two', role: 'user' };
const monitors = [
  { id: 'site-one', ownerId: firstUser.id },
  { id: 'site-two', ownerId: secondUser.id },
  { id: 'admin-only', ownerId: '' },
];

test('only Admin role passes the administrator policy', () => {
  assert.equal(isAdmin(admin), true);
  assert.equal(isAdmin(firstUser), false);
  assert.equal(isAdmin(null), false);
});

test('Admin can view every monitor while User can only view assigned monitors', () => {
  assert.deepEqual(visibleMonitors(admin, monitors), monitors);
  assert.deepEqual(visibleMonitors(firstUser, monitors), [monitors[0]]);
  assert.deepEqual(visibleMonitors(secondUser, monitors), [monitors[1]]);
});

test('monitor access fails closed for unassigned monitors and missing users', () => {
  assert.equal(canViewMonitor(firstUser, monitors[2]), false);
  assert.equal(canViewMonitor(null, monitors[0]), false);
  assert.equal(canViewMonitor(firstUser, null), false);
});
