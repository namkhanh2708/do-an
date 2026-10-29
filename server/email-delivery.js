export function getAcceptedRecipients(info, recipients) {
  const accepted = new Set((info.accepted ?? []).map((address) => String(address).trim().toLowerCase()));
  const acceptedRecipients = new Map();
  for (const recipient of recipients) {
    const normalized = recipient.trim().toLowerCase();
    if (accepted.has(normalized) && !acceptedRecipients.has(normalized)) {
      acceptedRecipients.set(normalized, recipient);
    }
  }
  return [...acceptedRecipients.values()];
}

export function getPendingRecipients(recipients, sentTo = []) {
  const sent = sentTo instanceof Set
    ? sentTo
    : new Set(sentTo.map((recipient) => recipient.trim().toLowerCase()));
  const uniquePending = new Map();
  for (const recipient of recipients) {
    const normalized = recipient.trim().toLowerCase();
    if (!sent.has(normalized) && !uniquePending.has(normalized)) uniquePending.set(normalized, recipient);
  }
  return [...uniquePending.values()];
}
