import { FastifyPluginAsync } from "fastify";

import { login } from "../controllers/auth";
import {
  HeaderSchema,
  LoginRequestBody,
  LoginRequestBodySchema,
  loginResponseSchema,
} from "@konnected/types";

const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/v1/auth/login
  app.post<{ Body: LoginRequestBody }>(
    "/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "user login",
        body: LoginRequestBodySchema,
        headers: HeaderSchema,
        response: {
          200: loginResponseSchema,
        },
        security: [],
      },
    },
    login,
  );
};

export default authRoutes;
