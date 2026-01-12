import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditFilterDto } from '../../audit/dto/audit-filter.dto';

export interface AuditLogData {
  userId?: string;
  agentId?: string;
  agentUsername?: string;
  sasSystemId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

/**
 * AuditService
 * 
 * Centralized service for creating audit logs
 * Tracks all important system events and changes
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log entry
   * @param data - Audit log data
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          agentId: data.agentId,
          agentUsername: data.agentUsername,
          sasSystemId: data.sasSystemId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          oldValue: data.oldValue,
          newValue: data.newValue,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          correlationId: data.correlationId,
        },
      });

      this.logger.log(
        `Audit: ${data.action} - Entity: ${data.entity} - User: ${data.userId || data.agentUsername}`,
      );
    } catch (error) {
      // Don't throw errors from audit logging to prevent breaking the main flow
      this.logger.error('Failed to create audit log', error);
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(
    action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'REFRESH_TOKEN',
    userId: string | null,
    agentId: string | null,
    ipAddress: string,
    userAgent: string,
    correlationId?: string,
  ): Promise<void> {
    await this.log({
      userId: userId || undefined,
      agentId: agentId || undefined,
      action,
      entity: userId ? 'User' : 'Agent',
      ipAddress,
      userAgent,
      correlationId,
    });
  }

  /**
   * Log entity changes (create, update, delete)
   */
  async logEntityChange(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: string,
    entityId: string,
    userId: string | null,
    agentId: string | null,
    oldValue?: any,
    newValue?: any,
    ipAddress?: string,
    userAgent?: string,
    correlationId?: string,
  ): Promise<void> {
    await this.log({
      userId: userId || undefined,
      agentId: agentId || undefined,
      action: `${entity.toUpperCase()}_${action}`,
      entity,
      entityId,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
      correlationId,
    });
  }

  /**
   * Log security events
   */
  async logSecurity(
    action: string,
    userId: string | null,
    agentId: string | null,
    details: any,
    ipAddress: string,
    userAgent: string,
    correlationId?: string,
  ): Promise<void> {
    await this.log({
      userId: userId || undefined,
      agentId: agentId || undefined,
      action,
      entity: 'Security',
      newValue: details,
      ipAddress,
      userAgent,
      correlationId,
    });
  }

  /**
   * Query audit logs with filtering and pagination
   */
  async getAuditLogs(filterDto: AuditFilterDto) {
    const { page = 1, limit = 20, action, entity, userId, agentId, startDate, endDate } = filterDto;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    if (entity) {
      where.entity = { contains: entity, mode: 'insensitive' };
    }

    if (userId) {
      where.userId = userId;
    }

    if (agentId) {
      where.agentId = agentId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Execute query with pagination
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          agent: {
            select: {
              username: true,
              sasSystemId: true,
            },
          },
          user: {
            select: {
              username: true,
              email: true,
            },
          },
          sasSystem: {
            select: {
              id: true,
              name: true,
              baseUrl: true,
              sslEnabled: true,
              group: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      logs,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
