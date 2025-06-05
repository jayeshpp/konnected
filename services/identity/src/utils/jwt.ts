import jwt from "jsonwebtoken";
import { FastifyRequest } from "fastify";

const JWT_SECRET = process.env.JWT_SECRET || "your-dev-secret";

export default {
  sign(payload: object) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  },
  verify(token: string) {
    return jwt.verify(token, JWT_SECRET);
  },
  async verifyFromRequest(req: FastifyRequest) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  },
};
