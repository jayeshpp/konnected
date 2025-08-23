import { buildJsonSchemas } from "fastify-zod";
import { commonSchemas } from "./common";
import { adminSchemas } from "./identity/admin";
import { authSchemas } from "./identity/auth";
import { onboardingSchemas } from "./identity/onboarding";

export * from "./user";

export const allSchemasMap = {
  ...commonSchemas,
  ...adminSchemas,
  ...authSchemas,
  ...onboardingSchemas,
};

const { schemas: allSchemas, $ref } = buildJsonSchemas(allSchemasMap, {
  $id: "allSchemas",
});

export { allSchemas, $ref };
