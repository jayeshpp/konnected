import { createSchema } from "zod-openapi";
import { FastifyInstance } from "fastify";
import { schemas } from "@konnected/types";
import z from "zod";

function isZodSchema(obj: any): obj is z.ZodType {
  return obj instanceof z.ZodType;
}

export function registerSchemas(app: FastifyInstance) {
  for (const [key, schema] of Object.entries(schemas)) {
    if (isZodSchema(schema)) {
      const { schema: jsonSchema, components } = createSchema(schema, { io: "input" });

      // Register main schema
      app.addSchema({
        $id: key,
        ...jsonSchema,
      });

      // Register nested components
      if (components.schemas) {
        for (const [compKey, compSchema] of Object.entries(components.schemas)) {
          app.addSchema({
            $id: compKey,
            ...compSchema,
          });
        }
      }
    }
  }
}
