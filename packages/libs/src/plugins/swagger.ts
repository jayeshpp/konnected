import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import { FastifyInstance } from "fastify";

interface SwaggerOptions {
  title: string;
  description?: string;
  version?: string;
}

export async function setupSwagger(app: FastifyInstance, options: SwaggerOptions) {
  const { title, description = "", version = "1.0.0" } = options;
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title,
        description,
        version,
      },
      tags: [
        { name: "Onboarding", description: "Onboarding related end-points" },
        { name: "User", description: "User related end-points" },
        { name: "Role", description: "Role related end-points" },
        { name: "Permission", description: "Permission related end-points" },
        { name: "Auth", description: "Auth related end-points" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT", // Optional, for display
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
  });

  await app.register(fastifySwaggerUI, {
    routePrefix: "/docs/api",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });
}
