import { FastifyPluginAsync } from "fastify";

import { $ref, RegisterOrganizationRequestBody } from "@konnected/types";
import { registerOrganization } from "../controllers/onboarding";

const onboardingRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/v1/onboarding/register-organization
  app.post<{ Body: RegisterOrganizationRequestBody }>(
    "/register-organization",
    {
      schema: {
        tags: ["Onboarding"],
        summary: "Register a new organization and admin user",
        body: $ref("registerOrganizationSchema"),
        response: {
          200: $ref("registerOrganizationResponseSchema"),
        },
        security: [],
      },
    },
    registerOrganization,
  );
};

export default onboardingRoutes;
