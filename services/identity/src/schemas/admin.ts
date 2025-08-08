// src/schemas/admin.ts

import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";

// Schemas for user management
export const userIdParamsSchema = z.object({
  id: z.string().cuid("Invalid user ID format."),
});

export const userRoleParamsSchema = z.object({
  userId: z.string().cuid("Invalid user ID format."),
  roleId: z.string().cuid("Invalid role ID format."),
});

export const assignRolesBodySchema = z.object({
  roleIds: z
    .array(z.string().cuid("Invalid role ID format."))
    .min(1, "At least one role ID is required."),
});

export const userUpdateBodySchema = z
  .object({
    name: z.string().optional(),
    email: z.string().email("Invalid email format.").optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

// Schema for direct admin user creation (less common with invite flow)
export const adminCreateUserSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  name: z.string().optional(),
  roleIds: z.array(z.string().cuid("Invalid role ID format.")).optional(),
});

// Schema for the invite user API
export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email format."),
  name: z.string().optional(),
  roleIds: z.array(z.string().cuid("Invalid role ID format.")).optional(),
});

// Schemas for role management
export const roleIdParamsSchema = z.object({
  id: z.string().cuid("Invalid role ID format."),
});

export const createRoleBodySchema = z.object({
  name: z.string().min(1, "Role name is required."),
  description: z.string().optional(),
});

export const updateRoleBodySchema = z
  .object({
    name: z.string().min(1, "Role name is required.").optional(),
    description: z.string().optional(),
  })
  .strict();

// Schemas for permission management
export const permissionIdParamsSchema = z.object({
  id: z.string().cuid("Invalid permission ID format."),
});

export const createPermissionBodySchema = z.object({
  name: z.string().min(1, "Permission name is required."),
  description: z.string().optional(),
});

export const assignPermissionsBodySchema = z.object({
  permissionIds: z
    .array(z.string().cuid("Invalid permission ID format."))
    .min(1, "At least one permission ID is required."),
});

export const rolePermissionParamsSchema = z.object({
  roleId: z.string().cuid("Invalid role ID format."),
  permissionId: z.string().cuid("Invalid permission ID format."),
});

// Build and export all schemas for Fastify
export const { schemas: adminSchemas, $ref } = buildJsonSchemas(
  {
    userIdParamsSchema,
    userRoleParamsSchema,
    assignRolesBodySchema,
    userUpdateBodySchema,
    adminCreateUserSchema,
    inviteUserSchema,
    roleIdParamsSchema,
    createRoleBodySchema,
    updateRoleBodySchema,
    permissionIdParamsSchema,
    createPermissionBodySchema,
    assignPermissionsBodySchema,
    rolePermissionParamsSchema,
  },
  {
    $id: "adminSchemas",
  },
);
