import { Controller, Get, Post, Body, Param, NotFoundException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { PaymentService } from '../payment/payment.service';
import { AgentInfoResponseDto } from './dto/agent-info.dto';
import { TopUpDto, TopUpResponseDto } from './dto/top-up.dto';
import { AgentUsername } from '../common/decorators/user.decorator';
import { IpAddress, UserAgent, CorrelationId } from '../common/decorators/request.decorator';
import { AllowUserTypes } from '../common/decorators/auth.decorator';

@ApiTags('Agents')
@ApiBearerAuth('bearer')
@Controller('agents')
export class AgentsController {
  private readonly logger = new Logger(AgentsController.name);

  constructor(
    private readonly agentsService: AgentsService,
    private readonly paymentService: PaymentService,
  ) {}

  @Get('me')
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'Get current agent information',
    description:
      'Fetches the authenticated agent\'s information from SAS Radius including balance, ' +
      'permissions, features, and personal details. This endpoint is only accessible by agents.',
  })
  @ApiResponse({
    status: 200,
    description: 'Agent information retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          status: 200,
          client: {
            id: 229,
            balance: 15000,
            city: 'Baghdad',
            firstname: 'Ahmed',
            lastname: 'Ali',
            email: 'agent@example.com',
            force_change_password: 0,
            phone: '+9647XXXXXXXXX',
            reward_points: 100,
            username: 'farqad',
            requires_2fa: 0,
            country: 'Iraq',
            avatar_data: '',
          },
          permissions: ['prm_any', 'prm_users_index', 'prm_cards_index'],
          features: ['freezone'],
          license_status: '1',
          license_expiration: '2027-01-03 12:56:16',
          mu: '50',
        },
        timestamp: '2026-01-08T12:51:35.571Z',
        correlationId: '823623d7-4ae4-45ff-a649-20b2a8415c54',
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
        message: 'Failed to fetch agent info from SAS system',
      },
    },
  })
  async getMe(
    @AgentUsername() agentUsername: string,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.agentsService.getAgentInfo(
      agentUsername,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Post('top-up')
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'Initiate agent wallet top-up',
    description:
      'Creates a payment transaction for agent wallet top-up. ' +
      'Agent selects payment method (e.g., Qi Card) and initiates payment. ' +
      'Returns payment gateway URL for completing the payment. ' +
      'Actual wallet balance will be updated after successful payment confirmation via webhook.',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment initiated successfully - Complete payment using gateway URL',
    type: TopUpResponseDto,
    schema: {
      example: {
        success: true,
        statusCode: 201,
        data: {
          transactionId: '123e4567-e89b-12d3-a456-426614174000',
          paymentId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 10000,
          paymentMethod: 'qi_card',
          paymentStatus: 'pending',
          gatewayUrl: 'https://payment.gateway.com/pay/123abc',
          message: 'يرجى إكمال عملية الدفع | Please complete the payment process',
        },
        timestamp: '2026-01-12T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid amount',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        errors: ['amount must be a positive number'],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only agents can access this endpoint',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Agent or SAS system not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Payment or SAS communication failed',
    schema: {
      example: {
        success: false,
        statusCode: 500,
        message: 'Failed to process top-up. Please try again later.',
      },
    },
  })
  async topUpWallet(
    @Body() topUpDto: TopUpDto,
    @AgentUsername() agentUsername: string,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.agentsService.topUpWallet(
      agentUsername,
      topUpDto,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Get('payments/:paymentId/status')
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'Check payment status and wallet balance',
    description:
      'التحقق من حالة الدفع ورصيد المحفظة | ' +
      'Check the status of a payment transaction and returns current wallet balance if payment is completed. ' +
      'This endpoint is READ-ONLY and cannot trigger balance updates.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment status retrieved successfully | تم استرجاع حالة الدفع بنجاح',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          transactionId: 'pay_123abc',
          referenceId: '550e8400-e29b-41d4-a716-446655440001',
          amount: 10000,
          currency: 'USD',
          status: 'completed',
          paymentMethod: 'qi_card',
          serviceType: 'agent_top_up',
          gatewayUrl: 'https://payment.gateway.com/pay/123abc',
          createdAt: '2026-01-12T12:00:00.000Z',
          processedAt: '2026-01-12T12:05:00.000Z',
          newBalance: 15000,
          topUpCompleted: true,
        },
        timestamp: '2026-01-12T12:10:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found | الدفعة غير موجودة',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Payment does not belong to this agent | غير مصرح - الدفعة لا تخص هذا الوكيل',
  })
  async checkPaymentStatus(
    @Param('paymentId') paymentId: string,
    @AgentUsername() agentUsername: string,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    // Get agent ID from username
    const agent = await this.agentsService['prisma'].agent.findFirst({
      where: { username: agentUsername, deletedAt: null },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Get payment status from payment service
    const payment = await this.paymentService.checkPaymentStatus(paymentId, agent.id);

    // If payment is completed, fetch current wallet balance
    let newBalance: number | null = null;
    let topUpCompleted = false;
    
    if (payment.status === 'completed') {
      try {
        const agentInfo = await this.agentsService.getAgentInfo(
          agentUsername,
          ipAddress,
          userAgent,
          correlationId,
        );
        newBalance = agentInfo.client?.balance || 0;
        
        // Check if top-up was completed from payment metadata
        const paymentRecord = await this.paymentService['prisma'].paymentTransaction.findUnique({
          where: { id: paymentId },
        });
        topUpCompleted = (paymentRecord?.metadata as any)?.topUpCompleted || false;
      } catch (error) {
        this.logger.warn(`Could not fetch balance for completed payment: ${error.message}`);
      }
    }

    return {
      ...payment,
      newBalance,
      topUpCompleted,
    };
  }
}
