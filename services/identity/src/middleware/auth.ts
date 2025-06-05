import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "../utils/jwt";
import { User } from "@konnected/types";

export default (roles: string[] = []) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const decoded = await jwt.verifyFromRequest(req);

    // Handle invalid tokens
    if (!decoded || typeof decoded !== "object" || !("role" in decoded)) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const user = decoded as User;

    // Role check
    if (roles.length > 0 && !roles.includes(user.role)) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    req.user = user;
  };
};
