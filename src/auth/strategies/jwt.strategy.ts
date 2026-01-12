import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret')!,
    });
  }

  async validate(payload: any) {
    this.logger.debug(`JWT validation - payload: ${JSON.stringify(payload)}`);
    
    // Payload contains: userId/agentId, username, userType, permissions
    
    if (payload.userType === 'system') {
      // Validate system user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.isActive || user.deletedAt) {
        this.logger.warn(`User not found or inactive: ${payload.userId}`);
        throw new UnauthorizedException('User not found or inactive');
      }

      const result = {
        userId: user.id,
        username: user.username,
        email: user.email,
        userType: 'system',
        permissions: payload.permissions || [],
      };
      
      this.logger.debug(`JWT validation successful - returning: ${JSON.stringify(result)}`);
      return result;
    } else if (payload.userType === 'agent') {
      // Validate agent
      const agent = await this.prisma.agent.findUnique({
        where: { id: payload.agentId },
      });

      if (!agent || !agent.isActive || agent.deletedAt) {
        throw new UnauthorizedException('Agent not found or inactive');
      }

      return {
        agentId: agent.id,
        agentUsername: agent.username,
        sasSystemId: agent.sasSystemId,
        userType: 'agent',
        permissions: payload.permissions || [],
      };
    }

    throw new UnauthorizedException('Invalid token');
  }
}
