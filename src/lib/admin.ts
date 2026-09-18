import { scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Admin gate (server-only).
 *
 * Exactly one operator identity exists: the email in ADMIN_EMAIL
 * (default moeedkamraan1123@gmail.com) plus a password whose scrypt hash
 * lives in ADMIN_PASSWORD_HASH (generate with
 * `bun scripts/make-admin-hash.ts <password>` — the plaintext password is
 * never stored anywhere). No ADMIN_PASSWORD_HASH ⇒ the backend refuses
 * every admin action (fail closed) instead of letting anyone in.
 */

export const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ?? "moeedkamraan1123@gmail.com"
)
  .trim()
  .toLowerCase();

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD_HASH);
}

export function verifyAdminPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) return false;
  const sep = stored.indexOf(":");
  if (sep <= 0) return false;
  const salt = stored.slice(0, sep);
  const keyHex = stored.slice(sep + 1);
  try {
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(keyHex, "hex");
    return (
      derived.length === expected.length &&
      timingSafeEqual(derived, expected)
    );
  } catch {
    return false;
  }
}

export function adminLoginAllowed(email: string, password: string): boolean {
  if (email.trim().toLowerCase() !== ADMIN_EMAIL) return false;
  return verifyAdminPassword(password);
}
