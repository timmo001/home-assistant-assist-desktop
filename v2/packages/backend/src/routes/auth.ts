import { Hono } from "hono";
import { loadConfig, saveConfig } from "../config.js";

export const authRoutes = new Hono();

/**
 * POST /api/auth/login
 * Authenticate with Home Assistant
 * 
 * Body: {
 *   host: string,
 *   port: number,
 *   ssl: boolean,
 *   accessToken: string
 * }
 */
authRoutes.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const { host, port, ssl, accessToken } = body;

    // TODO: Validate credentials by attempting to connect to HA
    
    // Save credentials to config
    const config = loadConfig();
    config.homeAssistant = {
      host,
      port,
      ssl,
      accessToken,
    };
    saveConfig(config);

    return c.json({ success: true, message: "Authenticated successfully" });
  } catch (error) {
    return c.json({ success: false, error: "Authentication failed" }, 500);
  }
});

/**
 * POST /api/auth/logout
 * Clear Home Assistant credentials
 */
authRoutes.post("/logout", (c) => {
  try {
    const config = loadConfig();
    config.homeAssistant = null;
    saveConfig(config);

    return c.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return c.json({ success: false, error: "Logout failed" }, 500);
  }
});

/**
 * GET /api/auth/status
 * Check authentication status
 */
authRoutes.get("/status", (c) => {
  const config = loadConfig();
  const isAuthenticated = config.homeAssistant !== null;

  return c.json({
    authenticated: isAuthenticated,
    host: isAuthenticated ? config.homeAssistant?.host : null,
  });
});
