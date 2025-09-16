// utils/jwt.js
// Centralized helper to safely read JWT secret and guard against accidental quotes in .env
const jwt = require('jsonwebtoken');

function getJwtSecret() {
  const raw = process.env.JWT_SECRET || '';
  // Trim whitespace
  const trimmed = raw.trim();
  // Remove a single pair of surrounding quotes if present
  const unquoted = trimmed.replace(/^['\"](.*)['\"]$/, '$1');

  if (unquoted !== trimmed) {
    // eslint-disable-next-line no-console
    console.warn('[JWT] Detected surrounding quotes in JWT_SECRET. They have been ignored for signing/verifying.');
  }

  if (!unquoted) {
    // eslint-disable-next-line no-console
    console.error('[JWT] JWT_SECRET is empty. Authentication will fail.');
  }
  return unquoted;
}

function verifyToken(token) {
  const primary = getJwtSecret();
  try {
    return jwt.verify(token, primary);
  } catch (e) {
    // Fallback: try the raw value as-is (e.g., if tokens were signed when secret had quotes)
    const raw = (process.env.JWT_SECRET || '').trim();
    if (raw && raw !== primary) {
      try {
        return jwt.verify(token, raw);
      } catch (_) {
        // ignore and throw original error
      }
    }
    // Additional fallback: try the alternate quoted/unquoted form of the secret
    // If primary is unquoted, build a quoted variant; if primary is quoted, build unquoted
    if (primary) {
      const quoted = /^['\"]/.test(primary) ? primary : `'${primary}'`;
      const doubleQuoted = /^['\"]/.test(primary) ? primary : `"${primary}"`;
      for (const alt of [quoted, doubleQuoted]) {
        if (alt !== primary && alt !== raw) {
          try {
            return jwt.verify(token, alt);
          } catch (_) {
            // continue
          }
        }
      }
    }
    throw e;
  }
}

function signToken(payload, options) {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, options);
}

module.exports = { getJwtSecret, verifyToken, signToken };
