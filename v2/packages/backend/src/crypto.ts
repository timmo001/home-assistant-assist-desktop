import crypto from "crypto";
import bcrypt from "bcrypt";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const BCRYPT_ROUNDS = 10;

/**
 * Generate a random password suitable for server authentication
 */
export function generatePassword(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a bcrypt hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Derive an encryption key from a master password and salt
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, "sha256");
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * 
 * @param data - Plain text data to encrypt
 * @param masterPassword - Master password for encryption
 * @returns Encrypted data in format: salt:iv:tag:encrypted
 */
export function encrypt(data: string, masterPassword: string): string {
  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive encryption key from password and salt
  const key = deriveKey(masterPassword, salt);

  // Create cipher and encrypt
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Get authentication tag
  const tag = cipher.getAuthTag();

  // Return as: salt:iv:tag:encrypted
  return [
    salt.toString("hex"),
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted,
  ].join(":");
}

/**
 * Decrypt data encrypted with encrypt()
 * 
 * @param encryptedData - Encrypted data in format: salt:iv:tag:encrypted
 * @param masterPassword - Master password used for encryption
 * @returns Decrypted plain text data
 * @throws Error if decryption fails or data is tampered
 */
export function decrypt(encryptedData: string, masterPassword: string): string {
  // Parse encrypted data
  const parts = encryptedData.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted data format");
  }

  const [saltHex, ivHex, tagHex, encrypted] = parts;

  // Convert from hex
  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  // Derive the same encryption key
  const key = deriveKey(masterPassword, salt);

  // Create decipher and decrypt
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Generate a random session token
 */
export function generateToken(): string {
  return crypto.randomUUID();
}
