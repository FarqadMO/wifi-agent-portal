import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { SasClientService } from '../../sas/sas-client.service';

/**
 * SasTokenService
 * 
 * Centralized service for managing SAS authentication tokens
 * - Handles token caching and expiration
 * - Automatically refreshes expired tokens
 * - Reusable across all services that need agent authentication
 */
@Injectable()
export class SasTokenService {
  private readonly logger = new Logger(SasTokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly sasClientService: SasClientService,
  ) {}

  /**
   * Get valid SAS token for agent - reuse cached token or refresh if expired
   * This method is used by all services that need to authenticate as an agent
   */
  async getSasToken(agent: any): Promise<string> {
    // Check if we have a cached token that hasn't expired
    if (
      agent.encryptedSasToken &&
      agent.sasTokenExpiresAt &&
      new Date(agent.sasTokenExpiresAt) > new Date()
    ) {
      // Token is still valid, decrypt and return
      this.logger.debug(`Using cached SAS token for agent: ${agent.username}`);
      return this.encryptionService.decrypt(agent.encryptedSasToken);
    }

    // Token expired or not cached, need to login to SAS
    this.logger.log(`SAS token expired or missing for agent: ${agent.username}, refreshing...`);

    const sasConfig = {
      id: agent.sasSystem.id,
      baseUrl: agent.sasSystem.baseUrl,
      sslEnabled: agent.sasSystem.sslEnabled,
    };

    // Decrypt agent password
    const agentPassword = this.encryptionService.decrypt(agent.encryptedPassword);

    // Login to get new token
    const newToken = await this.sasClientService.login(sasConfig, {
      username: agent.username,
      password: agentPassword,
    });

    // Calculate new expiration (1 hour from now)
    const sasTokenExpiresAt = new Date();
    sasTokenExpiresAt.setHours(sasTokenExpiresAt.getHours() + 1);

    // Encrypt and store new token
    const encryptedSasToken = this.encryptionService.encrypt(newToken);

    // Update agent record with new token
    await this.prisma.agent.update({
      where: { id: agent.id },
      data: {
        encryptedSasToken,
        sasTokenExpiresAt,
      },
    });

    this.logger.log(`SAS token refreshed for agent: ${agent.username}`);

    return newToken;
  }
}
