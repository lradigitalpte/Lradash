/**
 * Prints env-ready secrets for Lradash.
 *
 * ENCRYPTION_KEY: must be exactly 32 ASCII characters for src/lib/seo/encryption.ts
 * (aes-256-cbc uses Buffer.from(key.padEnd(32, "0").slice(0, 32))).
 *
 * Run: node scripts/generate-encryption-key.mjs
 *
 * Python equivalent for ENCRYPTION_KEY only:
 *   python -c "import secrets; print(secrets.token_hex(16))"
 */

import crypto from "crypto"

const encKey = crypto.randomBytes(16).toString("hex") // 32 hex chars
const stateSecret = crypto.randomBytes(32).toString("base64url")

console.log("Paste into .env (local / Vercel):\n")
console.log(`ENCRYPTION_KEY=${encKey}`)
console.log(`GOOGLE_OAUTH_STATE_SECRET=${stateSecret}`)
console.log("\n# Optional if you prefer a shared JWT-style secret:")
console.log(`# ACCESS_TOKEN_SECRET=${crypto.randomBytes(32).toString("base64url")}`)
