import { FastifyPluginAsync } from "fastify";

import { RegisterOrganizationRequestBody } from "@konnected/types";
import { registerOrganization } from "../controllers/onboarding";
import { $ref } from "../schemas/onboarding";

const onboardingRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/v1/onboarding/register-organization
  app.post<{ Body: RegisterOrganizationRequestBody }>(
    "/register-organization",
    {
      schema: {
        body: $ref("registerOrganizationSchema"),
      },
    },
    registerOrganization,
  );
};

export default onboardingRoutes;
