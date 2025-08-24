import { buildJsonSchemas } from "fastify-zod";
import { commonSchemas } from "./common";
import { adminSchemas } from "./identity/admin";
import { authSchemas } from "./identity/auth";
import { onboardingSchemas } from "./identity/onboarding";
import { userSchemas } from "./identity/user";

export * from "./identity/user";

export const allSchemasMap = {
  ...commonSchemas,
  ...adminSchemas,
  ...authSchemas,
  ...onboardingSchemas,
  ...userSchemas,
};

const { schemas: allSchemas, $ref } = buildJsonSchemas(allSchemasMap, {
  $id: "allSchemas",
});

export { allSchemas, $ref };
