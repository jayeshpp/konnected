/* import { FastifyPluginAsync } from "fastify";
import { db } from "@konnected/database";
import { authMiddleware } from "@konnected/middlewares";
import {
  UserIdParams,
  UserRoleParams,
  AssignRolesRequestBody,
  UserUpdateRequestBody,
  RegisterRequestBody,
  CreateRoleRequestBody,
  RoleIdParams,
  UpdateRoleRequestBody,
  CreatePermissionRequestBody,
  PermissionIdParams,
  AssignPermissionsRequestBody,
  RolePermissionParams,
} from "@konnected/types";
import { z } from "zod";
import bcrypt from "bcryptjs";
import zodToJsonSchema from "zod-to-json-schema";

// --- Schemas for input validation ---
const userIdParamsSchema = z.object({
  id: z.string().cuid("Invalid user ID format."),
});

const userRoleParamsSchema = z.object({
  userId: z.string().cuid("Invalid user ID format."),
  roleId: z.string().cuid("Invalid role ID format."),
});

const assignRolesBodySchema = z.object({
  roleIds: z
    .array(z.string().cuid("Invalid role ID format."))
    .min(1, "At least one role ID is required."),
});

const userUpdateBodySchema = z
  .object({
    name: z.string().optional(),
    email: z.string().email("Invalid email format.").optional(),
    isActive: z.boolean().optional(),
  })
  .strict(); // Disallow unknown keys

const adminCreateUserSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  name: z.string().optional(),
  roles: z.array(z.string().cuid("Invalid role ID format.")).optional(), // Roles to assign on creation
});

const roleIdParamsSchema = z.object({
  id: z.string().cuid("Invalid role ID format."),
});

const createRoleBodySchema = z.object({
  name: z.string().min(1, "Role name is required."),
  description: z.string().optional(),
});

const updateRoleBodySchema = z
  .object({
    name: z.string().min(1, "Role name is required.").optional(),
    description: z.string().optional(),
  })
  .strict();

const permissionIdParamsSchema = z.object({
  id: z.string().cuid("Invalid permission ID format."),
});

const createPermissionBodySchema = z.object({
  name: z.string().min(1, "Permission name is required."),
  description: z.string().optional(),
});

const assignPermissionsBodySchema = z.object({
  permissionIds: z
    .array(z.string().cuid("Invalid permission ID format."))
    .min(1, "At least one permission ID is required."),
});

const rolePermissionParamsSchema = z.object({
  roleId: z.string().cuid("Invalid role ID format."),
  permissionId: z.string().cuid("Invalid permission ID format."),
});

const adminRoutes: FastifyPluginAsync = async (app) => {
  // Apply authentication and restrict to 'admin' role for all routes in this plugin
  app.addHook("onRequest", authMiddleware(["admin"]));

  // --- User Management ---

  // GET /api/v1/admin/users
  app.get("/users", async (req, reply) => {
    try {
      // TODO: Implement pagination, filtering, and sorting as per API design
      const users = await db.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      reply.send({
        users: users.map((user) => ({
          ...user,
          roles: user.roles.map((ur) => ur.role.name),
        })),
        total: users.length, // Placeholder, replace with actual count for pagination
        page: 1, // Placeholder
        limit: users.length, // Placeholder
      });
    } catch (error) {
      app.log.error("Error fetching users:", error);
      reply.status(500).send({ message: "Internal Server Error." });
    }
  });

  // GET /api/v1/admin/users/:id
  app.get<{ Params: UserIdParams }>(
    "/users/:id",
    { schema: { params: zodToJsonSchema(userIdParamsSchema) } },
    async (req, reply) => {
      try {
        const { id } = req.params;
        const user = await db.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            roles: {
              include: {
                role: true,
              },
            },
          },
        });

        if (!user) {
          return reply.status(404).send({ message: "User not found." });
        }

        reply.send({
          ...user,
          roles: user.roles.map((ur) => ur.role.name),
        });
      } catch (error) {
        app.log.error("Error fetching user by ID:", error);
        reply.status(500).send({ message: "Internal Server Error." });
      }
    },
  );

  // POST /api/v1/admin/users (Admin creates a new user)
  app.post<{ Body: RegisterRequestBody & { roles?: string[] } }>(
    "/users",
    { schema: { body: zodToJsonSchema(adminCreateUserSchema) } },
    async (req, reply) => {
      try {
        const { email, password, name, roles } = req.body;
        const tenantId = req.tenantId ?? "";

        const existingUser = await db.user.findUnique({ where: { email } });
        if (existingUser) {
          return reply.status(400).send({ message: "Email already exists." });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await db.user.create({
          data: {
            email,
            passwordHash,
            name,
            emailVerified: true, // Admins can create verified users
            isActive: true,
            tenantId,
          },
        });

        if (roles && roles.length > 0) {
          const roleRecords = await db.role.findMany({
            where: { id: { in: roles } },
          });

          if (roleRecords.length !== roles.length) {
            return reply
              .status(400)
              .send({ message: "One or more provided role IDs are invalid." });
          }

          await db.userRole.createMany({
            data: roles.map((roleId) => ({
              userId: newUser.id,
              roleId: roleId,
            })),
          });
        } else {
          // Assign default 'user' role if no roles are specified by admin
          const defaultRole = await db.role.findUnique({ where: { name: "user" } });
          if (defaultRole) {
            await db.userRole.create({
              data: {
                userId: newUser.id,
                roleId: defaultRole.id,
              },
            });
          }
        }

        reply.status(201).send({
          message: "User created successfully.",
          userId: newUser.id,
        });
      } catch (error) {
        app.log.error("Error creating user by admin:", error);
        reply.status(500).send({ message: "Internal Server Error." });
      }
    },
  );

  // PUT /api/v1/admin/users/:id (Admin updates user details)
  app.put<{ Params: UserIdParams; Body: UserUpdateRequestBody }>(
    "/users/:id",
    {
      schema: {
        params: zodToJsonSchema(userIdParamsSchema),
        body: zodToJsonSchema(userUpdateBodySchema),
      },
    },
    async (req, reply) => {
      try {
        const { id } = req.params;
        const { name, email, isActive } = req.body;

        const updatedUser = await db.user.update({
          where: { id },
          data: { name, email, isActive },
          select: { id: true, email: true, name: true, isActive: true, updatedAt: true },
        });

        reply.send({ message: "User updated successfully.", user: updatedUser });
      } catch (error) {
        app.log.error("Error updating user by admin:", error);
        reply.status(500).send({ message: "Internal Server Error." });
      }
    },
  );

  // DELETE /api/v1/admin/users/:id (Admin deletes a user)
  app.delete<{ Params: UserIdParams }>(
    "/users/:id",
    { schema: { params: zodToJsonSchema(userIdParamsSchema) } },
    async (req, reply) => {
      try {
        const { id } = req.params;
        await db.user.delete({ where: { id } });
        reply.status(204).send(); // No content on successful deletion
      } catch (error) {
        app.log.error("Error deleting user by admin:", error);
        reply.status(500).send({ message: "Internal Server Error." });
      }
    },
  );

  // POST /api/v1/admin/users/:userId/roles (Assign roles to a user)
  app.post<{ Params: UserIdParams; Body: AssignRolesRequestBody }>(
    "/users/:id/roles",
    {
      schema: {
        params: zodToJsonSchema(userIdParamsSchema),
        body: zodToJsonSchema(assignRolesBodySchema),
      },
    },
    async (req, reply) => {
      try {
        const { id: userId } = req.params;
        const { roleIds } = req.body;

        // Verify user and roles exist
        const userExists = await db.user.findUnique({ where: { id: userId } });
        if (!userExists) return reply.status(404).send({ message: "User not found." });

        const rolesExist = await db.role.findMany({ where: { id: { in: roleIds } } });
        if (rolesExist.length !== roleIds.length) {
          return reply.status(400).send({ message: "One or more role IDs are invalid." });
        }

        // Create UserRole entries, ignoring duplicates
        await db.userRole.createMany({
          data: roleIds.map((roleId) => ({
            userId,
            roleId,
          })),
          skipDuplicates: true, // Prevents error if role already assigned
        });

        reply.send({ message: "Roles assigned successfully." });
      } catch (error) {
        app.log.error("Error assigning roles:", error);
        reply.status(500).send({ message: "Internal Server Error." });
      }
    },
  );

  // DELETE /api/v1/admin/users/:userId/roles/:roleId (Revoke a role from a user)
  app.delete<{ Params: UserRoleParams }>(
    "/users/:userId/roles/:roleId",
    { schema: { params: zodToJsonSchema(userRoleParamsSchema) } },
    async (req, reply) => {
      try {
        const { userId, roleId } = req.params;

        const deleted = await db.userRole.deleteMany({
          where: {
            userId,
            roleId,
          },
        });

        if (deleted.count === 0) {
          return reply.status(404).send({ message: "User-role association not found." });
        }

        reply.status(204).send(); // No content on successful deletion
      } catch (error) {
        app.log.error("Error revoking role:", error);
        reply.status(500).send({ message: "Internal Server Error." });
      }
    },
  );

  // --- Role Management ---

  // GET /api/v1/admin/roles
  app.get("/roles", async (req, reply) => {
    try {
      const roles = await db.role.findMany({
        select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
      });
      reply.send({ roles });
    } catch (error) {
      app.log.error("Error fetching roles:", error);
      reply.status(500).send({ message: "Internal Server Error." });
    }
  });

  // POST /api/v1/admin/roles
  app.post<{ Body: CreateRoleRequestBody }>(
    "/roles",
    { schema: { body: zodToJsonSchema(createRoleBodySchema) } },
    async (req, reply) => {
      try {
        const { name, description } = req.body;
        const tenantId = req.tenantId ?? "";
        const newRole = await db.role.create({
          data: { name, description, tenantId },
        });
        reply.status(201).send({ message: "Role created successfully.", roleId: newRole.id });
      } catch (error: any) {
        if (error.code === "P2002") {
          // Prisma unique constraint violation
          return reply.status(400).send({ message: "Role with this name already exists." });
        }
        app.log.error("Error creating role:", error);
        reply.status(500).send({ message: "Internal Server Error." });
      }
    },
  );

  // PUT /api/v1/admin/roles/:id
  app.put<{ Params: RoleIdParams; Body: UpdateRoleRequestBody }>(
    "/roles/:id",
    {
      schema: {
        params: zodToJsonSchema(roleIdParamsSchema),
        body: zodToJsonSchema(updateRoleBodySchema),
      },
    },
    async (req, reply) => {
      try {
        const { id } = req.params;
        const { name, description } = req.body;
        const updatedRole = await db.role.update({
          where: { id },
          data: { name, description },
        });
        reply.send({ message: "Role updated successfully.", role: updatedRole });
      } catch (error: any) {
        if (error.code === "P2025") {
          // Prisma record not found
          return reply.status(404).send({ message: "Role not found." });
        }
        if (error.code === "P2002") {
          // Prisma unique constraint violation
          return reply.status(400).send({ message: "Role with this name already exists." });
        }
        app.log.error("Error updating role:", error);
        reply.status(500).send({ message: "Internal Server Error." });
      }
    },
  );

  // DELETE /api/v1/admin/roles/:id
  app.delete<{ Params: RoleIdParams }>(
    "/roles/:id",
    { schema: { params: zodToJsonSchema(roleIdParamsSchema) } },
    async (req, reply) => {
      try {
        const { id } = req.params;
        await db.role.delete({ where: { id } });
        reply.status(204).send();
      } catch (error: any) {
        if (error.code === "P2025") {
          // Prisma record not found
          return reply.status(404).send({ message: "Role not found." });
        }
        app.log.error("Error deleting role:", error);
        reply.status(500).send({ message: "Internal Server Error." });
      }
    },
  );

  // --- Permission Management ---

  // GET /api/v1/admin/permissions
  app.get("/permissions", async (req, reply) => {
    try {
      const permissions = await db.permission.findMany({
        select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
      });
      reply.send({ permissions });
    } catch (error) {
      app.log.error("Error fetching permissions:", error);
      reply.status(500).send({ message: "Internal Server Error." });
    }
  });

  // POST /api/v1/admin/permissions
  app.post<{ Body: CreatePermissionRequestBody }>(
    "/permissions",
    { schema: { body: zodToJsonSchema(createPermissionBodySchema) } },
    async (req, reply) => {
      try {
        const { name, description } = req.body;
        const tenantId = req.tenantId ?? "";
        const newPermission = await db.permission.create({
          data: { name, description, tenantId },
        });
        reply
          .status(201)
          .send({ message: "Permission created successfully.", permissionId: newPermission.id });
      } catch (error: any) {
        if (error.code === "P2002") {
          // Prisma unique constraint violation
          return reply.status(400).send({ message: "Permission with this name already exists." });
        }
        app.log.error("Error creating permission:", error);
        reply.status(500).send({ message: "Internal Server Error." });
      }
    },
  );

  // DELETE /api/v1/admin/permissions/:id
  app.delete<{ Params: PermissionIdParams }>(
    "/permissions/:id",
    { schema: { params: zodToJsonSchema(permissionIdParamsSchema) } },
    async (req, reply) => {
      try {
        const { id } = req.params;
        await db.permission.delete({ where: { id } });
        reply.status(204).send();
      } catch (error: any) {
        if (error.code === "P2025") {
          // Prisma record not found
          return reply.status(404).send({ message: "Permission not found." });
        }
        app.log.error("Error deleting permission:", error);
        reply.status(500).send({ message: "Internal Server Error." });
      }
    },
  );

  // POST /api/v1/admin/roles/:roleId/permissions (Assign permissions to a role)
  app.post<{ Params: RoleIdParams; Body: AssignPermissionsRequestBody }>(
    "/roles/:id/permissions",
    {
      schema: {
        params: zodToJsonSchema(roleIdParamsSchema),
        body: zodToJsonSchema(assignPermissionsBodySchema),
      },
    },
    async (req, reply) => {
      try {
        const { id: roleId } = req.params;
        const { permissionIds } = req.body;

        // Verify role and permissions exist
        const roleExists = await db.role.findUnique({ where: { id: roleId } });
        if (!roleExists) return reply.status(404).send({ message: "Role not found." });

        const permissionsExist = await db.permission.findMany({
          where: { id: { in: permissionIds } },
        });
        if (permissionsExist.length !== permissionIds.length) {
          return reply.status(400).send({ message: "One or more permission IDs are invalid." });
        }

        await db.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
          skipDuplicates: true,
        });

        reply.send({ message: "Permissions assigned to role successfully." });
      } catch (error) {
        app.log.error("Error assigning permissions to role:", error);
        reply.status(500).send({ message: "Internal Server Error." });
      }
    },
  );

  // DELETE /api/v1/admin/roles/:roleId/permissions/:permissionId (Revoke a permission from a role)
  app.delete<{ Params: RolePermissionParams }>(
    "/roles/:roleId/permissions/:permissionId",
    { schema: { params: zodToJsonSchema(rolePermissionParamsSchema) } },
    async (req, reply) => {
      try {
        const { roleId, permissionId } = req.params;

        const deleted = await db.rolePermission.deleteMany({
          where: {
            roleId,
            permissionId,
          },
        });

        if (deleted.count === 0) {
          return reply.status(404).send({ message: "Role-permission association not found." });
        }

        reply.status(204).send();
      } catch (error) {
        app.log.error("Error revoking permission from role:", error);
        reply.status(500).send({ message: "Internal Server Error." });
      }
    },
  );
};

export default adminRoutes;
 */
