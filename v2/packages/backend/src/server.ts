import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { serve } from "@hono/node-server";
import { authRoutes } from "./routes/auth.js";
import { settingsRoutes } from "./routes/settings.js";
import { haRoutes } from "./routes/ha.js";
import { pipelineRoutes } from "./routes/pipelines.js";
import { authMiddleware } from "./middleware/auth.js";
import { initConfig, isFirstRun, getCurrentPassword } from "./config.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = new Hono();

// CORS middleware
app.use("/*", cors());

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Public routes (no auth required)
app.route("/api/auth", authRoutes);

// Protected routes (auth required)
app.use("/api/settings/*", authMiddleware);
app.route("/api/settings", settingsRoutes);

app.use("/api/pipelines/*", authMiddleware);
app.route("/api/pipelines", pipelineRoutes);

app.use("/api/ha/*", authMiddleware);
app.route("/api/ha", haRoutes);

/**
 * Enable static file serving for web UI
 */
export function enableWebUI() {
  // Serve static files from web package dist directory
  const webDistPath = join(__dirname, "../../web/dist");
  
  app.use("/*", serveStatic({ root: webDistPath }));
  
  // Fallback to index.html for SPA routing
  app.get("/*", (c) => {
    const indexHtml = readFileSync(join(webDistPath, "index.html"), "utf-8");
    return c.html(indexHtml);
  });
  
  console.log(`Serving web UI from ${webDistPath}`);
}

export async function startServer(requestedPort: number = 0, enableWeb: boolean = false): Promise<number> {
  // Initialize config on startup
  try {
    await initConfig();
    
    // If first run, display the auto-generated password
    if (isFirstRun() || getCurrentPassword()) {
      const password = getCurrentPassword();
      if (password) {
        console.log("\n" + "=".repeat(60));
        console.log("  FIRST RUN - AUTO-GENERATED PASSWORD");
        console.log("=".repeat(60));
        console.log(`  Password: ${password}`);
        console.log("=".repeat(60));
        console.log("\n  Save this password! You'll need it to log in.");
        console.log("  The password is also available at /api/auth/password\n");
      }
    }
  } catch (error) {
    // Config initialization failed, but we can continue
    // (might not have master password set yet)
    if (error instanceof Error && !error.message.includes("Master password not set")) {
      console.error("Warning: Config initialization failed:", error);
    }
  }

  // Enable web UI if requested
  if (enableWeb) {
    enableWebUI();
  }

  return new Promise((resolve) => {
    const server = serve({
      fetch: app.fetch,
      port: requestedPort,
    }, (info) => {
      console.log(`Server started on port ${info.port}`);
      if (enableWeb) {
        console.log(`Web UI available at http://localhost:${info.port}`);
      } else {
        console.log(`API available at http://localhost:${info.port}`);
      }
      resolve(info.port);
    });
  });
}

export { app };
