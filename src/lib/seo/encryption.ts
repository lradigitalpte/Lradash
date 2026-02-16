import crypto from "crypto"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-secret-key-change-in-production"

export function encryptData(data: string): string {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)),
      iv
    )

    let encrypted = cipher.update(data, "utf8", "hex")
    encrypted += cipher.final("hex")

    return `${iv.toString("hex")}:${encrypted}`
  } catch (error) {
    console.error("Encryption error:", error)
    return data // Fallback: return unencrypted if encryption fails
  }
}

export function decryptData(encryptedData: string): string {
  try {
    const [iv, encrypted] = encryptedData.split(":")

    if (!iv || !encrypted) {
      return encryptedData // Return as-is if not in expected format
    }

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)),
      Buffer.from(iv, "hex")
    )

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Decryption error:", error)
    return encryptedData // Return as-is if decryption fails
  }
}
