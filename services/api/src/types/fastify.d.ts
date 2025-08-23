import type { FastifyInstance as CoreFastifyInstance } from "fastify";
import type { JWT } from "@fastify/jwt";
import "@fastify/jwt";
import { AuthenticatedUser } from "@konnected/types/src/user";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AuthenticatedUser;
    user: AuthenticatedUser;
  }
}

declare module "fastify" {
  interface FastifyRequest {
    tenantId?: string;
    user: AuthenticatedUser;
  }

  interface FastifyInstance extends CoreFastifyInstance {
    jwt: JWT;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (
      requiredRoles?: string[],
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
