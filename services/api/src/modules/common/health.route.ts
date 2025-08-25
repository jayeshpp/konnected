import { FastifyPluginAsync } from "fastify";
import { healthController } from "./health.controller";

export const healthRoute: FastifyPluginAsync = async (app) => {
  app.get(
    "/health",
    {
      schema: {
        tags: ["Common"],
        summary: "Health check",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              uptime: { type: "number" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    healthController,
  );
};
export default healthRoute;
