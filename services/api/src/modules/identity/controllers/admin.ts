import { db } from "@konnected/database";
import { sendEmail } from "@konnected/email";
import {
  InviteUserRequestBody,
  UserIdParams,
  UserRoleParams,
  AssignRolesRequestBody,
  UserUpdateRequestBody,
  CreateRoleRequestBody,
  RoleIdParams,
  UpdateRoleRequestBody,
  CreatePermissionRequestBody,
  PermissionIdParams,
  AssignPermissionsRequestBody,
  RolePermissionParams,
  AdminCreateUserBody,
  InviteBulkUserRequestBody,
} from "@konnected/types";
import bcrypt from "bcryptjs";
import { FastifyReply, FastifyRequest } from "fastify";
import { nanoid } from "nanoid";

// --- User Management Controllers ---

export const getUsers = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const tenantId = req.tenantId;
    const users = await db.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        roles: { include: { role: true } },
      },
    });

    reply.send({
      users: users.map((user) => ({
        ...user,
        roles: user.roles.map((ur) => ur.role.name),
      })),
      total: users.length,
      page: 1,
      limit: users.length,
    });
  } catch (error) {
    req.log.error("Error fetching users:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

export const getUserById = async (
  req: FastifyRequest<{ Params: UserIdParams }>,
  reply: FastifyReply,
) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId as string;
    const user = await db.user.findUnique({
      where: { id, tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        roles: { include: { role: true } },
      },
    });

    if (!user) {
      return reply.status(404).send({ message: "User not found." });
    }

    reply.send({ ...user, roles: user.roles.map((ur) => ur.role.name) });
  } catch (error) {
    req.log.error("Error fetching user by ID:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

export const createAdminUser = async (
  req: FastifyRequest<{ Body: AdminCreateUserBody }>,
  reply: FastifyReply,
) => {
  try {
    const { email, password, name, roleIds } = req.body;
    const tenantId = req.tenantId as string;

    const existingUser = await db.user.findUnique({
      where: { email_tenantId: { email, tenantId } },
    });
    if (existingUser) {
      return reply
        .status(400)
        .send({ message: "User with this email already exists in this organization." });
    }

    if (!password) {
      return reply.status(400).send({ message: "Password is required for direct user creation." });
    }
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        tenantId,
        emailVerified: true,
        isActive: true,
      },
    });

    const rolesToAssign = roleIds || [];
    if (rolesToAssign.length > 0) {
      const roleRecords = await db.role.findMany({
        where: { id: { in: rolesToAssign }, tenantId },
      });
      if (roleRecords.length !== rolesToAssign.length) {
        return reply.status(400).send({
          message: "One or more provided role IDs are invalid or do not belong to this tenant.",
        });
      }
      await db.userRole.createMany({
        data: rolesToAssign.map((roleId) => ({ userId: newUser.id, roleId })),
      });
    } else {
      const defaultRole = await db.role.findFirst({ where: { name: "user", tenantId } });
      if (defaultRole) {
        await db.userRole.create({ data: { userId: newUser.id, roleId: defaultRole.id } });
      } else {
        req.log.warn(
          `Default 'user' role not found for tenant ${tenantId} during admin user creation.`,
        );
      }
    }

    reply.status(201).send({ message: "User created successfully.", userId: newUser.id });
  } catch (error) {
    req.log.error("Error creating user by admin:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

export const inviteUser = async (
  req: FastifyRequest<{ Body: InviteUserRequestBody }>,
  reply: FastifyReply,
) => {
  try {
    const { email, name, roleIds } = req.body;
    const tenantId = req.tenantId as string;
    const invitedByUserId = req.user?.id;

    if (!invitedByUserId) {
      return reply.status(401).send({ message: "Inviting user not authenticated." });
    }

    const existingUser = await db.user.findUnique({
      where: { email_tenantId: { email, tenantId } },
    });
    if (existingUser) {
      return reply
        .status(400)
        .send({ message: "User with this email already exists in this organization." });
    }

    const existingInvitation = await db.invitation.findUnique({
      where: { email_tenantId: { email, tenantId } },
    });
    if (
      existingInvitation &&
      existingInvitation.status === "PENDING" &&
      existingInvitation.expiresAt > new Date()
    ) {
      return reply
        .status(400)
        .send({ message: "An invitation has already been sent to this user." });
    }

    if (roleIds && roleIds.length > 0) {
      const roles = await db.role.findMany({
        where: { id: { in: roleIds }, tenantId },
        select: { id: true },
      });
      if (roles.length !== roleIds.length) {
        return reply.status(400).send({
          message: "One or more provided role IDs are invalid or do not belong to this tenant.",
        });
      }
    }

    const invitationToken = nanoid(32);

    await db.invitation.upsert({
      where: { email_tenantId: { email, tenantId } },
      update: {
        token: invitationToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "PENDING",
        invitedByUserId: invitedByUserId,
      },
      create: {
        email,
        tenantId,
        token: invitationToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        invitedByUserId: invitedByUserId,
        status: "PENDING",
      },
    });

    await sendEmail("inviteUser", {
      to: email,
      subject: "You’ve been invited to join Konnected",
      variables: {
        name,
        inviteUrl: `${process.env.FRONTEND_URL}/invite/accept?token=${invitationToken}`,
        orgName: "Acme Inc.",
      },
    });

    req.log.info(`Invitation sent to ${email} for tenant ${tenantId}. Token: ${invitationToken}`);

    reply.status(202).send({ message: "Invitation sent successfully." });
  } catch (error) {
    req.log.error("Error sending invitation:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

export const bulkInviteUsers = async (
  req: FastifyRequest<{ Body: InviteBulkUserRequestBody }>,
  reply: FastifyReply,
) => {
  const { users } = req.body;
  const tenantId = req.tenantId as string;
  const invitedByUserId = req.user?.id;

  // Collect all unique roleIds from the bulk request
  const allRoleIds = Array.from(new Set(users.flatMap((i) => i.roleIds ?? [])));

  // Validate roles belong to tenant
  const validRoles = await db.role.findMany({
    where: { id: { in: allRoleIds }, tenantId },
    select: { id: true },
  });

  const validRoleIds = new Set(validRoles.map((r) => r.id));

  // Check invalid roles
  const invalidRoles = allRoleIds.filter((rid) => !validRoleIds.has(rid));
  if (invalidRoles.length > 0) {
    return reply.status(400).send({
      message: "One or more provided role IDs are invalid or do not belong to this tenant.",
      invalidRoles,
    });
  }
  const results: Array<{ email: string; status: string; message: string }> = [];

  for (const { email, name, roleIds } of req.body.users) {
    try {
      if (!invitedByUserId) {
        return reply.status(401).send({ message: "Inviting user not authenticated." });
      }

      const existingUser = await db.user.findUnique({
        where: { email_tenantId: { email, tenantId } },
      });
      if (existingUser) {
        results.push({
          email,
          status: "already_exists",
          message: `User already exists`,
        });
        continue;
      }

      const existingInvitation = await db.invitation.findUnique({
        where: { email_tenantId: { email, tenantId } },
      });
      if (
        existingInvitation &&
        existingInvitation.status === "PENDING" &&
        existingInvitation.expiresAt > new Date()
      ) {
        results.push({
          email,
          status: "already_exists",
          message: `An invitation has already been sent to this user`,
        });
        continue;
      }

      const invitationToken = nanoid(32);

      await db.invitation.upsert({
        where: { email_tenantId: { email, tenantId } },
        update: {
          token: invitationToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: "PENDING",
          invitedByUserId: invitedByUserId,
        },
        create: {
          email,
          tenantId,
          token: invitationToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          invitedByUserId: invitedByUserId,
          status: "PENDING",
        },
      });

      await sendEmail("inviteUser", {
        to: email,
        subject: "You’ve been invited to join Konnected",
        variables: {
          name,
          inviteUrl: `${process.env.FRONTEND_URL}/invite/accept?token=${invitationToken}`,
          orgName: "Acme Inc.",
        },
      });

      req.log.info(`Invitation sent to ${email} for tenant ${tenantId}. Token: ${invitationToken}`);

      results.push({ email, status: "invited", message: "Invitation sent" });
    } catch (error) {
      req.log.error(`Error inviting ${email}:`, error);
      results.push({ email, status: "failed", message: "Unexpected error" });
    }
  }
  return reply.status(202).send({ results });
};

export const updateAdminUser = async (
  req: FastifyRequest<{ Params: UserIdParams; Body: UserUpdateRequestBody }>,
  reply: FastifyReply,
) => {
  try {
    const { id } = req.params;
    const { name, email, isActive } = req.body;
    const tenantId = req.tenantId as string;

    const updatedUser = await db.user.update({
      where: { id, tenantId },
      data: { name, email, isActive },
      select: { id: true, email: true, name: true, isActive: true, updatedAt: true },
    });

    reply.send({ message: "User updated successfully.", user: updatedUser });
  } catch (error: any) {
    if (error.code === "P2025") {
      return reply
        .status(404)
        .send({ message: "User not found or does not belong to this tenant." });
    }
    req.log.error("Error updating user by admin:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

export const deleteAdminUser = async (
  req: FastifyRequest<{ Params: UserIdParams }>,
  reply: FastifyReply,
) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId as string;
    await db.user.deleteMany({ where: { id, tenantId } });
    reply.status(204).send();
  } catch (error: any) {
    if (error.code === "P2025") {
      return reply
        .status(404)
        .send({ message: "User not found or does not belong to this tenant." });
    }
    req.log.error("Error deleting user by admin:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

export const assignRolesToUser = async (
  req: FastifyRequest<{ Params: UserIdParams; Body: AssignRolesRequestBody }>,
  reply: FastifyReply,
) => {
  try {
    const { id } = req.params;
    const { roleIds } = req.body;
    const tenantId = req.tenantId as string;

    const userExists = await db.user.findUnique({ where: { id: id, tenantId } });
    if (!userExists)
      return reply
        .status(404)
        .send({ message: "User not found or does not belong to this tenant." });

    const rolesExist = await db.role.findMany({ where: { id: { in: roleIds }, tenantId } });
    if (rolesExist.length !== roleIds.length) {
      return reply.status(400).send({
        message: "One or more provided role IDs are invalid or do not belong to this tenant.",
      });
    }

    await db.userRole.createMany({
      data: roleIds.map((roleId) => ({ userId: id, roleId })),
      skipDuplicates: true,
    });
    reply.send({ message: "Roles assigned successfully." });
  } catch (error) {
    req.log.error("Error assigning roles:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

export const revokeRoleFromUser = async (
  req: FastifyRequest<{ Params: UserRoleParams }>,
  reply: FastifyReply,
) => {
  try {
    const { userId, roleId } = req.params;
    const tenantId = req.tenantId as string;

    const userRoleAssociation = await db.userRole.findFirst({
      where: { userId, roleId, user: { tenantId }, role: { tenantId } },
    });
    if (!userRoleAssociation) {
      return reply.status(404).send({
        message: "User-role association not found or does not belong to this tenant context.",
      });
    }

    const deleted = await db.userRole.deleteMany({ where: { userId, roleId } });
    if (deleted.count === 0) {
      return reply.status(404).send({ message: "User-role association not found." });
    }
    reply.status(204).send();
  } catch (error) {
    req.log.error("Error revoking role:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

// --- Role Management Controllers ---

export const getRoles = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const tenantId = req.tenantId as string;
    const roles = await db.role.findMany({
      where: { tenantId },
      select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
    });
    reply.send({ roles });
  } catch (error) {
    req.log.error("Error fetching roles:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

export const createRole = async (
  req: FastifyRequest<{ Body: CreateRoleRequestBody }>,
  reply: FastifyReply,
) => {
  try {
    const { name, description } = req.body;
    const tenantId = req.tenantId as string;
    const newRole = await db.role.create({
      data: { name, description, tenantId },
    });
    reply.status(201).send({ message: "Role created successfully.", roleId: newRole.id });
  } catch (error: any) {
    if (error.code === "P2002") {
      return reply
        .status(400)
        .send({ message: "Role with this name already exists in this tenant." });
    }
    req.log.error("Error creating role:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

export const updateRole = async (
  req: FastifyRequest<{ Params: RoleIdParams; Body: UpdateRoleRequestBody }>,
  reply: FastifyReply,
) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const tenantId = req.tenantId as string;

    const updatedRole = await db.role.update({
      where: { id, tenantId },
      data: { name, description },
    });
    reply.send({ message: "Role updated successfully.", role: updatedRole });
  } catch (error: any) {
    if (error.code === "P2025") {
      return reply
        .status(404)
        .send({ message: "Role not found or does not belong to this tenant." });
    }
    if (error.code === "P2002") {
      return reply
        .status(400)
        .send({ message: "Role with this name already exists in this tenant." });
    }
    req.log.error("Error updating role:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

export const deleteRole = async (
  req: FastifyRequest<{ Params: RoleIdParams }>,
  reply: FastifyReply,
) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId as string;
    await db.role.deleteMany({ where: { id, tenantId } });
    reply.status(204).send();
  } catch (error: any) {
    if (error.code === "P2025") {
      return reply
        .status(404)
        .send({ message: "Role not found or does not belong to this tenant." });
    }
    req.log.error("Error deleting role:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

// --- Permission Management Controllers ---

export const getPermissions = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const tenantId = req.tenantId as string;
    const permissions = await db.permission.findMany({
      where: { tenantId },
      select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
    });
    reply.send({ permissions });
  } catch (error) {
    req.log.error("Error fetching permissions:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

export const createPermission = async (
  req: FastifyRequest<{ Body: CreatePermissionRequestBody }>,
  reply: FastifyReply,
) => {
  try {
    const { name, description } = req.body;
    const tenantId = req.tenantId as string;
    const newPermission = await db.permission.create({
      data: { name, description, tenantId },
    });
    reply
      .status(201)
      .send({ message: "Permission created successfully.", permissionId: newPermission.id });
  } catch (error: any) {
    if (error.code === "P2002") {
      return reply
        .status(400)
        .send({ message: "Permission with this name already exists in this tenant." });
    }
    req.log.error("Error creating permission:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

export const deletePermission = async (
  req: FastifyRequest<{ Params: PermissionIdParams }>,
  reply: FastifyReply,
) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId as string;
    await db.permission.deleteMany({ where: { id, tenantId } });
    reply.status(204).send();
  } catch (error: any) {
    if (error.code === "P2025") {
      return reply
        .status(404)
        .send({ message: "Permission not found or does not belong to this tenant." });
    }
    req.log.error("Error deleting permission:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

export const assignPermissionsToRole = async (
  req: FastifyRequest<{ Params: RoleIdParams; Body: AssignPermissionsRequestBody }>,
  reply: FastifyReply,
) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;
    const tenantId = req.tenantId as string;

    const roleExists = await db.role.findUnique({ where: { id: id, tenantId } });
    if (!roleExists)
      return reply
        .status(404)
        .send({ message: "Role not found or does not belong to this tenant." });

    const permissionsExist = await db.permission.findMany({
      where: { id: { in: permissionIds }, tenantId },
    });
    if (permissionsExist.length !== permissionIds.length) {
      return reply.status(400).send({
        message: "One or more provided permission IDs are invalid or do not belong to this tenant.",
      });
    }

    await db.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
      skipDuplicates: true,
    });
    reply.send({ message: "Permissions assigned to role successfully." });
  } catch (error) {
    req.log.error("Error assigning permissions to role:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};

export const revokePermissionFromRole = async (
  req: FastifyRequest<{ Params: RolePermissionParams }>,
  reply: FastifyReply,
) => {
  try {
    const { roleId, permissionId } = req.params;
    const tenantId = req.tenantId as string;

    const rolePermissionAssociation = await db.rolePermission.findFirst({
      where: { roleId, permissionId, role: { tenantId }, permission: { tenantId } },
    });
    if (!rolePermissionAssociation) {
      return reply.status(404).send({
        message: "Role-permission association not found or does not belong to this tenant context.",
      });
    }

    const deleted = await db.rolePermission.deleteMany({ where: { roleId, permissionId } });
    if (deleted.count === 0) {
      return reply.status(404).send({ message: "Role-permission association not found." });
    }
    reply.status(204).send();
  } catch (error) {
    req.log.error("Error revoking permission from role:", error);
    reply.status(500).send({ message: "Internal Server Error." });
  }
};
