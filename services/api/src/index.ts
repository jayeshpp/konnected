import Fastify from "fastify";
import { authMiddleware, tenantIdentifierMiddleware } from "@konnected/middlewares";
import fastifyJwt from "@fastify/jwt";
import { config } from "@konnected/config";
import { setupSwagger } from "@konnected/libs";
import authRoutes from "./modules/identity/routes/auth";
import { allSchemas } from "@konnected/types";
import onboardingRoutes from "./modules/identity/routes/onboarding";
import adminRoutes from "./modules/identity/routes/admin";

const app = Fastify({ logger: true });

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

// Register all schemas at the top level
for (const schema of [...allSchemas]) {
  app.addSchema(schema);
}

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
    //onboardingScopedFastify.addHook("preHandler", tenantIdentifierMiddleware);
    onboardingScopedFastify.register(onboardingRoutes, { prefix: "/onboarding" });
  },
  { prefix: "/api/v1" },
);

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
