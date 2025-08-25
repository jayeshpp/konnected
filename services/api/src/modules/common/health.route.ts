import { FastifyPluginAsync } from "fastify";
import { healthController } from "./health.controller";
import z from "zod";

export const HealthResponseSchema = z.object({
  status: z.string(),
  uptime: z.number(),
  timestamp: z.string(),
});

export const healthRoute: FastifyPluginAsync = async (app) => {
  app.get(
    "/health",
    {
      schema: {
        tags: ["Common"],
        summary: "Health check",
        response: {
          200: HealthResponseSchema,
        },
      },
    },
    healthController,
  );
};
export default healthRoute;
