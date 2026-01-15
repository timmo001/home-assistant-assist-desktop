import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface Config {
  homeAssistant: {
    host: string;
    port: number;
    ssl: boolean;
    accessToken: string;
  } | null;
  backend: {
    port: number;
  };
  version: string;
}

const CONFIG_DIR = join(homedir(), ".ha-assist");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

const DEFAULT_CONFIG: Config = {
  homeAssistant: null,
  backend: {
    port: 3000,
  },
  version: "2.0.0",
};

/**
 * Loads the configuration from the config file.
 * Creates default config if file doesn't exist.
 * 
 * TODO: Add encryption for sensitive data (access tokens)
 */
export function loadConfig(): Config {
  try {
    if (!existsSync(CONFIG_FILE)) {
      // Create config directory if it doesn't exist
      if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
      }
      // Create default config
      saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }

    const configData = readFileSync(CONFIG_FILE, "utf-8");
    const config = JSON.parse(configData) as Config;

    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_CONFIG,
      ...config,
      homeAssistant: config.homeAssistant
        ? { ...DEFAULT_CONFIG.homeAssistant, ...config.homeAssistant }
        : null,
      backend: {
        ...DEFAULT_CONFIG.backend,
        ...config.backend,
      },
    };
  } catch (error) {
    console.error("Error loading config:", error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Saves the configuration to the config file.
 * 
 * TODO: Add encryption for sensitive data (access tokens)
 */
export function saveConfig(config: Config): void {
  try {
    // Ensure config directory exists
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }

    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving config:", error);
    throw error;
  }
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
