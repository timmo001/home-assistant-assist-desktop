import { Hono } from "hono";
import { verifyPassword, generateToken } from "../crypto.js";
import { getPasswordHash, getCurrentPassword, setMasterPassword } from "../config.js";

export const authRoutes = new Hono();

// In-memory session store: Map<token, timestamp>
const sessions = new Map<string, number>();

// Session timeout: 30 days (for desktop app, can be long)
const SESSION_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Cleanup expired sessions periodically
 */
function cleanupSessions() {
  const now = Date.now();
  for (const [token, timestamp] of sessions.entries()) {
    if (now - timestamp > SESSION_TIMEOUT_MS) {
      sessions.delete(token);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupSessions, 60 * 60 * 1000);

/**
 * Check if a token is valid
 */
export function isValidToken(token: string): boolean {
  const timestamp = sessions.get(token);
  if (!timestamp) {
    return false;
  }

  const now = Date.now();
  if (now - timestamp > SESSION_TIMEOUT_MS) {
    sessions.delete(token);
    return false;
  }

  return true;
}

/**
 * POST /auth/login
 * Authenticate with server password
 * 
 * Body: { password: string }
 * Returns: { success: boolean, token?: string }
 */
authRoutes.post("/login", async (c) => {
  try {
    const body = await c.req.json<{ password: string }>();

    if (!body.password) {
      return c.json({ success: false, error: "Password is required" }, 400);
    }

    const passwordHash = getPasswordHash();

    if (!passwordHash) {
      return c.json(
        { success: false, error: "Server not initialized" },
        500
      );
    }

    // Verify password
    const isValid = await verifyPassword(body.password, passwordHash);

    if (!isValid) {
      return c.json({ success: false, error: "Invalid password" }, 401);
    }

    // Set master password for config encryption
    setMasterPassword(body.password);

    // Generate session token
    const token = generateToken();
    sessions.set(token, Date.now());

    return c.json({
      success: true,
      token,
      message: "Authenticated successfully",
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ success: false, error: "Authentication failed" }, 500);
  }
});

/**
 * POST /auth/logout
 * Clear session token
 * 
 * Headers: Authorization: Bearer <token>
 */
authRoutes.post("/logout", (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ success: false, error: "No token provided" }, 401);
    }

    const token = authHeader.substring(7);
    sessions.delete(token);

    return c.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return c.json({ success: false, error: "Logout failed" }, 500);
  }
});

/**
 * GET /auth/status
 * Check authentication status
 * 
 * Headers: Authorization: Bearer <token>
 */
authRoutes.get("/status", (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ authenticated: false });
  }

  const token = authHeader.substring(7);
  const isValid = isValidToken(token);

  return c.json({ authenticated: isValid });
});

/**
 * GET /auth/password
 * Get the current server password
 * 
 * This is used by the desktop app on first run to get the auto-generated password
 * Only available when no authentication is set up yet
 */
authRoutes.get("/password", (c) => {
  const password = getCurrentPassword();

  if (!password) {
    return c.json({ error: "Password not available" }, 404);
  }

  return c.json({ password });
});
