import { FastifyRequest, FastifyReply } from "fastify";

//TODO: cleanup
declare module "fastify" {
  interface FastifyRequest {
    tenantId?: string;
  }
}

/**
 * Fastify pre-handler hook to extract and validate the X-Tenant-ID header.
 * If the header is missing, it will immediately send a 400 Bad Request response.
 * Otherwise, it attaches the tenantId to `request.tenantId`.
 */
const tenantIdentifierMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  const tenantIdFromHeader = request.headers["x-tenant-id"] as string;
  console.log({ tenantIdFromHeader }, "========");

  if (!tenantIdFromHeader) {
    reply.status(400).send({ error: "Bad Request", message: "X-Tenant-ID header is required." });
    return;
  }

  // Attach the tenantId to the request object for subsequent handlers to use
  request.tenantId = tenantIdFromHeader;
};

export default tenantIdentifierMiddleware;
