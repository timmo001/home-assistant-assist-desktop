import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { HomeAssistantSettings } from "@ha-assist/shared-types";
import { encrypt, decrypt, hashPassword, generatePassword } from "./crypto.js";

const CONFIG_DIR = join(homedir(), ".ha-assist");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");
const CONFIG_VERSION = 1;

/**
 * Configuration file structure (stored on disk)
 * Sensitive fields are encrypted using a master password
 */
interface StoredConfig {
  version: number;
  server: {
    /** bcrypt hash of the server password */
    passwordHash: string | null;
    /** Plain text password (only on first run before hash created) */
    password?: string;
  };
  homeAssistant: {
    /** Encrypted HA URL */
    url: string | null;
    /** Encrypted HA access token */
    accessToken: string | null;
    /** Encrypted selected pipeline ID */
    selectedPipelineId: string | null;
  };
}

/**
 * In-memory configuration (decrypted)
 */
export interface Config {
  version: number;
  server: {
    password: string;
    passwordHash: string;
  };
  homeAssistant: HomeAssistantSettings | null;
}

const DEFAULT_STORED_CONFIG: StoredConfig = {
  version: CONFIG_VERSION,
  server: {
    passwordHash: null,
    password: undefined,
  },
  homeAssistant: {
    url: null,
    accessToken: null,
    selectedPipelineId: null,
  },
};

/**
 * Master password used for encrypting config data
 * In a desktop app, we use the server password as the master password
 */
let masterPassword: string | null = null;

/**
 * Initialize configuration system
 * - Loads config file
 * - Generates password on first run
 * - Sets up master password for encryption
 * @returns Config object with decrypted data
 */
export async function initConfig(): Promise<Config> {
  // Ensure config directory exists
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }

  // Load or create config file
  let stored: StoredConfig;

  if (!existsSync(CONFIG_FILE)) {
    // First run - generate password
    const password = generatePassword();
    stored = {
      ...DEFAULT_STORED_CONFIG,
      server: {
        passwordHash: null,
        password, // Store temporarily
      },
    };
    writeFileSync(CONFIG_FILE, JSON.stringify(stored, null, 2), "utf-8");
  } else {
    const data = readFileSync(CONFIG_FILE, "utf-8");
    stored = JSON.parse(data);
  }

  // Handle first-run password setup
  if (!stored.server.passwordHash && stored.server.password) {
    const password = stored.server.password;
    const passwordHash = await hashPassword(password);

    stored.server.passwordHash = passwordHash;
    delete stored.server.password;

    writeFileSync(CONFIG_FILE, JSON.stringify(stored, null, 2), "utf-8");

    // Set master password for encryption
    masterPassword = password;

    return {
      version: stored.version,
      server: {
        password,
        passwordHash,
      },
      homeAssistant: null,
    };
  }

  // If we get here, password hash exists but we don't have the master password yet
  // This is expected - the password will be set when user logs in via setMasterPassword()
  if (!masterPassword) {
    throw new Error(
      "Master password not set. Call setMasterPassword() after authentication."
    );
  }

  // Decrypt and return config
  return decryptConfig(stored);
}

/**
 * Set the master password for encryption/decryption
 * Should be called after successful authentication
 */
export function setMasterPassword(password: string): void {
  masterPassword = password;
}

/**
 * Get the current master password (for validation)
 */
export function getMasterPassword(): string | null {
  return masterPassword;
}

/**
 * Decrypt stored config into in-memory config
 */
function decryptConfig(stored: StoredConfig): Config {
  if (!masterPassword) {
    throw new Error("Master password not set");
  }

  let homeAssistant: HomeAssistantSettings | null = null;

  // Decrypt HA settings if they exist
  if (stored.homeAssistant.url && stored.homeAssistant.accessToken) {
    try {
      homeAssistant = {
        url: decrypt(stored.homeAssistant.url, masterPassword),
        accessToken: decrypt(stored.homeAssistant.accessToken, masterPassword),
        selectedPipelineId: stored.homeAssistant.selectedPipelineId
          ? decrypt(stored.homeAssistant.selectedPipelineId, masterPassword)
          : undefined,
      };
    } catch (error) {
      console.error("Failed to decrypt HA settings:", error);
      homeAssistant = null;
    }
  }

  return {
    version: stored.version,
    server: {
      password: masterPassword,
      passwordHash: stored.server.passwordHash!,
    },
    homeAssistant,
  };
}

/**
 * Encrypt in-memory config into stored config
 */
function encryptConfig(config: Config): StoredConfig {
  if (!masterPassword) {
    throw new Error("Master password not set");
  }

  const stored: StoredConfig = {
    version: config.version,
    server: {
      passwordHash: config.server.passwordHash,
    },
    homeAssistant: {
      url: null,
      accessToken: null,
      selectedPipelineId: null,
    },
  };

  // Encrypt HA settings if they exist
  if (config.homeAssistant) {
    stored.homeAssistant = {
      url: encrypt(config.homeAssistant.url, masterPassword),
      accessToken: encrypt(config.homeAssistant.accessToken, masterPassword),
      selectedPipelineId: config.homeAssistant.selectedPipelineId
        ? encrypt(config.homeAssistant.selectedPipelineId, masterPassword)
        : null,
    };
  }

  return stored;
}

/**
 * Load configuration from disk
 * Requires master password to be set
 */
export function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) {
    throw new Error("Config file not found. Call initConfig() first.");
  }

  if (!masterPassword) {
    throw new Error("Master password not set");
  }

  const data = readFileSync(CONFIG_FILE, "utf-8");
  const stored: StoredConfig = JSON.parse(data);

  return decryptConfig(stored);
}

/**
 * Save configuration to disk
 * Encrypts sensitive data before saving
 */
export function saveConfig(config: Config): void {
  if (!masterPassword) {
    throw new Error("Master password not set");
  }

  // Ensure config directory exists
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }

  const stored = encryptConfig(config);
  writeFileSync(CONFIG_FILE, JSON.stringify(stored, null, 2), "utf-8");
}

/**
 * Update Home Assistant settings
 */
export function updateHomeAssistantSettings(
  settings: HomeAssistantSettings
): void {
  const config = loadConfig();
  config.homeAssistant = settings;
  saveConfig(config);
}

/**
 * Get Home Assistant settings (decrypted)
 */
export function getHomeAssistantSettings(): HomeAssistantSettings | null {
  const config = loadConfig();
  return config.homeAssistant;
}

/**
 * Gets the path to the config directory
 */
export function getConfigDir(): string {
  return CONFIG_DIR;
}

/**
 * Gets the path to the config file
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}

/**
 * Check if this is the first run (no password hash exists)
 */
export function isFirstRun(): boolean {
  if (!existsSync(CONFIG_FILE)) {
    return true;
  }

  const data = readFileSync(CONFIG_FILE, "utf-8");
  const stored: StoredConfig = JSON.parse(data);

  return !stored.server.passwordHash;
}

/**
 * Get the stored password hash for authentication
 */
export function getPasswordHash(): string | null {
  if (!existsSync(CONFIG_FILE)) {
    return null;
  }

  const data = readFileSync(CONFIG_FILE, "utf-8");
  const stored: StoredConfig = JSON.parse(data);

  return stored.server.passwordHash;
}

/**
 * Get the current password (only available on first run or after init)
 */
export function getCurrentPassword(): string | null {
  if (!existsSync(CONFIG_FILE)) {
    return null;
  }

  const data = readFileSync(CONFIG_FILE, "utf-8");
  const stored: StoredConfig = JSON.parse(data);

  return stored.server.password || masterPassword;
}
