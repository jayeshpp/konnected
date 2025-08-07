/**
 * Interface for the decoded JWT payload.
 * This is what will be available on `request.user` after authentication.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  tenantId: string;
  tenantSlug?: string;
}

/**
 * Request body for user registration.
 */
export interface RegisterRequestBody {
  email: string;
  password: string;
  name?: string; // Optional, as per API design
}

/**
 * Request body for user login.
 */
export interface LoginRequestBody {
  email: string;
  password: string;
}

/**
 * Request body for token refresh.
 */
export interface RefreshTokenRequestBody {
  refreshToken: string;
}

/**
 * Request body for organization registration.
 */
export interface RegisterOrganizationRequestBody {
  organizationName: string;
  organizationSlug?: string;
  adminEmail: string;
  adminPassword: string;
  adminName?: string;
}

/**
 * Request body for inviting a user.
 */
export interface InviteUserRequestBody {
  email: string;
  name?: string;
  roleIds?: string[];
}

/**
 * Request body for assigning roles to a user.
 */
export interface AssignRolesRequestBody {
  roleIds: string[];
}

/**
 * Request parameters for user ID.
 */
export interface UserIdParams {
  id: string;
}

/**
 * Request parameters for user ID and role ID.
 */
export interface UserRoleParams {
  userId: string;
  roleId: string;
}

/**
 * Request body for updating a user by admin.
 */
export interface UserUpdateRequestBody {
  name?: string;
  email?: string;
  isActive?: boolean;
}

/**
 * Request body for creating a role.
 */
export interface CreateRoleRequestBody {
  name: string;
  description?: string;
}

/**
 * Request body for updating a role.
 */
export interface UpdateRoleRequestBody {
  name?: string;
  description?: string;
}

/**
 * Request parameters for role ID.
 */
export interface RoleIdParams {
  id: string;
}

/**
 * Request body for assigning permissions to a role.
 */
export interface AssignPermissionsRequestBody {
  permissionIds: string[];
}

/**
 * Request parameters for role ID and permission ID.
 */
export interface RolePermissionParams {
  roleId: string;
  permissionId: string;
}

/**
 * Request body for creating a permission.
 */
export interface CreatePermissionRequestBody {
  name: string;
  description?: string;
}

/**
 * Request parameters for permission ID.
 */
export interface PermissionIdParams {
  id: string;
}
