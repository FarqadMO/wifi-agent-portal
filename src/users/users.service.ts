import { Injectable, Logger, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { SasClientService } from '../sas/sas-client.service';
import { AuditService } from '../common/audit/audit.service';
import { SasTokenService } from '../common/sas-token/sas-token.service';
import { ListUsersDto } from './dto/list-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ActivateUserDto } from './dto/activate-user.dto';
import { ChangeProfileDto } from './dto/change-profile.dto';
import { GetUserTrafficDto } from './dto/user-traffic.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly sasClientService: SasClientService,
    private readonly auditService: AuditService,
    private readonly sasTokenService: SasTokenService,
  ) {}

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
   * List users with pagination and filtering
   */
  async listUsers(
    agentUsername: string,
    dto: ListUsersDto,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ) {
    try {
      const { agent, sasConfig, authToken } = await this.authenticateAgent(agentUsername);

      const options = {
        page: dto.page,
        count: dto.count,
        sortBy: dto.sortBy || 'username',
        direction: dto.direction || 'asc',
        search: dto.search || '',
        columns: dto.columns || [
          'id',
          'username',
          'firstname',
          'lastname',
          'expiration',
          'balance',
          'traffic',
        ],
      };

      const result = await this.sasClientService.listUsers(sasConfig, authToken, options);

      this.logger.log(
        `Users list fetched for agent: ${agentUsername} (page: ${dto.page}, count: ${dto.count})`,
      );

      await this.auditService.log({
        action: 'USERS_LIST_VIEWED',
        entity: 'sas_users',
        agentId: agent.id,
        oldValue: null,
        newValue: JSON.stringify({ page: dto.page, count: dto.count }),
        ipAddress,
        userAgent,
        correlationId,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch users list: ${error.message}`);
      throw new UnauthorizedException('Failed to fetch users from SAS system');
    }
  }

  /**
   * Create a new user
   */
  async createUser(
    agentUsername: string,
    dto: CreateUserDto,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ) {
    try {
      const { agent, sasConfig, authToken } = await this.authenticateAgent(agentUsername);

      // Validate password match
      if (dto.password !== dto.confirm_password) {
        throw new BadRequestException('Passwords do not match');
      }

      const result = await this.sasClientService.createUser(sasConfig, authToken, dto);

      this.logger.log(`User created by agent ${agentUsername}: ${dto.username}`);

      await this.auditService.log({
        action: 'USER_CREATED',
        entity: 'sas_users',
        agentId: agent.id,
        oldValue: null,
        newValue: JSON.stringify({ username: dto.username }),
        ipAddress,
        userAgent,
        correlationId,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new UnauthorizedException('Failed to create user in SAS system');
    }
  }

  /**
   * Get user details by ID
   */
  async getUserById(
    agentUsername: string,
    userId: number,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ) {
    try {
      const { agent, sasConfig, authToken } = await this.authenticateAgent(agentUsername);

      const result = await this.sasClientService.getUserById(sasConfig, authToken, userId);

      this.logger.log(`User details fetched by agent ${agentUsername}: userId ${userId}`);

      await this.auditService.log({
        action: 'USER_DETAILS_VIEWED',
        entity: 'sas_users',
        entityId: userId.toString(),
        agentId: agent.id,
        oldValue: null,
        newValue: null,
        ipAddress,
        userAgent,
        correlationId,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch user details: ${error.message}`);
      throw new UnauthorizedException('Failed to fetch user from SAS system');
    }
  }

  /**
   * Get list of profiles from SAS
   */
  async listProfiles(
    agentUsername: string,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ) {
    try {
      const { agent, sasConfig, authToken } = await this.authenticateAgent(agentUsername);

      const result = await this.sasClientService.getProfiles(sasConfig, authToken);

      this.logger.log(`Profiles list fetched by agent ${agentUsername}`);

      await this.auditService.log({
        action: 'PROFILES_LIST_VIEWED',
        entity: 'sas_profiles',
        agentId: agent.id,
        oldValue: null,
        newValue: null,
        ipAddress,
        userAgent,
        correlationId,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch profiles list: ${error.message}`);
      throw new UnauthorizedException('Failed to fetch profiles from SAS system');
    }
  }

  /**
   * Get activation data for a user
   */
  async getUserActivationData(
    agentUsername: string,
    userId: number,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ) {
    try {
      const { agent, sasConfig, authToken } = await this.authenticateAgent(agentUsername);

      const result = await this.sasClientService.getUserActivationData(
        sasConfig,
        authToken,
        userId,
      );

      this.logger.log(
        `Activation data fetched by agent ${agentUsername}: userId ${userId}`,
      );

      await this.auditService.log({
        action: 'USER_ACTIVATION_DATA_VIEWED',
        entity: 'sas_users',
        entityId: userId.toString(),
        agentId: agent.id,
        oldValue: null,
        newValue: null,
        ipAddress,
        userAgent,
        correlationId,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch activation data: ${error.message}`);
      throw new UnauthorizedException('Failed to fetch activation data from SAS system');
    }
  }

  /**
   * Activate a user
   * Step 1: Get activation data to retrieve required amount
   * Step 2: Validate agent has sufficient balance
   * Step 3: Activate user in SAS
   */
  async activateUser(
    agentUsername: string,
    dto: ActivateUserDto,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ) {
    const transactionId = uuidv4();
    let agent: any;

    try {
      const authResult = await this.authenticateAgent(agentUsername);
      agent = authResult.agent;
      const sasConfig = authResult.sasConfig;
      const authToken = authResult.authToken;

      // Step 1: Get activation data to retrieve required amount
      this.logger.log(
        `Fetching activation data for user ${dto.user_id} by agent ${agentUsername}`,
      );
      
      const activationData = await this.sasClientService.getUserActivationData(
        sasConfig,
        authToken,
        dto.user_id,
      );

      if (!activationData.data) {
        throw new NotFoundException('User not found or activation data unavailable');
      }

      const requiredAmount = activationData.data.n_required_amount;
      const managerBalance = parseFloat(
        activationData.data.manager_balance.replace(/[^\d.-]/g, ''),
      );

      // Step 2: Validate agent has sufficient balance
      // if (managerBalance < requiredAmount) {
      //   throw new BadRequestException(
      //     `Insufficient balance. Available: ${managerBalance}, Required: ${requiredAmount}`,
      //   );
      // }

      // Step 3: Activate user in SAS
      this.logger.log(
        `Activating user ${dto.user_id} with price ${requiredAmount} by agent ${agentUsername}`,
      );

      const activationResult = await this.sasClientService.activateUser(
        sasConfig,
        authToken,
        dto.user_id,
        requiredAmount,
        transactionId,
        dto.comments,
      );

      this.logger.log(
        `User ${dto.user_id} activated successfully by agent ${agentUsername}. Transaction: ${transactionId}`,
      );

      // Audit log
      await this.auditService.log({
        action: 'USER_ACTIVATED',
        entity: 'sas_users',
        entityId: dto.user_id.toString(),
        agentId: agent.id,
        oldValue: JSON.stringify({ 
          balance: managerBalance,
          expiration: activationData.data.user_expiration 
        }),
        newValue: JSON.stringify({
          amount: requiredAmount,
          transactionId,
          profile: activationData.data.profile_name,
        }),
        ipAddress,
        userAgent,
        correlationId,
      });

      return {
        transaction_id: transactionId,
        user_id: dto.user_id,
        amount: requiredAmount,
        message: 'User activated successfully',
        activationResult,
      };
    } catch (error) {
      this.logger.error(
        `Failed to activate user ${dto.user_id}: ${error.message}`,
      );

      // Audit log failure
      await this.auditService.log({
        action: 'USER_ACTIVATION_FAILED',
        entity: 'sas_users',
        entityId: dto.user_id.toString(),
        agentId: agent.id,
        oldValue: null,
        newValue: JSON.stringify({
          error: error.message,
          transactionId,
        }),
        ipAddress,
        userAgent,
        correlationId,
      });

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new UnauthorizedException('Failed to activate user in SAS system');
    }
  }

  /**
   * Change user profile
   * Step 1: Get user details to verify existence
   * Step 2: Change profile in SAS (schedule or immediate)
   */
  async changeUserProfile(
    agentUsername: string,
    dto: ChangeProfileDto,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ) {
    const transactionId = uuidv4();
    let agent: any;

    try {
      const authResult = await this.authenticateAgent(agentUsername);
      agent = authResult.agent;
      const sasConfig = authResult.sasConfig;
      const authToken = authResult.authToken;

      // Step 1: Get user details to verify existence
      this.logger.log(
        `Fetching user details for user ${dto.user_id} by agent ${agentUsername}`,
      );
      
      const userDetails = await this.sasClientService.getUserById(
        sasConfig,
        authToken,
        dto.user_id,
      );

      if (!userDetails.data) {
        throw new NotFoundException('User not found');
      }

      const oldProfileId = userDetails.data.profile_id;
      const oldProfileName = userDetails.data.profile_name;

      // Step 2: Change profile in SAS
      this.logger.log(
        `Changing profile for user ${dto.user_id} from ${oldProfileId} to ${dto.profile_id} (${dto.change_type}) by agent ${agentUsername}`,
      );

      const changeResult = await this.sasClientService.changeUserProfile(
        sasConfig,
        authToken,
        dto.user_id,
        dto.profile_id,
        dto.change_type,
      );

      this.logger.log(
        `Profile changed successfully for user ${dto.user_id} by agent ${agentUsername}. Transaction: ${transactionId}`,
      );

      // Audit log
      await this.auditService.log({
        action: 'USER_PROFILE_CHANGED',
        entity: 'sas_users',
        entityId: dto.user_id.toString(),
        agentId: agent.id,
        oldValue: JSON.stringify({ 
          profile_id: oldProfileId,
          profile_name: oldProfileName,
        }),
        newValue: JSON.stringify({
          profile_id: dto.profile_id,
          change_type: dto.change_type,
          transactionId,
        }),
        ipAddress,
        userAgent,
        correlationId,
      });

      return {
        transaction_id: transactionId,
        user_id: dto.user_id,
        profile_id: dto.profile_id,
        change_type: dto.change_type,
        message: `Profile ${dto.change_type === 'schedule' ? 'scheduled to change' : 'changed immediately'}`,
        changeResult,
      };
    } catch (error) {
      this.logger.error(
        `Failed to change profile for user ${dto.user_id}: ${error.message}`,
      );

      // Audit log failure
      await this.auditService.log({
        action: 'USER_PROFILE_CHANGE_FAILED',
        entity: 'sas_users',
        entityId: dto.user_id.toString(),
        agentId: agent?.id,
        oldValue: null,
        newValue: JSON.stringify({
          error: error.message,
          transactionId,
          profile_id: dto.profile_id,
          change_type: dto.change_type,
        }),
        ipAddress,
        userAgent,
        correlationId,
      });

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new UnauthorizedException('Failed to change user profile in SAS system');
    }
  }

  /**
   * Update user data
   * Step 1: Get current user details
   * Step 2: Validate password match if provided
   * Step 3: Update user in SAS
   */
  async updateUser(
    agentUsername: string,
    userId: number,
    dto: UpdateUserDto,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ) {
    const transactionId = uuidv4();
    let agent: any;

    try {
      const authResult = await this.authenticateAgent(agentUsername);
      agent = authResult.agent;
      const sasConfig = authResult.sasConfig;
      const authToken = authResult.authToken;

      // Step 1: Get current user details
      this.logger.log(
        `Fetching current details for user ${userId} by agent ${agentUsername}`,
      );
      
      const currentUser = await this.sasClientService.getUserById(
        sasConfig,
        authToken,
        userId,
      );

      if (!currentUser.data) {
        throw new NotFoundException('User not found');
      }

      // Step 2: Validate password match if provided
      if (dto.password && dto.password !== dto.confirm_password) {
        throw new BadRequestException('Passwords do not match');
      }

      // Step 3: Update user in SAS
      this.logger.log(
        `Updating user ${userId} by agent ${agentUsername}`,
      );

      const updateResult = await this.sasClientService.updateUser(
        sasConfig,
        authToken,
        userId,
        dto,
      );

      this.logger.log(
        `User ${userId} updated successfully by agent ${agentUsername}. Transaction: ${transactionId}`,
      );

      // Audit log
      await this.auditService.log({
        action: 'USER_UPDATED',
        entity: 'sas_users',
        entityId: userId.toString(),
        agentId: agent.id,
        oldValue: JSON.stringify({ 
          username: currentUser.data.username,
          profile_id: currentUser.data.profile_id,
          enabled: currentUser.data.enabled,
        }),
        newValue: JSON.stringify({
          transactionId,
          updated_fields: Object.keys(dto),
        }),
        ipAddress,
        userAgent,
        correlationId,
      });

      return {
        transaction_id: transactionId,
        user_id: userId,
        message: 'User updated successfully',
        updateResult,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update user ${userId}: ${error.message}`,
      );

      // Audit log failure
      await this.auditService.log({
        action: 'USER_UPDATE_FAILED',
        entity: 'sas_users',
        entityId: userId.toString(),
        agentId: agent?.id,
        oldValue: null,
        newValue: JSON.stringify({
          error: error.message,
          transactionId,
        }),
        ipAddress,
        userAgent,
        correlationId,
      });

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new UnauthorizedException('Failed to update user in SAS system');
    }
  }

  /**
   * Get user traffic data
   * Retrieves daily or monthly traffic reports from SAS
   */
  async getUserTraffic(
    agentUsername: string,
    dto: GetUserTrafficDto,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ) {
    try {
      const { agent, sasConfig, authToken } = await this.authenticateAgent(agentUsername);

      this.logger.log(
        `Fetching ${dto.report_type} traffic for user ${dto.user_id} (${dto.month}/${dto.year}) by agent ${agentUsername}`,
      );

      const trafficData = await this.sasClientService.getUserTraffic(
        sasConfig,
        authToken,
        dto.user_id,
        dto.report_type,
        dto.month,
        dto.year,
      );

      this.logger.log(
        `Traffic data fetched for user ${dto.user_id} by agent ${agentUsername}`,
      );

      // Audit log
      await this.auditService.log({
        action: 'USER_TRAFFIC_VIEWED',
        entity: 'sas_users',
        entityId: dto.user_id.toString(),
        agentId: agent.id,
        oldValue: null,
        newValue: JSON.stringify({
          report_type: dto.report_type,
          month: dto.month,
          year: dto.year,
        }),
        ipAddress,
        userAgent,
        correlationId,
      });

      return {
        user_id: dto.user_id,
        report_type: dto.report_type,
        month: dto.month,
        year: dto.year,
        trafficData,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch traffic for user ${dto.user_id}: ${error.message}`,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new UnauthorizedException('Failed to fetch user traffic from SAS system');
    }
  }
}
