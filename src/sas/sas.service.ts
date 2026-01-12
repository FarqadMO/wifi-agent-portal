import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { AuditService } from '../common/audit/audit.service';
import { CreateSasSystemDto, UpdateSasSystemDto } from './dto/sas-system.dto';

@Injectable()
export class SasService {
  private readonly logger = new Logger(SasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a new SAS system
   */
  async create(dto: CreateSasSystemDto, userId: string, ipAddress: string, userAgent: string, correlationId: string) {
    // Encrypt admin password
    const encryptedPassword = this.encryptionService.encrypt(dto.adminPassword);

    const sasSystem = await this.prisma.sasSystem.create({
      data: {
        name: dto.name,
        baseUrl: dto.baseUrl,
        adminUsername: dto.adminUsername,
        adminEncryptedPassword: encryptedPassword,
        sslEnabled: dto.sslEnabled ?? true,
        group: dto.group,
        createdBy: userId,
      },
    });

    // Audit log
    await this.auditService.logEntityChange(
      'CREATE',
      'SasSystem',
      sasSystem.id,
      userId,
      null,
      null,
      { name: sasSystem.name, baseUrl: sasSystem.baseUrl },
      ipAddress,
      userAgent,
      correlationId,
    );

    this.logger.log(`SAS System created: ${sasSystem.name} (${sasSystem.id})`);

    return this.sanitizeSasSystem(sasSystem);
  }

  /**
   * Get all SAS systems
   */
  async findAll() {
    const systems = await this.prisma.sasSystem.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return systems.map((s) => this.sanitizeSasSystem(s));
  }

  /**
   * Get SAS system by ID
   */
  async findOne(id: string) {
    const sasSystem = await this.prisma.sasSystem.findUnique({
      where: { id, deletedAt: null },
    });

    if (!sasSystem) {
      throw new NotFoundException(`SAS System with ID ${id} not found`);
    }

    return this.sanitizeSasSystem(sasSystem);
  }

  /**
   * Get SAS system with decrypted password (for internal use only)
   */
  async findOneWithCredentials(id: string) {
    const sasSystem = await this.prisma.sasSystem.findUnique({
      where: { id, deletedAt: null },
    });

    if (!sasSystem) {
      throw new NotFoundException(`SAS System with ID ${id} not found`);
    }

    return {
      ...sasSystem,
      adminPassword: this.encryptionService.decrypt(sasSystem.adminEncryptedPassword),
    };
  }

  /**
   * Update SAS system
   */
  async update(
    id: string,
    dto: UpdateSasSystemDto,
    userId: string,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ) {
    const existing = await this.findOne(id);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.baseUrl) updateData.baseUrl = dto.baseUrl;
    if (dto.adminUsername) updateData.adminUsername = dto.adminUsername;
    if (dto.adminPassword) {
      updateData.adminEncryptedPassword = this.encryptionService.encrypt(dto.adminPassword);
    }
    if (dto.sslEnabled !== undefined) updateData.sslEnabled = dto.sslEnabled;
    if (dto.group) updateData.group = dto.group;

    const updated = await this.prisma.sasSystem.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await this.auditService.logEntityChange(
      'UPDATE',
      'SasSystem',
      id,
      userId,
      null,
      existing,
      this.sanitizeSasSystem(updated),
      ipAddress,
      userAgent,
      correlationId,
    );

    this.logger.log(`SAS System updated: ${updated.name} (${id})`);

    return this.sanitizeSasSystem(updated);
  }

  /**
   * Delete SAS system (soft delete)
   */
  async remove(id: string, userId: string, ipAddress: string, userAgent: string, correlationId: string) {
    const existing = await this.findOne(id);

    await this.prisma.sasSystem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Audit log
    await this.auditService.logEntityChange(
      'DELETE',
      'SasSystem',
      id,
      userId,
      null,
      existing,
      null,
      ipAddress,
      userAgent,
      correlationId,
    );

    this.logger.log(`SAS System deleted: ${existing.name} (${id})`);

    return { message: 'SAS System deleted successfully' };
  }

  /**
   * Remove encrypted password from response
   */
  private sanitizeSasSystem(sasSystem: any) {
    const { adminEncryptedPassword, ...sanitized } = sasSystem;
    return sanitized;
  }
}
