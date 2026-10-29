export function buildSmtpTransportOptions(config) {
  const password = config.SMTP_HOST?.toLowerCase() === 'smtp.gmail.com'
    ? config.SMTP_PASS?.replace(/\s+/g, '')
    : config.SMTP_PASS;

  return {
    host: config.SMTP_HOST,
    port: Number(config.SMTP_PORT || 587),
    secure: config.SMTP_SECURE === 'true',
    auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: password } : undefined,
  };
}
