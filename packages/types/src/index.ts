import { commonSchemas } from "./common";
import { adminSchemas } from "./identity/admin";
import { authSchemas } from "./identity/auth";
import { onboardingSchemas } from "./identity/onboarding";
import { userSchemas } from "./identity/user";
import { mapKeys, pipe } from "remeda";
import z from "zod";

export * from "./identity";
export * from "./common";

export const allSchemasMap = {
  ...commonSchemas,
  ...adminSchemas,
  ...authSchemas,
  ...onboardingSchemas,
  ...userSchemas,
};

export const schemas = pipe(
  allSchemasMap,
  mapKeys((key) => key.replace(/Schema$/, "")), // strip "Schema"
) satisfies Record<string, z.ZodType>;
