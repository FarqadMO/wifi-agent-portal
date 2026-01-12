import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for a route
 * @param permissions - Array of permission names (e.g., 'sas.create', 'users.manage')
 */
export const Permissions = (...permissions: string[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Decorator to mark routes that are public (no authentication required)
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Decorator to specify user types allowed to access a route
 * @param types - Array of user types ('system', 'agent', or both)
 */
export const USER_TYPES_KEY = 'userTypes';
export const AllowUserTypes = (...types: ('system' | 'agent')[]) => 
  SetMetadata(USER_TYPES_KEY, types);
