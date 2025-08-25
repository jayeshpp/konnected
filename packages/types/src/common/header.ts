import { z } from "zod";

export const HeaderSchema = z.object({
  "x-tenant-id": z.string().min(1, "Tenant ID is required"),
});

export type Header = z.infer<typeof HeaderSchema>;
