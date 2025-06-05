import { FastifyPluginAsync } from "fastify";
import { prisma } from "../db";
import authMiddleware from "../middleware/auth";

const adminRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", authMiddleware(["admin"])); // restrict to admins

  // GET /admin/users
  app.get("/users", async (req, reply) => {
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
    reply.send(users);
  });

  // PUT /admin/users/:id/role
  app.put("/users/:id/role", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { role } = req.body as { role: string };

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
    });

    reply.send(updated);
  });
};

export default adminRoutes;
