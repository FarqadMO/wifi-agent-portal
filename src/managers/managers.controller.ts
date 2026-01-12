import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ManagersService } from './managers.service';
import { ManagerTreeResponseDto } from './dto/manager-tree.dto';
import { DepositDto } from './dto/deposit.dto';
import { AgentUsername } from '../common/decorators/user.decorator';
import { IpAddress, UserAgent, CorrelationId } from '../common/decorators/request.decorator';
import { AllowUserTypes } from '../common/decorators/auth.decorator';

@ApiTags('Managers')
@ApiBearerAuth('bearer')
@Controller('managers')
export class ManagersController {
  constructor(private readonly managersService: ManagersService) {}

  @Get('tree')
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'Get manager tree hierarchy',
    description:
      'Fetches the manager tree hierarchy from SAS Radius for the authenticated agent. ' +
      'Returns a hierarchical structure of managers with their parent-child relationships. ' +
      'This endpoint is only accessible by agents (not system users).',
  })
  @ApiResponse({
    status: 200,
    description: 'Manager tree hierarchy fetched successfully',
    type: ManagerTreeResponseDto,
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          managers: [
            { id: 209, username: 'Asda@s', parent_id: 31 },
            { id: 222, username: 'Ali.Kom', parent_id: 110 },
            { id: 210, username: 'AhmedLad', parent_id: 1 },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        message: 'Unauthorized access',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only agents can access this endpoint',
    schema: {
      example: {
        success: false,
        statusCode: 403,
        message: 'This endpoint is only accessible by agents',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Agent or SAS system not found',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        message: 'Agent not found',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to fetch data from SAS',
    schema: {
      example: {
        success: false,
        statusCode: 500,
        message: 'Failed to fetch manager tree from SAS system',
      },
    },
  })
  async getManagerTree(
    @AgentUsername() agentUsername: string,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    const managers = await this.managersService.getManagerTree(
      agentUsername,
      ipAddress,
      userAgent,
      correlationId,
    );

    return { managers };
  }

  @Get(':id')
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'Get manager details by ID',
    description:
      'Fetches manager information from SAS Radius including balance and configuration. ' +
      'Used before making a deposit to show target manager details. ' +
      'This endpoint is only accessible by agents.',
  })
  @ApiResponse({
    status: 200,
    description: 'Manager details retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          status: 200,
          data: {
            id: 224,
            username: 'E.PAY',
            enabled: 1,
            firstname: 'Ahmed',
            lastname: 'Ali',
            balance: 15000,
            parent_id: 1,
            created_at: '2024-12-05 14:14:12',
          },
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Agent only' })
  @ApiResponse({ status: 404, description: 'Manager not found' })
  async getManagerById(
    @Param('id', ParseIntPipe) id: number,
    @AgentUsername() agentUsername: string,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.managersService.getManagerById(
      agentUsername,
      id,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Post('deposit')
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'Deposit money to a manager',
    description:
      'Transfers money from the authenticated agent\'s balance to the target manager. ' +
      'Validates sufficient balance before processing. Generates a unique transaction ID ' +
      'for tracking. This endpoint is only accessible by agents.',
  })
  @ApiResponse({
    status: 200,
    description: 'Deposit completed successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          status: 200,
          message: 'Deposit successful',
          transaction_id: '3065926f-e578-817a-e22c-1640e3f7f88f',
          new_balance: 14000,
          target_balance: 16000,
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Insufficient balance or validation failed',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'Insufficient balance. Available: 500, Required: 1000',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Agent only' })
  @ApiResponse({ status: 404, description: 'Target manager not found' })
  async depositToManager(
    @Body() depositDto: DepositDto,
    @AgentUsername() agentUsername: string,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.managersService.depositToManager(
      agentUsername,
      depositDto,
      ipAddress,
      userAgent,
      correlationId,
    );
  }
}
