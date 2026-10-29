import assert from 'node:assert/strict';
import test from 'node:test';
import { assertMonitorRedirectAllowed, isAllowedLocalIPv4, isLocalMonitorUrl } from './monitor-url-policy.js';

test('allows loopback and RFC1918 IPv4 addresses for local monitoring', () => {
  for (const address of ['127.0.0.1', '10.0.0.5', '172.16.0.1', '172.31.255.254', '192.168.1.20']) {
    assert.equal(isAllowedLocalIPv4(address), true, address);
  }
  assert.equal(isLocalMonitorUrl(new URL('http://localhost:3000')), true);
});

test('rejects non-private and special-use IPv4 addresses for local monitoring', () => {
  for (const address of ['8.8.8.8', '172.15.0.1', '172.32.0.1', '169.254.1.2', '192.0.2.1']) {
    assert.equal(isAllowedLocalIPv4(address), false, address);
  }
  assert.equal(isLocalMonitorUrl(new URL('http://169.254.169.254')), false);
});

test('limits local redirects to the original host and port', () => {
  assert.doesNotThrow(() => assertMonitorRedirectAllowed(
    new URL('http://192.168.1.20:8080/health'),
    new URL('http://192.168.1.20:8080/status'),
  ));
  assert.throws(() => assertMonitorRedirectAllowed(
    new URL('http://192.168.1.20:8080/health'),
    new URL('http://192.168.1.21:8080/health'),
  ), /cùng địa chỉ và cổng/);
});

test('prevents public URLs from redirecting to local hosts', () => {
  assert.throws(() => assertMonitorRedirectAllowed(
    new URL('https://example.com'),
    new URL('http://192.168.1.20/'),
  ), /chuyển hướng đến địa chỉ local/);
});
