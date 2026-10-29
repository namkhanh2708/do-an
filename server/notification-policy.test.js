import assert from 'node:assert/strict';
import test from 'node:test';
import { isMonitorAlertEnabled } from './notification-policy.js';

test('allows alert delivery only while the monitor is enabled', () => {
  assert.equal(isMonitorAlertEnabled({ enabled: true }), true);
  assert.equal(isMonitorAlertEnabled({ enabled: false }), false);
  assert.equal(isMonitorAlertEnabled(null), false);
});
