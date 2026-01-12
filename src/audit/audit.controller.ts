import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from '../common/audit/audit.service';
import { AuditFilterDto } from './dto/audit-filter.dto';
import { Permissions } from '../common/decorators/auth.decorator';

@ApiTags('Audit')
@ApiBearerAuth('bearer')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permissions('audit.view')
  @ApiOperation({
    summary: 'Get audit logs',
    description: 'Retrieve audit logs with filtering and pagination. Requires audit.view permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          logs: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              action: 'USER_CREATED',
              entity: 'sas_users',
              entityId: '12345',
              userId: 'admin',
              agentId: null,
              oldValue: null,
              newValue: { username: 'newuser', status: 'active' },
              ipAddress: '192.168.1.1',
              userAgent: 'Mozilla/5.0...',
              correlationId: '550e8400-e29b-41d4-a716-446655440000',
              createdAt: '2026-01-08T12:00:00Z',
            },
          ],
          total: 250,
          page: 1,
          limit: 20,
          totalPages: 13,
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing audit.view permission' })
  async getAuditLogs(@Query() filterDto: AuditFilterDto) {
    return this.auditService.getAuditLogs(filterDto);
  }
}
