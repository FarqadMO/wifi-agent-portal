import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Permissions } from '../common/decorators/auth.decorator';

@ApiTags('Roles')
@ApiBearerAuth('bearer')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions('roles.create')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Manager',
          description: 'Manager role with limited access',
          permissions: [
            {
              id: '456e7890-e89b-12d3-a456-426614174000',
              name: 'users.view',
              description: 'View users',
            },
          ],
          createdAt: '2026-01-08T12:00:00Z',
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing roles.create permission' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  async createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Get()
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Admin',
            description: 'Full system access',
            permissions: [
              { id: '456e7890-e89b-12d3-a456-426614174000', name: 'users.view' },
            ],
            userCount: 5,
            createdAt: '2026-01-08T12:00:00Z',
          },
        ],
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing roles.view permission' })
  async getAllRoles() {
    return this.rolesService.getAllRoles();
  }

  @Get(':id')
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Manager',
          description: 'Manager role',
          permissions: [
            {
              id: '456e7890-e89b-12d3-a456-426614174000',
              name: 'users.view',
              description: 'View users',
            },
          ],
          userCount: 3,
          createdAt: '2026-01-08T12:00:00Z',
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing roles.view permission' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRoleById(@Param('id') id: string) {
    return this.rolesService.getRoleById(id);
  }

  @Put(':id')
  @Permissions('roles.update')
  @ApiOperation({ summary: 'Update role' })
  @ApiParam({ name: 'id', description: 'Role ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Senior Manager',
          description: 'Updated description',
          permissions: [
            { id: '456e7890-e89b-12d3-a456-426614174000', name: 'users.view' },
          ],
          updatedAt: '2026-01-08T12:00:00Z',
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing roles.update permission' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(id, dto);
  }

  @Delete(':id')
  @Permissions('roles.delete')
  @ApiOperation({ summary: 'Delete role' })
  @ApiParam({ name: 'id', description: 'Role ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Role deleted successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: { message: 'Role deleted successfully' },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing roles.delete permission' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 409, description: 'Role is assigned to users' })
  async deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }
}
