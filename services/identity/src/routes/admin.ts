import { FastifyPluginAsync } from "fastify";
import {
  RegisterRequestBody,
  UserIdParams,
  UserRoleParams,
  AssignRolesRequestBody,
  UserUpdateRequestBody,
  InviteUserRequestBody,
  CreateRoleRequestBody,
  RoleIdParams,
  UpdateRoleRequestBody,
  CreatePermissionRequestBody,
  PermissionIdParams,
  AssignPermissionsRequestBody,
  RolePermissionParams,
} from "@konnected/types";
import {
  getUsers,
  getUserById,
  createAdminUser,
  inviteUser,
  updateAdminUser,
  deleteAdminUser,
  assignRolesToUser,
  revokeRoleFromUser,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  createPermission,
  deletePermission,
  assignPermissionsToRole,
  revokePermissionFromRole,
} from "../controllers/admin";
import { $ref } from "../schemas/admin";

const adminRoutes: FastifyPluginAsync = async (app) => {
  // All routes here are scoped to the 'admin' role
  app.addHook("onRequest", app.authorize(["admin"]));

  // --- User Management Routes ---
  app.get(
    "/users",
    {
      schema: {
        tags: ["Admin"],
        summary: "Get all users",
      },
    },
    getUsers,
  );

  app.get<{ Params: UserIdParams }>(
    "/users/:id",
    {
      schema: {
        tags: ["Admin"],
        summary: "Get user by ID",
        params: $ref("userIdParamsSchema"),
      },
    },
    getUserById,
  );

  app.post<{ Body: RegisterRequestBody & { roleIds?: string[] } }>(
    "/users",
    {
      schema: {
        tags: ["Admin"],
        summary: "Create a new admin user",
        body: $ref("adminCreateUserSchema"),
      },
    },
    createAdminUser,
  );

  app.post<{ Body: InviteUserRequestBody }>(
    "/users/invite",
    {
      schema: {
        tags: ["Admin"],
        summary: "Invite a user via email",
        body: $ref("inviteUserSchema"),
      },
    },
    inviteUser,
  );

  app.put<{ Params: UserIdParams; Body: UserUpdateRequestBody }>(
    "/users/:id",
    {
      schema: {
        tags: ["Admin"],
        summary: "Update user details",
        params: $ref("userIdParamsSchema"),
        body: $ref("userUpdateBodySchema"),
      },
    },
    updateAdminUser,
  );

  app.delete<{ Params: UserIdParams }>(
    "/users/:id",
    {
      schema: {
        tags: ["Admin"],
        summary: "Delete user by ID",
        params: $ref("userIdParamsSchema"),
      },
    },
    deleteAdminUser,
  );

  app.post<{ Params: UserIdParams; Body: AssignRolesRequestBody }>(
    "/users/:userId/roles",
    {
      schema: {
        tags: ["Admin"],
        summary: "Assign roles to a user",
        params: $ref("userIdParamsSchema"),
        body: $ref("assignRolesBodySchema"),
      },
    },
    assignRolesToUser,
  );

  app.delete<{ Params: UserRoleParams }>(
    "/users/:userId/roles/:roleId",
    {
      schema: {
        tags: ["Admin"],
        summary: "Revoke a role from a user",
        params: $ref("userRoleParamsSchema"),
      },
    },
    revokeRoleFromUser,
  );

  // --- Role Management Routes ---
  app.get(
    "/roles",
    {
      schema: {
        tags: ["Admin"],
        summary: "Get all roles",
      },
    },
    getRoles,
  );

  app.post<{ Body: CreateRoleRequestBody }>(
    "/roles",
    {
      schema: {
        tags: ["Admin"],
        summary: "Create a new role",
        body: $ref("createRoleBodySchema"),
      },
    },
    createRole,
  );

  app.put<{ Params: RoleIdParams; Body: UpdateRoleRequestBody }>(
    "/roles/:id",
    {
      schema: {
        tags: ["Admin"],
        summary: "Update role by ID",
        params: $ref("roleIdParamsSchema"),
        body: $ref("updateRoleBodySchema"),
      },
    },
    updateRole,
  );

  app.delete<{ Params: RoleIdParams }>(
    "/roles/:id",
    {
      schema: {
        tags: ["Admin"],
        summary: "Delete role by ID",
        params: $ref("roleIdParamsSchema"),
      },
    },
    deleteRole,
  );

  // --- Permission Management Routes ---
  app.get(
    "/permissions",
    {
      schema: {
        tags: ["Admin"],
        summary: "Get all permissions",
      },
    },
    getPermissions,
  );

  app.post<{ Body: CreatePermissionRequestBody }>(
    "/permissions",
    {
      schema: {
        tags: ["Admin"],
        summary: "Create a new permission",
        body: $ref("createPermissionBodySchema"),
      },
    },
    createPermission,
  );

  app.delete<{ Params: PermissionIdParams }>(
    "/permissions/:id",
    {
      schema: {
        tags: ["Admin"],
        summary: "Delete permission by ID",
        params: $ref("permissionIdParamsSchema"),
      },
    },
    deletePermission,
  );

  app.post<{ Params: RoleIdParams; Body: AssignPermissionsRequestBody }>(
    "/roles/:roleId/permissions",
    {
      schema: {
        tags: ["Admin"],
        summary: "Assign permissions to a role",
        params: $ref("roleIdParamsSchema"),
        body: $ref("assignPermissionsBodySchema"),
      },
    },
    assignPermissionsToRole,
  );

  app.delete<{ Params: RolePermissionParams }>(
    "/roles/:roleId/permissions/:permissionId",
    {
      schema: {
        tags: ["Admin"],
        summary: "Revoke a permission from a role",
        params: $ref("rolePermissionParamsSchema"),
      },
    },
    revokePermissionFromRole,
  );
};

export default adminRoutes;
