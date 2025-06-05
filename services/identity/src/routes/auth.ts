import { FastifyPluginAsync } from "fastify";
import jwt from "../utils/jwt";
import { prisma } from "../db";
import bcrypt from "bcrypt";
import { RegisterRequestBody } from "../types";

const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /auth/register
  app.post("/register", async (req, reply) => {
    const { email, password } = req.body as RegisterRequestBody;
    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashed, role: "user" },
    });

    const token = jwt.sign({ id: user.id, role: user.role });
    reply.send({ token });
  });

  // POST /auth/login
  app.post("/login", async (req, reply) => {
    const { email, password } = req.body as RegisterRequestBody;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role });
    reply.send({ token });
  });

  // GET /auth/me
  app.get("/me", async (req, reply) => {
    const user = await jwt.verifyFromRequest(req);
    if (!user) return reply.status(401).send({ error: "Unauthorized" });

    reply.send(user);
  });
};

export default authRoutes;
