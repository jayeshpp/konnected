import { FastifyPluginAsync } from "fastify";
import { $ref, LoginRequestBody } from "@konnected/types";
import { login } from "../controllers/auth";

const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/v1/auth/login
  app.post<{ Body: LoginRequestBody }>(
    "/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "user login",
        body: $ref("loginSchema"),
        headers: $ref("TenantHeaderSchema"),
        response: {
          200: $ref("loginResponseSchema"),
        },
        security: [],
      },
    },
    login,
  );
};

export default authRoutes;
