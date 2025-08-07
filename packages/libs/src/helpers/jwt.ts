import { AuthenticatedUser } from "@konnected/types";
import "@fastify/jwt";
import { FastifyRequest } from "fastify";
import { config } from "@konnected/config";

/**
 * Signs a new access token.
 * @param payload The user data to include in the token.
 * @returns The signed access token string.
 */
function signAccessToken(payload: AuthenticatedUser): string {
  // Use app.jwt.sign directly if this utility is called within a Fastify context
  // For standalone use, you'd need to pass the Fastify instance or its jwt decorator
  // For simplicity here, we assume Fastify's jwt decorator is available
  // when this function is called via `req.jwt.sign` or `app.jwt.sign`
  // This utility primarily defines the structure and secrets.
  // The actual signing will happen via Fastify's `jwt` plugin.
  throw new Error("signAccessToken should be called via Fastify's jwt plugin (e.g., req.jwt.sign)");
}

/**
 * Signs a new refresh token.
 * @param payload The user data to include in the token.
 * @returns The signed refresh token string.
 */
function signRefreshToken(payload: AuthenticatedUser): string {
  throw new Error(
    "signRefreshToken should be called via Fastify's jwt plugin (e.g., req.jwt.sign)",
  );
}

/**
 * Verifies an access token from a Fastify request.
 * @param req The Fastify request object.
 * @returns The decoded user payload if valid, otherwise null.
 */
export async function verifyAccessTokenFromRequest(
  req: FastifyRequest,
): Promise<AuthenticatedUser | null> {
  try {
    await req.jwtVerify();
    return req.user as AuthenticatedUser;
  } catch (error) {
    req.log.warn("Access token verification failed:", error);
    return null;
  }
}

/**
 * Verifies a refresh token.
 * @param app The Fastify app instance.
 * @param token The refresh token string.
 * @returns The decoded user payload if valid, otherwise null.
 */
export async function verifyRefreshToken(
  app: any,
  token: string,
): Promise<AuthenticatedUser | null> {
  try {
    const decoded = await app.jwt.verify(token, {
      secret: config.REFRESH_TOKEN_SECRET,
    });
    return decoded;
  } catch (error) {
    app.log.warn("Refresh token verification failed:", error);
    return null;
  }
}
