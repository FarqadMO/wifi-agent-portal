import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createRole(dto: CreateRoleDto) {
    // Check if role name already exists
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Role with name '${dto.name}' already exists`);
    }

    // Create role with permissions
    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        rolePermissions: dto.permissionIds
          ? {
              create: dto.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    this.logger.log(`Role created: ${role.name}`);

    return {
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
    };
  }

  async getAllRoles() {
    const roles = await this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return roles.map((role) => ({
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
      userCount: role._count.userRoles,
    }));
  }

  async getRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }

    return {
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
      userCount: role._count.userRoles,
    };
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    // Check if role exists
    const existing = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }

    // Check if name is being changed and already exists
    if (dto.name && dto.name !== existing.name) {
      const nameExists = await this.prisma.role.findUnique({
        where: { name: dto.name },
      });

      if (nameExists) {
        throw new ConflictException(`Role with name '${dto.name}' already exists`);
      }
    }

    // Update role and permissions
    const role = await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        rolePermissions: dto.permissionIds
          ? {
              deleteMany: {},
              create: dto.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    this.logger.log(`Role updated: ${role.name}`);

    return {
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
    };
  }

  async deleteRole(id: string) {
    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }

    // Check if role has users
    if (role._count.userRoles > 0) {
      throw new ConflictException(
        `Cannot delete role '${role.name}'. It is assigned to ${role._count.userRoles} user(s)`,
      );
    }

    await this.prisma.role.delete({
      where: { id },
    });

    this.logger.log(`Role deleted: ${role.name}`);

    return { message: 'Role deleted successfully' };
  }
}
