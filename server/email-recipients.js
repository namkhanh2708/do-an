const EMAIL_ADDRESS_PATTERN = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

export function normalizeEmailAddress(value) {
  if (value === undefined) return '';
  if (typeof value !== 'string') {
    throw Object.assign(new Error('Địa chỉ email không hợp lệ.'), { status: 400 });
  }
  const email = value.trim().toLowerCase();
  if (email && !EMAIL_ADDRESS_PATTERN.test(email)) {
    throw Object.assign(new Error('Địa chỉ email không hợp lệ.'), { status: 400 });
  }
  return email;
}

export function parseEmailRecipients(value) {
  if (!value.trim()) return [];

  const recipients = value.split(',').map((recipient) => recipient.trim());
  if (recipients.some((recipient) => !EMAIL_ADDRESS_PATTERN.test(recipient))) return null;

  return recipients;
}

export function getAlertRecipients(users, ownerId, defaultEmails) {
  const defaultRecipients = parseEmailRecipients(defaultEmails || '');
  if (defaultRecipients === null) return null;

  const userRecipients = users
    .filter((user) => user.isActive &&
      (user.role === 'admin' || (user.role === 'user' && String(user._id ?? user.id) === ownerId)))
    .map((user) => parseEmailRecipients(user.email || ''))
    .flat();

  if (userRecipients.some((recipients) => recipients === null)) return null;
  return [...new Set([...defaultRecipients, ...userRecipients.flat()])];
}
