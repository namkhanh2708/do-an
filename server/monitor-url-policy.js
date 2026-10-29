import { isIP } from 'node:net';

export function isAllowedLocalIPv4(address) {
  if (isIP(address) !== 4) return false;
  const [first, second] = address.split('.').map(Number);
  return first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168);
}

export function isLocalMonitorUrl(url) {
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  return hostname === 'localhost' || isAllowedLocalIPv4(hostname);
}

export function assertMonitorRedirectAllowed(initialUrl, redirectUrl) {
  if (isLocalMonitorUrl(initialUrl) && redirectUrl.origin !== initialUrl.origin) {
    throw new Error('URL local chỉ được chuyển hướng trong cùng địa chỉ và cổng.');
  }
  if (!isLocalMonitorUrl(initialUrl) && isLocalMonitorUrl(redirectUrl)) {
    throw new Error('Không cho phép website công khai chuyển hướng đến địa chỉ local hoặc mạng riêng.');
  }
}
