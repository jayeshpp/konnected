import { z } from "zod";

/** -----------------------------
 *  Authenticated User
 * ----------------------------- */
export const AuthenticatedUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  roles: z.array(z.string()),
  tenantId: z.string(),
  tenantSlug: z.string().optional(),
});

export type AuthenticatedUser = z.infer<typeof AuthenticatedUserSchema>;

/** -----------------------------
 *  Login Request Body
 * ----------------------------- */
export const LoginRequestBodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginRequestBody = z.infer<typeof LoginRequestBodySchema>;

/** -----------------------------
 *  Refresh Token Request Body
 * ----------------------------- */
export const RefreshTokenRequestBodySchema = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenRequestBody = z.infer<typeof RefreshTokenRequestBodySchema>;

/** -----------------------------
 *  Invite User Request Body
 * ----------------------------- */
export const InviteUserRequestBodySchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
});

export type InviteUserRequestBody = z.infer<typeof InviteUserRequestBodySchema>;

export const bulkInviteSchema = z.object({
  users: z.array(InviteUserRequestBodySchema).min(1, "At least one invite is required"),
});

export type InviteBulkUserRequestBody = z.infer<typeof bulkInviteSchema>;

/** -----------------------------
 *  Assign Roles Request Body
 * ----------------------------- */
export const AssignRolesRequestBodySchema = z.object({
  roleIds: z.array(z.string()).min(1),
});

export type AssignRolesRequestBody = z.infer<typeof AssignRolesRequestBodySchema>;

/** -----------------------------
 *  User Update Request Body
 * ----------------------------- */
export const UserUpdateRequestBodySchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
});

export type UserUpdateRequestBody = z.infer<typeof UserUpdateRequestBodySchema>;

/** -----------------------------
 *  Create Role Request Body
 * ----------------------------- */
export const CreateRoleRequestBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export type CreateRoleRequestBody = z.infer<typeof CreateRoleRequestBodySchema>;

/** -----------------------------
 *  Update Role Request Body
 * ----------------------------- */
export const UpdateRoleRequestBodySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export type UpdateRoleRequestBody = z.infer<typeof UpdateRoleRequestBodySchema>;

/** -----------------------------
 *  Assign Permissions Request Body
 * ----------------------------- */
export const AssignPermissionsRequestBodySchema = z.object({
  permissionIds: z.array(z.string()).min(1),
});

export type AssignPermissionsRequestBody = z.infer<typeof AssignPermissionsRequestBodySchema>;

/** -----------------------------
 *  Create Permission Request Body
 * ----------------------------- */
export const CreatePermissionRequestBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export type CreatePermissionRequestBody = z.infer<typeof CreatePermissionRequestBodySchema>;

export const bulkInviteUsersSchema = z.object({
  users: z.array(InviteUserRequestBodySchema).min(1, "At least one invite is required"),
});

export type BulkInviteUsers = z.infer<typeof bulkInviteUsersSchema>;

export const userSchemas = {
  AuthenticatedUserSchema,
  LoginRequestBodySchema,
  RefreshTokenRequestBodySchema,
  InviteUserRequestBodySchema,
  AssignRolesRequestBodySchema,
  UserUpdateRequestBodySchema,
  CreateRoleRequestBodySchema,
  UpdateRoleRequestBodySchema,
  AssignPermissionsRequestBodySchema,
  CreatePermissionRequestBodySchema,
};
