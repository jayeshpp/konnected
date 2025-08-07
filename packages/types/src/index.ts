import { FastifyTypeProviderDefault } from "fastify/types/type-provider";
import { AuthenticatedUser } from "./user";
import "@fastify/jwt";
import { JWT } from "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWTPayload extends AuthenticatedUser {}
}

/**
 * Extends the FastifyRequest interface to include the `user` property
 * which will be populated by the authentication middleware.
 */

declare const fastifyTypeProviderDefault: unique symbol;

declare module "fastify" {
  interface FastifyRequest {
    tenantId?: string;
    //user: AuthenticatedUser;
    //jwtVerify: () => Promise<void>;
  }

  // Extend FastifyInstance to include the decorated methods
  interface FastifyInstance {
    jwt: JWT;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (
      requiredRoles?: string[],
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    [fastifyTypeProviderDefault]: FastifyTypeProviderDefault;
  }
}

export * from "./user";
export type { AuthenticatedUser };
