import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permissions } from '../common/decorators/auth.decorator';

@ApiTags('Permissions')
@ApiBearerAuth('bearer')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Permissions('permissions.create')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({
    status: 201,
    description: 'Permission created successfully',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'users.delete',
          description: 'Delete users',
          createdAt: '2026-01-08T12:00:00Z',
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing permissions.create permission' })
  @ApiResponse({ status: 409, description: 'Permission name already exists' })
  async createPermission(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.createPermission(dto);
  }

  @Get()
  @Permissions('permissions.view')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'users.view',
            description: 'View users',
            roleCount: 3,
            createdAt: '2026-01-08T12:00:00Z',
          },
        ],
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing permissions.view permission' })
  async getAllPermissions() {
    return this.permissionsService.getAllPermissions();
  }

  @Get(':id')
  @Permissions('permissions.view')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiParam({ name: 'id', description: 'Permission ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Permission retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'users.view',
          description: 'View users',
          roleCount: 3,
          createdAt: '2026-01-08T12:00:00Z',
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing permissions.view permission' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async getPermissionById(@Param('id') id: string) {
    return this.permissionsService.getPermissionById(id);
  }

  @Put(':id')
  @Permissions('permissions.update')
  @ApiOperation({ summary: 'Update permission' })
  @ApiParam({ name: 'id', description: 'Permission ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Permission updated successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'users.edit',
          description: 'Edit user details',
          updatedAt: '2026-01-08T12:00:00Z',
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing permissions.update permission' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @ApiResponse({ status: 409, description: 'Permission name already exists' })
  async updatePermission(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.permissionsService.updatePermission(id, dto);
  }

  @Delete(':id')
  @Permissions('permissions.delete')
  @ApiOperation({ summary: 'Delete permission' })
  @ApiParam({ name: 'id', description: 'Permission ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Permission deleted successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: { message: 'Permission deleted successfully' },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing permissions.delete permission' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @ApiResponse({ status: 409, description: 'Permission is assigned to roles' })
  async deletePermission(@Param('id') id: string) {
    return this.permissionsService.deletePermission(id);
  }
}
