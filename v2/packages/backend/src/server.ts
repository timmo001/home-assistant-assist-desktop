import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { authRoutes } from "./routes/auth.js";
import { settingsRoutes } from "./routes/settings.js";
import { haRoutes } from "./routes/ha.js";

const app = new Hono();

// CORS middleware
app.use("/*", cors());

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.route("/api/auth", authRoutes);
app.route("/api/settings", settingsRoutes);
app.route("/api/ha", haRoutes);

export async function startServer(requestedPort: number = 0): Promise<number> {
  return new Promise((resolve) => {
    const server = serve({
      fetch: app.fetch,
      port: requestedPort,
    }, (info) => {
      console.log(`Server started on port ${info.port}`);
      resolve(info.port);
    });
  });
}

export { app };
