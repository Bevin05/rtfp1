import crypto from 'crypto';

// Generate a unique share ID
export function generateShareId() {
  return crypto.randomBytes(16).toString('hex');
}

// Validate share ID format
export function isValidShareId(shareId) {
  // Share ID should be a 32-character hexadecimal string
  const shareIdRegex = /^[0-9a-f]{32}$/;
  return shareIdRegex.test(shareId);
}

// Generate a secure hash for the history item
export function generateItemHash(historyItem) {
  const data = `${historyItem.id}-${historyItem.user_id}-${historyItem.created_at}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Create a share token that includes both the share ID and a hash
export function createShareToken(historyItem, shareId) {
  const hash = generateItemHash(historyItem);
  return `${shareId}.${hash}`;
}

// Validate a share token
export function validateShareToken(token, historyItem) {
  const [shareId, hash] = token.split('.');
  if (!shareId || !hash || !isValidShareId(shareId)) {
    return false;
  }
  return hash === generateItemHash(historyItem);
} 