import { Context, Next } from "hono";
import { isValidToken } from "../routes/auth.js";

/**
 * Auth middleware to protect routes
 * Verifies that the request has a valid Bearer token
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: No token provided" }, 401);
  }

  const token = authHeader.substring(7);

  if (!isValidToken(token)) {
    return c.json({ error: "Unauthorized: Invalid or expired token" }, 401);
  }

  // Token is valid, continue to next handler
  await next();
}
