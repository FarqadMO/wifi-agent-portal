import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, USER_TYPES_KEY, IS_PUBLIC_KEY } from '../decorators/auth.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is public first
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug('Route is public, skipping permission check');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    this.logger.debug(`Checking access for route: ${request.url}`);
    this.logger.debug(`User object: ${JSON.stringify(user)}`);

    if (!user) {
      this.logger.warn('User not authenticated');
      throw new ForbiddenException('User not authenticated');
    }

    // Check allowed user types first
    const allowedUserTypes = this.reflector.getAllAndOverride<('system' | 'agent')[]>(
      USER_TYPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (allowedUserTypes && allowedUserTypes.length > 0) {
      this.logger.debug(`Allowed user types: ${JSON.stringify(allowedUserTypes)}`);
      
      if (!allowedUserTypes.includes(user.userType)) {
        this.logger.warn(
          `User type ${user.userType} not allowed. Required: ${allowedUserTypes.join(', ')}`,
        );
        throw new ForbiddenException(
          `This endpoint is only accessible by ${allowedUserTypes.join(' or ')}`,
        );
      }
    } else {
      // If no @AllowUserTypes decorator is specified, default to system users only
      // This prevents agents from accessing system-only endpoints (SAS, Roles, Permissions, etc.)
      if (user.userType === 'agent') {
        this.logger.warn(
          `Agent attempted to access system-only endpoint: ${request.url}`,
        );
        throw new ForbiddenException(
          'This endpoint is only accessible by system users',
        );
      }
    }

    // Check permissions (only for system users)
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      this.logger.debug('No permissions required, access granted');
      return true;
    }

    this.logger.debug(`Required permissions: ${JSON.stringify(requiredPermissions)}`);

    // Agents should not reach this point (blocked above), but double-check
    if (user.userType === 'agent') {
      this.logger.error('Agent reached permission check - this should not happen!');
      throw new ForbiddenException('Agents cannot access this endpoint');
    }

    // Check if system user has required permissions
    const userPermissions = user.permissions || [];
    this.logger.debug(`User permissions: ${JSON.stringify(userPermissions)}`);
    
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      this.logger.warn(`User lacks required permissions. Required: ${requiredPermissions.join(', ')}, Has: ${userPermissions.join(', ')}`);
      throw new ForbiddenException(
        `Missing required permission: ${requiredPermissions.join(', ')}`,
      );
    }

    this.logger.debug('Permission check passed');
    return true;
  }
}
