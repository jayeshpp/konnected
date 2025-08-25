import { FastifyPluginAsync } from "fastify";

import { login } from "../controllers/auth";
import { LoginRequestBody, schemas } from "@konnected/types";
import z from "zod";

const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/v1/auth/login
  app.post<{ Body: LoginRequestBody }>(
    "/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "user login",
        body: schemas.LoginRequestBodySchema,
        headers: schemas.HeaderSchema,
        response: {
          200: z.array(schemas.loginResponseSchema),
        },
        security: [],
      },
    },
    login,
  );
};

export default authRoutes;
