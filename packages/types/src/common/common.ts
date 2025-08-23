import { z } from "zod";

export const id = z.string().min(1);
export const dateISO = z.string().datetime().or(z.string()); // relax if needed
export const pagination = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});
