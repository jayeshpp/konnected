import { FastifyPluginAsync } from "fastify";

import { registerOrganization } from "../controllers/onboarding";
import {
  RegisterOrganizationRequestBody,
  registerOrganizationResponseSchema,
  registerOrganizationSchema,
} from "@konnected/types";

const onboardingRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/v1/onboarding/register-organization
  app.post<{ Body: RegisterOrganizationRequestBody }>(
    "/register-organization",
    {
      schema: {
        tags: ["Onboarding"],
        summary: "Register a new organization and admin user",
        body: registerOrganizationSchema,
        response: {
          200: registerOrganizationResponseSchema,
        },
        security: [],
      },
    },
    registerOrganization,
  );
};

export default onboardingRoutes;
