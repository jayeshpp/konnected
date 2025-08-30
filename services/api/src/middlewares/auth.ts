import { verifyAccessTokenFromRequest } from "@konnected/libs";
import { FastifyReply, FastifyRequest } from "fastify";

//TODO: cleanup
declare module "fastify" {
  interface FastifyRequest {
    tenantId?: string;
  }
}

/**
 * Fastify hook for authentication and authorization.
 * Attaches decoded user info to `request.user` and checks for required roles.
 * This is an async hook, so it does NOT use the `done()` callback.
 * It implicitly returns a Promise<void> on success, or throws/replies on error.
 * Assumes `request.tenantId` has already been populated by a preceding middleware.
 * @param requiredRoles An array of role names that are allowed to access the route.
 * If empty or not provided, only authentication is performed.
 */
const authMiddleware = (requiredRoles: string[] = []) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Multi-tenancy: Assume tenantId is already present on request
      // This check is now handled by `tenantIdentifierMiddleware`
      const tenantId = request.headers["x-tenant-id"] as string;
      // No need for `if (!tenantId)` check here, as `tenantIdentifierMiddleware` ensures its presence
      // for routes where it's applied. If it's not applied, this middleware won't run correctly.

      // 1. Verify Access Token
      const user = await verifyAccessTokenFromRequest(request);

      if (!user) {
        reply
          .status(401)
          .send({ error: "Unauthorized", message: "Invalid or missing access token." });
        return;
      }

      // 2. Crucial for Multi-Tenancy: Verify JWT tenantId matches header tenantId
      // This prevents a user from one tenant using their token to access another tenant's data.
      if (user.tenantId !== tenantId) {
        // Compare with tenantId from request context
        reply
          .status(403)
          .send({ error: "Forbidden", message: "Access denied: Token tenant mismatch." });
        return;
      }

      // Attach authenticated user to the request object.
      request.user = user;

      // 3. Perform Role-Based Authorization (if requiredRoles are specified)
      if (requiredRoles.length > 0) {
        const userRoles = user.roles || [];
        const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));

        if (!hasRequiredRole) {
          reply.status(403).send({ error: "Forbidden", message: "Insufficient permissions." });
          return;
        }
      }
    } catch (error) {
      request.log.error("Authentication/Authorization error:", error);
      reply
        .status(500)
        .send({ error: "Internal Server Error", message: "Failed to process authentication." });
      return;
    }
  };
};

export default authMiddleware;
