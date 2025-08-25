import { FastifyPluginAsync } from "fastify";

import { registerOrganization } from "../controllers/onboarding";
import { RegisterOrganizationRequestBody, schemas } from "@konnected/types";
import z from "zod";

const onboardingRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/v1/onboarding/register-organization
  app.post<{ Body: RegisterOrganizationRequestBody }>(
    "/register-organization",
    {
      schema: {
        tags: ["Onboarding"],
        summary: "Register a new organization and admin user",
        body: schemas.RegisterOrganizationRequestBody,
        response: {
          200: z.array(schemas.RegisterOrganizationResponseBody),
        },
        security: [],
      },
    },
    registerOrganization,
  );
};

export default onboardingRoutes;
