import { Hono } from "hono";
import type { HomeAssistantSettings } from "@ha-assist/shared-types";
import {
  loadConfig,
  updateHomeAssistantSettings,
  getHomeAssistantSettings,
} from "../config.js";

export const settingsRoutes = new Hono();

/**
 * GET /api/settings
 * Get Home Assistant settings (with masked access token)
 */
settingsRoutes.get("/", (c) => {
  try {
    const settings = getHomeAssistantSettings();

    if (!settings) {
      return c.json({ settings: null });
    }

    // Mask access token for security (show first/last 4 chars)
    const maskedToken =
      settings.accessToken.length > 8
        ? `${settings.accessToken.slice(0, 4)}...${settings.accessToken.slice(-4)}`
        : "****";

    return c.json({
      settings: {
        url: settings.url,
        accessToken: maskedToken,
        selectedPipelineId: settings.selectedPipelineId,
      },
    });
  } catch (error) {
    console.error("Error loading settings:", error);
    return c.json({ error: "Failed to load settings" }, 500);
  }
});

/**
 * PUT /api/settings
 * Update Home Assistant settings
 * 
 * Body: HomeAssistantSettings
 */
settingsRoutes.put("/", async (c) => {
  try {
    const body = await c.req.json<HomeAssistantSettings>();

    // Validate required fields
    if (!body.url || !body.accessToken) {
      return c.json(
        { success: false, error: "URL and access token are required" },
        400
      );
    }

    // Validate URL format
    try {
      new URL(body.url);
    } catch {
      return c.json({ success: false, error: "Invalid URL format" }, 400);
    }

    // Save settings (will be encrypted)
    updateHomeAssistantSettings(body);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    return c.json({ success: false, error: "Failed to save settings" }, 500);
  }
});

/**
 * POST /api/settings/test-connection
 * Test connection to Home Assistant
 * 
 * Body: { url: string, accessToken: string }
 */
settingsRoutes.post("/test-connection", async (c) => {
  try {
    const body = await c.req.json<{ url: string; accessToken: string }>();

    if (!body.url || !body.accessToken) {
      return c.json(
        { success: false, error: "URL and access token are required" },
        400
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(body.url);
    } catch {
      return c.json({ success: false, error: "Invalid URL format" }, 400);
    }

    // Test connection by calling HA API
    const apiUrl = `${body.url}/api/`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${body.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return c.json(
        {
          success: false,
          error: `Connection failed: ${response.status} ${response.statusText}`,
        },
        200
      );
    }

    const data = (await response.json()) as { version?: string; message?: string };

    return c.json({
      success: true,
      message: `Connected to Home Assistant ${data.version || "unknown version"}`,
    });
  } catch (error) {
    console.error("Error testing connection:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      },
      200
    );
  }
});
