import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPermission(dto: CreatePermissionDto) {
    // Check if permission name already exists
    const existing = await this.prisma.permission.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Permission with name '${dto.name}' already exists`);
    }

    const permission = await this.prisma.permission.create({
      data: {
        name: dto.name,
        module: dto.module,
        description: dto.description,
      },
    });

    this.logger.log(`Permission created: ${permission.name}`);

    return permission;
  }

  async getAllPermissions() {
    const permissions = await this.prisma.permission.findMany({
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return permissions.map((permission) => ({
      ...permission,
      roleCount: permission._count.rolePermissions,
    }));
  }

  async getPermissionById(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID '${id}' not found`);
    }

    return {
      ...permission,
      roleCount: permission._count.rolePermissions,
    };
  }

  async updatePermission(id: string, dto: UpdatePermissionDto) {
    // Check if permission exists
    const existing = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Permission with ID '${id}' not found`);
    }

    // Check if name is being changed and already exists
    if (dto.name && dto.name !== existing.name) {
      const nameExists = await this.prisma.permission.findUnique({
        where: { name: dto.name },
      });

      if (nameExists) {
        throw new ConflictException(`Permission with name '${dto.name}' already exists`);
      }
    }

    const permission = await this.prisma.permission.update({
      where: { id },
      data: {
        name: dto.name,
        module: dto.module,
        description: dto.description,
      },
    });

    this.logger.log(`Permission updated: ${permission.name}`);

    return permission;
  }

  async deletePermission(id: string) {
    // Check if permission exists
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID '${id}' not found`);
    }

    // Check if permission is assigned to roles
    if (permission._count.rolePermissions > 0) {
      throw new ConflictException(
        `Cannot delete permission '${permission.name}'. It is assigned to ${permission._count.rolePermissions} role(s)`,
      );
    }

    await this.prisma.permission.delete({
      where: { id },
    });

    this.logger.log(`Permission deleted: ${permission.name}`);

    return { message: 'Permission deleted successfully' };
  }
}
