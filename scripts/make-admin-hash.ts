import { randomBytes, scryptSync } from "node:crypto";

/**
 * Generate an ADMIN_PASSWORD_HASH for .env:
 *
 *   bun scripts/make-admin-hash.ts <password>
 *
 * Prints `ADMIN_PASSWORD_HASH=salt:hash` (scrypt, timing-safe compare at
 * login). The plaintext password is never stored anywhere.
 */
const password = process.argv[2];
if (!password || password.length < 12) {
  console.error("Usage: bun scripts/make-admin-hash.ts <password-min-12-chars>");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
console.log(`ADMIN_PASSWORD_HASH=${salt}:${hash}`);
