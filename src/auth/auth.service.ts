import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { AuditService } from '../common/audit/audit.service';
import { SasClientService } from '../sas/sas-client.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, AgentLoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
    private readonly auditService: AuditService,
    private readonly sasClientService: SasClientService,
  ) {}

  /**
   * System user login
   */
  async login(dto: LoginDto, ipAddress: string, userAgent: string, correlationId: string) {
    // Find user by email or username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.usernameOrEmail },
          { username: dto.usernameOrEmail },
        ],
        deletedAt: null,
        isActive: true,
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      await this.auditService.logAuth(
        'LOGIN_FAILED',
        null,
        null,
        ipAddress,
        userAgent,
        correlationId,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Extract permissions
    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.name),
    );

    // Generate tokens
    const tokens = await this.generateTokens({
      userId: user.id,
      username: user.username,
      email: user.email,
      userType: 'system',
      permissions,
    });

    // Save refresh token
    await this.saveRefreshToken(tokens.refreshToken, user.id, null);

    // Audit log
    await this.auditService.logAuth(
      'LOGIN_SUCCESS',
      user.id,
      null,
      ipAddress,
      userAgent,
      correlationId,
    );

    this.logger.log(`User logged in: ${user.username}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        userType: 'system' as const,
      },
    };
  }

  /**
   * Agent login (validates against SAS Radius)
   * Automatically tries all active SAS systems to find the correct one
   */
  async agentLogin(dto: AgentLoginDto, ipAddress: string, userAgent: string, correlationId: string) {
    // Get all active SAS systems
    const sasSystems = await this.prisma.sasSystem.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });

    if (!sasSystems || sasSystems.length === 0) {
      throw new UnauthorizedException('No SAS systems available');
    }

    // Try to authenticate against each SAS system
    let authenticatedSasSystem: typeof sasSystems[0] | null = null;
    let authenticationError: any = null;
    let sasToken: string | null = null;
    let sasManagerId: number | null = null;

    for (const sasSystem of sasSystems) {
      try {
        const sasConfig = {
          id: sasSystem.id,
          baseUrl: sasSystem.baseUrl,
          sslEnabled: sasSystem.sslEnabled,
        };

        // Attempt SAS login
        const token = await this.sasClientService.login(sasConfig, {
          username: dto.username,
          password: dto.password,
        });

        // Get agent info from SAS to retrieve manager ID
        const agentInfo = await this.sasClientService.getUserInfo(sasConfig, token);
        sasManagerId = agentInfo.client?.id;

        // If successful, use this SAS system
        authenticatedSasSystem = sasSystem;
        sasToken = token;
        this.logger.log(
          `Agent ${dto.username} authenticated successfully on SAS system: ${sasSystem.name} (${sasSystem.id})`,
        );
        break;
      } catch (error) {
        // Store the error but continue trying other systems
        authenticationError = error;
        this.logger.warn(
          `Failed to authenticate agent ${dto.username} on SAS system ${sasSystem.name}: ${error.message}`,
        );
        continue;
      }
    }

    // If no SAS system authenticated successfully
    if (!authenticatedSasSystem || !sasToken) {
      await this.auditService.logAuth(
        'LOGIN_FAILED',
        null,
        null,
        ipAddress,
        userAgent,
        correlationId,
      );
      throw new UnauthorizedException(
        'Invalid agent credentials or agent not found in any SAS system',
      );
    }

    // Calculate SAS token expiration (assume 1 hour, adjust based on SAS config)
    const sasTokenExpiresAt = new Date();
    sasTokenExpiresAt.setHours(sasTokenExpiresAt.getHours() + 1);

    // Encrypt SAS token for storage
    const encryptedSasToken = this.encryptionService.encrypt(sasToken);

    // Find or create agent in local database
    let agent = await this.prisma.agent.findFirst({
      where: { username: dto.username, sasSystemId: authenticatedSasSystem.id },
    });

    if (!agent) {
      // Create new agent
      const encryptedPassword = this.encryptionService.encrypt(dto.password);
      agent = await this.prisma.agent.create({
        data: {
          username: dto.username,
          encryptedPassword,
          sasSystemId: authenticatedSasSystem.id,
          sasManagerId,
          encryptedSasToken,
          sasTokenExpiresAt,
        },
      });
      this.logger.log(
        `New agent created: ${dto.username} (SAS: ${authenticatedSasSystem.name}, Manager ID: ${sasManagerId})`,
      );
    } else {
      // Update password, SAS token, manager ID, and last login
      const encryptedPassword = this.encryptionService.encrypt(dto.password);
      agent = await this.prisma.agent.update({
        where: { id: agent.id },
        data: {
          encryptedPassword,
          sasManagerId,
          encryptedSasToken,
          sasTokenExpiresAt,
          lastLoginAt: new Date(),
        },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens({
      agentId: agent.id,
      agentUsername: agent.username,
      sasSystemId: agent.sasSystemId,
      userType: 'agent',
      permissions: [], // Agents have predefined permissions
    });

    // Save refresh token
    await this.saveRefreshToken(tokens.refreshToken, null, agent.id);

    // Audit log
    await this.auditService.logAuth(
      'LOGIN_SUCCESS',
      null,
      agent.id,
      ipAddress,
      userAgent,
      correlationId,
    );

    this.logger.log(`Agent logged in: ${agent.username}`);

    return {
      ...tokens,
      user: {
        id: agent.id,
        username: agent.username,
        userType: 'agent' as const,
      },
    };
  }

  /**
   * Register new system user
   */
  async register(dto: RegisterDto) {
    // Check if user exists
    const exists = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (exists) {
      throw new ConflictException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    this.logger.log(`New user registered: ${user.username}`);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
    };
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(payload: any) {
    const accessToken = this.jwtService.sign(payload);
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn')! || '7d';
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret')!,
      expiresIn: refreshExpiresIn,
    } as any);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutes
    };
  }

  /**
   * Save refresh token to database
   */
  private async saveRefreshToken(token: string, userId: string | null, agentId: string | null) {
    const expiresIn = this.configService.get<string>('jwt.refreshExpiresIn')!;
    const days = parseInt(expiresIn || '7', 10);

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        agentId,
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
    });
  }
}
