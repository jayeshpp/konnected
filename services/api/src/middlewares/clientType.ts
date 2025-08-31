import { FastifyPluginAsync } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    clientType: "web" | "mobile";
  }
}

export const clientTypeMiddleware: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (req, _reply) => {
    const header = (req.headers["x-client-type"] as string)?.toLowerCase();
    req.clientType = header === "mobile" ? "mobile" : "web";
  });
};

export default clientTypeMiddleware;
