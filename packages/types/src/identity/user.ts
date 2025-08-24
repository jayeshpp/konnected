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
 *  Register Request Body
 * ----------------------------- */
export const RegisterRequestBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export type RegisterRequestBody = z.infer<typeof RegisterRequestBodySchema>;

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
 *  Register Organization Request Body
 * ----------------------------- */
export const RegisterOrganizationRequestBodySchema = z.object({
  organizationName: z.string(),
  organizationSlug: z.string().optional(),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  adminName: z.string().optional(),
});

export type RegisterOrganizationRequestBody = z.infer<typeof RegisterOrganizationRequestBodySchema>;

/** -----------------------------
 *  Invite User Request Body
 * ----------------------------- */
export const InviteUserRequestBodySchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
});

export type InviteUserRequestBody = z.infer<typeof InviteUserRequestBodySchema>;

/** -----------------------------
 *  Assign Roles Request Body
 * ----------------------------- */
export const AssignRolesRequestBodySchema = z.object({
  roleIds: z.array(z.string()).min(1),
});

export type AssignRolesRequestBody = z.infer<typeof AssignRolesRequestBodySchema>;

/** -----------------------------
 *  User ID Params
 * ----------------------------- */
export const UserIdParamsSchema = z.object({
  id: z.string(),
});

export type UserIdParams = z.infer<typeof UserIdParamsSchema>;

/** -----------------------------
 *  User Role Params
 * ----------------------------- */
export const UserRoleParamsSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
});

export type UserRoleParams = z.infer<typeof UserRoleParamsSchema>;

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
 *  Role ID Params
 * ----------------------------- */
export const RoleIdParamsSchema = z.object({
  id: z.string(),
});

export type RoleIdParams = z.infer<typeof RoleIdParamsSchema>;

/** -----------------------------
 *  Assign Permissions Request Body
 * ----------------------------- */
export const AssignPermissionsRequestBodySchema = z.object({
  permissionIds: z.array(z.string()).min(1),
});

export type AssignPermissionsRequestBody = z.infer<typeof AssignPermissionsRequestBodySchema>;

/** -----------------------------
 *  Role Permission Params
 * ----------------------------- */
export const RolePermissionParamsSchema = z.object({
  roleId: z.string(),
  permissionId: z.string(),
});

export type RolePermissionParams = z.infer<typeof RolePermissionParamsSchema>;

/** -----------------------------
 *  Create Permission Request Body
 * ----------------------------- */
export const CreatePermissionRequestBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export type CreatePermissionRequestBody = z.infer<typeof CreatePermissionRequestBodySchema>;

/** -----------------------------
 *  Permission ID Params
 * ----------------------------- */
export const PermissionIdParamsSchema = z.object({
  id: z.string(),
});

export type PermissionIdParams = z.infer<typeof PermissionIdParamsSchema>;

export const userSchemas = {
  AuthenticatedUserSchema,
  RegisterRequestBodySchema,
  LoginRequestBodySchema,
  RefreshTokenRequestBodySchema,
  RegisterOrganizationRequestBodySchema,
  InviteUserRequestBodySchema,
  AssignRolesRequestBodySchema,
  UserIdParamsSchema,
  UserRoleParamsSchema,
  UserUpdateRequestBodySchema,
  CreateRoleRequestBodySchema,
  UpdateRoleRequestBodySchema,
  RoleIdParamsSchema,
  AssignPermissionsRequestBodySchema,
  RolePermissionParamsSchema,
  CreatePermissionRequestBodySchema,
  PermissionIdParamsSchema,
};
