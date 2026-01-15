import { Hono } from "hono";

export const haRoutes = new Hono();

/**
 * Placeholder for Home Assistant proxy endpoints
 * 
 * TODO: Implement WebSocket proxy for Home Assistant connection
 * TODO: Implement assist pipeline endpoints
 * TODO: Implement entity state endpoints
 */

/**
 * GET /api/ha/status
 * Get Home Assistant connection status
 */
haRoutes.get("/status", (c) => {
  return c.json({
    connected: false,
    message: "Home Assistant proxy not yet implemented",
  });
});

/**
 * GET /api/ha/pipelines
 * Get available assist pipelines
 */
haRoutes.get("/pipelines", (c) => {
  return c.json({
    error: "Not yet implemented",
  });
});

/**
 * POST /api/ha/assist
 * Run an assist pipeline
 */
haRoutes.post("/assist", (c) => {
  return c.json({
    error: "Not yet implemented",
  });
});
