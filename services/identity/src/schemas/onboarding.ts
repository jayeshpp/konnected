import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";

export const registerOrganizationSchema = z
  .object({
    organizationName: z.string().min(3, "Organization name must be at least 3 characters."),
    organizationSlug: z
      .string()
      .min(3, "Organization slug must be at least 3 characters.")
      .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens.")
      .optional(),
    adminEmail: z.string().email("Invalid admin email format."),
    adminPassword: z.string().min(10, "Admin password must be at least 10 characters long."),
    adminName: z.string().optional(),
  })
  .describe("RegisterOrganizationRequestBody");

export const { schemas: onboardingSchemas, $ref } = buildJsonSchemas(
  {
    registerOrganizationSchema,
  },
  {
    $id: "onboardingSchemas",
  },
);
