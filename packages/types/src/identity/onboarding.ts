import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";

export const registerOrganizationSchema = z
  .object({
    organizationName: z.string().min(3, "Organization name must be at least 3 characters."),
    organizationSlug: z
      .string()
      .min(3, "Organization slug must be at least 3 characters.")
      .max(15, "Organization slug must be max 15 characters.")
      .regex(/^[a-z-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
    adminEmail: z.string().email("Invalid admin email format."),
    adminPassword: z.string().min(10, "Admin password must be at least 10 characters long."),
    adminName: z.string(),
  })
  .describe("RegisterOrganizationRequestBody");

export const registerOrganizationResponseSchema = z
  .object({
    message: z
      .literal("Organization registered successfully. Admin user created.")
      .describe("Confirmation message"),
    tenantId: z.string().uuid().describe("The UUID of the newly created tenant"),
    adminUserId: z.string().uuid().describe("The UUID of the created admin user"),
    accessToken: z.string().describe("JWT access token for the admin user"),
    refreshToken: z.string().describe("JWT refresh token for the admin user"),
  })
  .describe("RegisterOrganizationResponse");

export const onboardingSchemas = {
  registerOrganizationSchema,
  registerOrganizationResponseSchema,
};
