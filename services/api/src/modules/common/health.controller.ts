import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

export const healthController = async (req: FastifyRequest, reply: FastifyReply) => {
  reply.send({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};
