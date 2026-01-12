import { Injectable, Logger, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { SasClientService } from '../sas/sas-client.service';
import { AuditService } from '../common/audit/audit.service';
import { SasTokenService } from '../common/sas-token/sas-token.service';
import { ManagerNodeDto } from './dto/manager-tree.dto';
import { DepositDto } from './dto/deposit.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ManagersService {
  private readonly logger = new Logger(ManagersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly sasClientService: SasClientService,
    private readonly auditService: AuditService,
    private readonly sasTokenService: SasTokenService,
  ) {}

  /**
   * Get manager tree hierarchy for the authenticated agent
   * Fetches from SAS Radius API using agent's credentials
   */
  async getManagerTree(
    agentUsername: string,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ): Promise<ManagerNodeDto[]> {
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

      // Fetch manager tree from SAS
      const managerTreeData = await this.sasClientService.getManagerTree(
        sasConfig,
        authToken,
      );

      // Validate and transform response
      const managers: ManagerNodeDto[] = Array.isArray(managerTreeData)
        ? managerTreeData
        : managerTreeData.data || [];

      this.logger.log(
        `Successfully fetched manager tree for agent: ${agentUsername} (${managers.length} managers)`,
      );

      // Audit log
      await this.auditService.log({
        action: 'MANAGER_TREE_VIEWED',
        entity: 'managers',
        agentId: agent.id,
        oldValue: null,
        newValue: null,
        ipAddress,
        userAgent,
        correlationId,
      });

      return managers;
    } catch (error) {
      this.logger.error(
        `Failed to fetch manager tree for agent ${agentUsername}: ${error.message}`,
      );

      // Audit log failure
      await this.auditService.log({
        action: 'MANAGER_TREE_VIEW_FAILED',
        entity: 'managers',
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

      throw new UnauthorizedException(
        'Failed to fetch manager tree from SAS system',
      );
    }
  }

  /**
   * Get agent and authenticate to SAS
   */
  private async authenticateAgent(agentUsername: string) {
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
      throw new NotFoundException('Agent not found');
    }

    if (!agent.sasSystem) {
      throw new NotFoundException('SAS system not configured for agent');
    }

    const sasConfig = {
      id: agent.sasSystem.id,
      baseUrl: agent.sasSystem.baseUrl,
      sslEnabled: agent.sasSystem.sslEnabled,
    };

    // Get valid SAS token (cached or refreshed)
    const authToken = await this.sasTokenService.getSasToken(agent);

    return { agent, sasConfig, authToken };
  }

  /**
   * Get manager details by ID (for deposit form)
   */
  async getManagerById(
    agentUsername: string,
    managerId: number,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ) {
    try {
      const { agent, sasConfig, authToken } = await this.authenticateAgent(agentUsername);

      const result = await this.sasClientService.getManagerById(
        sasConfig,
        authToken,
        managerId,
      );

      this.logger.log(
        `Manager details fetched by agent ${agentUsername}: managerId ${managerId}`,
      );

      await this.auditService.log({
        action: 'MANAGER_DETAILS_VIEWED',
        entity: 'managers',
        entityId: managerId.toString(),
        agentId: agent.id,
        oldValue: null,
        newValue: null,
        ipAddress,
        userAgent,
        correlationId,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch manager details: ${error.message}`);
      throw new UnauthorizedException('Failed to fetch manager from SAS system');
    }
  }

  /**
   * Deposit money to a manager
   */
  async depositToManager(
    agentUsername: string,
    dto: DepositDto,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ) {
    try {
      const { agent, sasConfig, authToken } = await this.authenticateAgent(agentUsername);

      // Get current agent info to get balance
      const agentInfo = await this.sasClientService.getUserInfo(sasConfig, authToken);
      const myBalance = agentInfo.client?.balance || 0;

      // Validate sufficient balance
      if (myBalance < dto.amount) {
        throw new BadRequestException(
          `Insufficient balance. Available: ${myBalance}, Required: ${dto.amount}`,
        );
      }

      // Get target manager details
      const managerInfo = await this.sasClientService.getManagerById(
        sasConfig,
        authToken,
        dto.manager_id,
      );

      if (!managerInfo.data) {
        throw new NotFoundException('Target manager not found');
      }

      const targetManagerUsername = managerInfo.data.username;
      const targetManagerBalance = managerInfo.data.balance;

      // Generate transaction ID
      const transactionId = uuidv4();

      // Prepare deposit payload
      const depositPayload = {
        manager_id: dto.manager_id,
        my_balance: myBalance,
        manager_username: targetManagerUsername,
        amount: dto.amount,
        comment: dto.comment || '',
        transaction_id: transactionId,
        is_loan: dto.is_loan,
        balance: targetManagerBalance,
      };

      // Execute deposit
      const result = await this.sasClientService.depositToManager(
        sasConfig,
        authToken,
        depositPayload,
      );

      this.logger.log(
        `Deposit successful: ${agentUsername} -> ${targetManagerUsername} (${dto.amount})`,
      );

      await this.auditService.log({
        action: 'DEPOSIT_COMPLETED',
        entity: 'managers',
        entityId: dto.manager_id.toString(),
        agentId: agent.id,
        oldValue: JSON.stringify({ balance: myBalance }),
        newValue: JSON.stringify({
          amount: dto.amount,
          targetManager: targetManagerUsername,
          transactionId,
        }),
        ipAddress,
        userAgent,
        correlationId,
      });

      return {
        ...result,
        transaction_id: transactionId,
        new_balance: myBalance - dto.amount,
        target_balance: targetManagerBalance + dto.amount,
      };
    } catch (error) {
      this.logger.error(`Failed to deposit money: ${error.message}`);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new UnauthorizedException('Failed to process deposit in SAS system');
    }
  }
}
