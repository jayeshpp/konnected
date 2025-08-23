import { buildJsonSchemas } from "fastify-zod";
import { z } from "zod";

export const TenantHeaderSchema = z.object({
  "x-tenant-id": z.string().min(1, "Tenant ID is required"),
});

export type TenantHeader = z.infer<typeof TenantHeaderSchema>;

export const { schemas: tenantSchemas, $ref } = buildJsonSchemas(
  {
    TenantHeaderSchema,
  },
  {
    $id: "tenantSchemas",
  },
);
