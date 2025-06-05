import { User } from "@konnected/types";

// Extend FastifyRequest to include the 'user' property
declare module "fastify" {
  interface FastifyRequest {
    user?: User;
  }
}
