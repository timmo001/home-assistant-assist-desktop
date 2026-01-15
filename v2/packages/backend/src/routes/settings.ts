import { Hono } from "hono";
import { loadConfig, saveConfig, type Config } from "../config.js";

export const settingsRoutes = new Hono();

/**
 * GET /api/settings
 * Get all settings
 */
settingsRoutes.get("/", (c) => {
  const config = loadConfig();
  
  // Don't send sensitive data (access token) to frontend
  const sanitizedConfig = {
    ...config,
    homeAssistant: config.homeAssistant
      ? {
          host: config.homeAssistant.host,
          port: config.homeAssistant.port,
          ssl: config.homeAssistant.ssl,
          // Don't include accessToken
        }
      : null,
  };

  return c.json(sanitizedConfig);
});

/**
 * PATCH /api/settings
 * Update settings (partial update)
 * 
 * Body: Partial<Config>
 */
settingsRoutes.patch("/", async (c) => {
  try {
    const body = await c.req.json();
    const config = loadConfig();

    // Merge updates with existing config
    const updatedConfig = {
      ...config,
      ...body,
      backend: {
        ...config.backend,
        ...(body.backend || {}),
      },
    };

    saveConfig(updatedConfig);

    return c.json({ success: true, config: updatedConfig });
  } catch (error) {
    return c.json({ success: false, error: "Failed to update settings" }, 500);
  }
});
