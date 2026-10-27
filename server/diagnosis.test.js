import assert from 'node:assert/strict';
import test from 'node:test';
import { diagnoseCheck } from './diagnosis.js';

test('timeout is presented as observed evidence and possible causes', () => {
  const check = {
    status: 'DOWN',
    httpStatus: null,
    responseTimeMs: 10000,
    error: 'Hết thời gian chờ (10 giây).',
  };

  const diagnosis = diagnoseCheck(check, [check], 1000);

  assert.match(diagnosis.evidence.join(' '), /Hết thời gian chờ/);
  assert.match(diagnosis.possibleCauses.join(' '), /mạng hoặc firewall/);
  assert.match(diagnosis.confidenceNote, /chỉ là khả năng/);
});

test('repeated HTTP 503 is evidence without claiming server overload', () => {
  const check = { status: 'DOWN', httpStatus: 503, responseTimeMs: 220, error: '' };
  const history = [check, check, check];
  const diagnosis = diagnoseCheck(check, history, 1000);

  assert.match(diagnosis.evidence.join(' '), /HTTP 503 xuất hiện 3\/3/);
  assert.match(diagnosis.possibleCauses.join(' '), /backend/);
  assert.doesNotMatch(diagnosis.possibleCauses.join(' '), /quá tải/);
  assert.ok(diagnosis.recommendedActions.length > 0);
});

test('slow response suggests diagnostic checks and records its threshold', () => {
  const check = { status: 'SLOW', httpStatus: 200, responseTimeMs: 1800, error: '' };
  const diagnosis = diagnoseCheck(check, [check], 1000);

  assert.match(diagnosis.evidence.join(' '), /ngưỡng 1000 ms/);
  assert.match(diagnosis.possibleCauses.join(' '), /database/);
  assert.match(diagnosis.recommendedActions.join(' '), /tài nguyên máy chủ/);
});

test('HTTP 401 suggests checking authentication and permissions', () => {
  const check = { status: 'DOWN', httpStatus: 401, responseTimeMs: 90, error: '' };
  const diagnosis = diagnoseCheck(check, [check], 1000);

  assert.match(diagnosis.possibleCauses.join(' '), /xác thực/);
  assert.match(diagnosis.recommendedActions.join(' '), /token|quyền truy cập/i);
});

test('URL safety rejection is not misdiagnosed as a network outage', () => {
  const check = {
    status: 'DOWN',
    httpStatus: null,
    responseTimeMs: 1,
    error: 'Tên miền phải phân giải đến địa chỉ IP công khai.',
  };
  const diagnosis = diagnoseCheck(check, [check], 1000);

  assert.match(diagnosis.possibleCauses.join(' '), /quy tắc an toàn URL/);
  assert.doesNotMatch(diagnosis.possibleCauses.join(' '), /firewall/);
});

test('healthy checks do not produce incident diagnosis', () => {
  assert.equal(diagnoseCheck({
    status: 'UP',
    httpStatus: 200,
    responseTimeMs: 120,
    error: '',
  }, [], 1000), null);
});
