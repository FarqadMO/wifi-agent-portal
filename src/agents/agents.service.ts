import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { SasClientService } from '../sas/sas-client.service';
import { AuditService } from '../common/audit/audit.service';
import { SasTokenService } from '../common/sas-token/sas-token.service';
import { PaymentService } from '../payment/payment.service';
import { PaymentStatus, ServiceType, PaymentMethod } from '../payment/enums/payment.enum';
import { AgentInfoResponseDto } from './dto/agent-info.dto';
import { TopUpDto } from './dto/top-up.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly sasClientService: SasClientService,
    private readonly auditService: AuditService,
    private readonly sasTokenService: SasTokenService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Get current agent information from SAS including balance
   */
  async getAgentInfo(
    agentUsername: string,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ): Promise<AgentInfoResponseDto> {
    // Find the agent
    const agent = await this.prisma.agent.findFirst({
      where: {
        username: agentUsername,
        deletedAt: null,
        isActive: true,
      },
      include: {
        sasSystem: true,
      },
    });

    if (!agent) {
      this.logger.warn(`Agent not found: ${agentUsername}`);
      throw new NotFoundException('Agent not found');
    }

    if (!agent.sasSystem) {
      this.logger.error(`Agent ${agentUsername} has no associated SAS system`);
      throw new NotFoundException('SAS system not configured for agent');
    }

    try {
      // Prepare SAS configuration
      const sasConfig = {
        id: agent.sasSystem.id,
        baseUrl: agent.sasSystem.baseUrl,
        sslEnabled: agent.sasSystem.sslEnabled,
      };

      // Get valid SAS token (cached or refreshed)
      const authToken = await this.sasTokenService.getSasToken(agent);

      // Fetch user info from SAS
      const userInfo = await this.sasClientService.getUserInfo(sasConfig, authToken);

      this.logger.log(
        `Successfully fetched info for agent: ${agentUsername} (Balance: ${userInfo.client?.balance})`,
      );

      // Audit log
      await this.auditService.log({
        action: 'AGENT_INFO_VIEWED',
        entity: 'agents',
        agentId: agent.id,
        oldValue: null,
        newValue: JSON.stringify({ balance: userInfo.client?.balance }),
        ipAddress,
        userAgent,
        correlationId,
      });

      return userInfo;
    } catch (error) {
      this.logger.error(
        `Failed to fetch agent info for ${agentUsername}: ${error.message}`,
      );

      // Audit log failure
      await this.auditService.log({
        action: 'AGENT_INFO_VIEW_FAILED',
        entity: 'agents',
        agentId: agent.id,
        oldValue: null,
        newValue: error.message,
        ipAddress,
        userAgent,
        correlationId,
      });

      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }

      throw new UnauthorizedException('Failed to fetch agent info from SAS system');
    }
  }

  /**
   * Top up agent wallet balance
   * Step 1: Process payment (placeholder)
   * Step 2: Top up balance in SAS using admin credentials
   */
  async topUpWallet(
    agentUsername: string,
    dto: TopUpDto,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ) {
    // Find the agent
    const agent = await this.prisma.agent.findFirst({
      where: {
        username: agentUsername,
        deletedAt: null,
        isActive: true,
      },
      include: {
        sasSystem: true,
      },
    });

    if (!agent) {
      this.logger.warn(`Agent not found: ${agentUsername}`);
      throw new NotFoundException('Agent not found');
    }

    if (!agent.sasSystem) {
      this.logger.error(`Agent ${agentUsername} has no associated SAS system`);
      throw new NotFoundException('SAS system not configured for agent');
    }

    // Generate transaction ID
    const transactionId = uuidv4();

    try {
      // ========================================
      // STEP 1: Create Payment
      // ========================================
      this.logger.log(
        `Creating payment for agent ${agentUsername}: ${dto.amount} via ${dto.paymentMethod}`,
      );

      const paymentResponse = await this.paymentService.createPayment(
        agent.id,
        agentUsername,
        {
          amount: dto.amount,
          serviceType: ServiceType.AGENT_TOP_UP,
          paymentMethod: dto.paymentMethod || PaymentMethod.QI_CARD, // Pass selected payment method, default to QI_CARD
          metadata: {
            agentUsername,
            transactionId,
            sasSystemId: agent.sasSystem.id,
          },
        },
        ipAddress,
        userAgent,
      );

      this.logger.log(
        `Payment created successfully. Payment ID: ${paymentResponse.id}, Gateway URL: ${paymentResponse.gatewayUrl}`,
      );

      // Return payment details to frontend so user can complete payment
      // The actual SAS top-up will happen via webhook when payment is confirmed
      return {
        transactionId,
        paymentId: paymentResponse.id,
        amount: dto.amount,
        paymentMethod: paymentResponse.paymentMethod,
        paymentStatus: paymentResponse.status,
        gatewayUrl: paymentResponse.gatewayUrl,
        message: 'يرجى إكمال عملية الدفع | Please complete the payment process',
      };
    } catch (error) {
      this.logger.error(
        `Failed to create payment for ${agentUsername}: ${error.message}`,
      );

      // Audit log failure
      await this.auditService.log({
        action: 'AGENT_PAYMENT_CREATION_FAILED',
        entity: 'agents',
        entityId: agent.id,
        agentId: agent.id,
        oldValue: null,
        newValue: JSON.stringify({
          amount: dto.amount,
          error: error.message,
        }),
        ipAddress,
        userAgent,
        correlationId,
      });

      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }

      throw new UnauthorizedException('Failed to create payment. Please try again later.');
    }
  }

  /**
   * Complete agent wallet top-up after successful payment
   * This method should be called from payment webhook
   */
  async completeTopUp(
    paymentId: string,
    agentId: string,
    amount: number,
    transactionId: string,
  ) {
    const agent = await this.prisma.agent.findFirst({
      where: {
        id: agentId,
        deletedAt: null,
        isActive: true,
      },
      include: {
        sasSystem: true,
      },
    });

    if (!agent || !agent.sasSystem) {
      this.logger.error(`Agent or SAS system not found for payment completion: ${paymentId}`);
      throw new NotFoundException('Agent or SAS system not found');
    }

    try {
      // ========================================
      // STEP 2: Top up balance in SAS
      // ========================================
      
      // Prepare SAS configuration
      const sasConfig = {
        id: agent.sasSystem.id,
        baseUrl: agent.sasSystem.baseUrl,
        sslEnabled: agent.sasSystem.sslEnabled,
      };

      // Get current agent balance using cached token
      const agentToken = await this.sasTokenService.getSasToken(agent);
      const currentInfo = await this.sasClientService.getUserInfo(sasConfig, agentToken);
      const currentBalance = currentInfo.client?.balance || 0;
      
      // Use cached sasManagerId if available, otherwise get from SAS
      let agentSasId = agent.sasManagerId || currentInfo.client?.id;

      if (!agentSasId) {
        this.logger.error(`Failed to get agent SAS ID for agent ID: ${agentId}`);
        throw new Error('Failed to retrieve agent ID from SAS');
      }

      // Update agent with sasManagerId if it wasn't cached
      if (!agent.sasManagerId && agentSasId) {
        await this.prisma.agent.update({
          where: { id: agent.id },
          data: { sasManagerId: agentSasId },
        });
        this.logger.log(`Cached sasManagerId for agent ${agent.username}: ${agentSasId}`);
      }

      // Decrypt SAS admin credentials
      const adminUsername = agent.sasSystem.adminUsername;
      const adminPassword = this.encryptionService.decrypt(
        agent.sasSystem.adminEncryptedPassword,
      );

      // Login to SAS with admin credentials
      const adminToken = await this.sasClientService.login(sasConfig, {
        username: adminUsername,
        password: adminPassword,
      });

      // Top up agent balance using deposit endpoint with admin token
      const topUpResult = await this.sasClientService.topUpAgentBalance(
        sasConfig,
        adminToken,
        agentSasId,
        agent.username,
        amount,
        transactionId,
        currentBalance,
      );

      this.logger.log(
        `Successfully topped up ${amount} for agent ${agent.username}. Transaction: ${transactionId}`,
      );

      // Fetch updated balance using cached token (it will auto-refresh if needed)
      const updatedToken = await this.sasTokenService.getSasToken(agent);
      const updatedInfo = await this.sasClientService.getUserInfo(sasConfig, updatedToken);

      // Audit log
      await this.auditService.log({
        action: 'AGENT_WALLET_TOPUP_COMPLETED',
        entity: 'agents',
        entityId: agent.id,
        agentId: agent.id,
        oldValue: null,
        newValue: JSON.stringify({
          amount,
          transactionId,
          paymentId,
          previousBalance: currentBalance,
          newBalance: updatedInfo.client?.balance,
        }),
        ipAddress: 'system',
        userAgent: 'payment-webhook',
        correlationId: transactionId,
      });

      return {
        success: true,
        transactionId,
        amount,
        previousBalance: currentBalance,
        newBalance: updatedInfo.client?.balance || 0,
        topUpResult,
      };
    } catch (error) {
      this.logger.error(
        `Failed to complete SAS top-up for agent ${agentId}: ${error.message}`,
      );

      // Audit log failure
      await this.auditService.log({
        action: 'AGENT_WALLET_TOPUP_FAILED',
        entity: 'agents',
        entityId: agent.id,
        agentId: agent.id,
        oldValue: null,
        newValue: JSON.stringify({
          amount,
          paymentId,
          error: error.message,
        }),
        ipAddress: 'system',
        userAgent: 'payment-webhook',
        correlationId: transactionId,
      });

      throw error;
    }
  }
}
