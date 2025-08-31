import fastifyJwt from "@fastify/jwt";
import { config } from "@konnected/config";
import { setupSwagger } from "@konnected/libs";
import { authMiddleware, tenantIdentifierMiddleware } from "./middlewares";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";

import adminRoutes from "./modules/identity/routes/admin";
import authRoutes from "./modules/identity/routes/auth";
import onboardingRoutes from "./modules/identity/routes/onboarding";
import healthRoute from "./modules/common/health.route";
import { registerSchemas } from "./plugins/registerSchemas";

const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
});

registerSchemas(app);

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

setupSwagger(app, {
  title: "Travel Planner API",
  description: "API docs for Konnected Platform Services",
  version: "1.0.0",
});

app.addHook("preHandler", (req, reply, done) => {
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  done();
});

app.addHook("onRequest", async (request) => {
  console.log("Tenant ID:", request.headers["x-tenant-id"]);
});

app.register(cookie);

app.register(fastifyJwt, {
  secret: {
    private: config.ACCESS_TOKEN_SECRET,
    public: config.ACCESS_TOKEN_SECRET,
  },
});

app.register(async (fastify) => {
  fastify.decorate("authenticate", authMiddleware());
  fastify.decorate("authorize", authMiddleware);

  fastify.register(
    async (tenantScopedFastify) => {
      tenantScopedFastify.addHook("preHandler", tenantIdentifierMiddleware);
      tenantScopedFastify.register(authRoutes, { prefix: "/auth" });
      tenantScopedFastify.register(adminRoutes, { prefix: "/admin" });
    },
    { prefix: "/api/v1" },
  );
});

app.register(
  async (onboardingScopedFastify) => {
    onboardingScopedFastify.register(onboardingRoutes, { prefix: "/onboarding" });
  },
  { prefix: "/api/v1" },
);
app.register(healthRoute, { prefix: "/api/v1" });

const start = async () => {
  try {
    await app.listen({ port: config.PORT_IDENTITY, host: "0.0.0.0" });
    app.log.info(`🚀 Identity service listening on port ${config.PORT_IDENTITY}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
