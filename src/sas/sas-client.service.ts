import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../common/encryption/encryption.service';
import { AuditService } from '../common/audit/audit.service';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Agent as HttpsAgent } from 'https';
import { Agent as HttpAgent } from 'http';

export interface SasConfig {
  id: string;
  baseUrl: string;
  sslEnabled: boolean;
}

export interface SasCredentials {
  username: string;
  password: string; // Decrypted password
}

export enum SasAuthType {
  AGENT = 'agent',
  ADMIN = 'admin',
}

/**
 * SasClientService
 * 
 * Reusable service for interacting with SAS Radius APIs
 * - Handles encryption/decryption of payloads
 * - Supports both agent and admin authentication
 * - Implements retry logic and timeout handling
 * - Never logs sensitive data
 */
@Injectable()
export class SasClientService {
  private readonly logger = new Logger(SasClientService.name);
  private readonly requestTimeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
    private readonly auditService: AuditService,
  ) {
    this.requestTimeout = this.configService.get<number>('sas.requestTimeout')!;
    this.maxRetries = this.configService.get<number>('sas.maxRetries')!;
    this.retryDelay = this.configService.get<number>('sas.retryDelay')!;
  }

  /**
   * Create axios instance for SAS system
   */
  private createAxiosInstance(sasConfig: SasConfig): AxiosInstance {
    const protocol = sasConfig.sslEnabled ? 'https' : 'http';
    const baseURL = sasConfig.baseUrl.startsWith('http')
      ? sasConfig.baseUrl
      : `${protocol}://${sasConfig.baseUrl}`;

    return axios.create({
      baseURL,
      timeout: this.requestTimeout,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      httpAgent: new HttpAgent({ keepAlive: true }),
      httpsAgent: new HttpsAgent({
        rejectUnauthorized: sasConfig.sslEnabled,
        keepAlive: true,
      }),
    });
  }

  /**
   * Login to SAS Radius and get authentication token
   * @param sasConfig - SAS system configuration
   * @param credentials - Username and password (decrypted)
   * @returns Authentication token
   */
  async login(
    sasConfig: SasConfig,
    credentials: SasCredentials,
  ): Promise<string> {
    try {
      const axiosInstance = this.createAxiosInstance(sasConfig);
      
      // Encrypt the login payload
      const payload = {
        username: credentials.username,
        password: credentials.password,
      };
      
      const encryptedPayload = this.encryptionService.encryptPayload(payload);
      
      this.logger.log(
        `Attempting SAS login for user: ${credentials.username} on system: ${sasConfig.id}`,
      );

      // Make login request
      const response = await axiosInstance.post(
        '/admin/api/index.php/api/login',
        `payload=${encodeURIComponent(encryptedPayload)}`,
      );

      if (response.data && response.data.token) {
        this.logger.log(`Successfully logged into SAS system: ${sasConfig.id}`);
        return response.data.token;
      }

      throw new HttpException(
        'Failed to obtain authentication token from SAS',
        HttpStatus.UNAUTHORIZED,
      );
    } catch (error) {
      this.logger.error(
        `SAS login failed for system ${sasConfig.id}: ${error.message}`,
      );
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new HttpException(
            'Invalid SAS credentials',
            HttpStatus.UNAUTHORIZED,
          );
        }
        throw new HttpException(
          'Failed to connect to SAS system',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      
      throw error;
    }
  }

  /**
   * Make authenticated request to SAS Radius API
   * @param sasConfig - SAS system configuration
   * @param authToken - Authentication token
   * @param endpoint - API endpoint (e.g., '/admin/api/index.php/api/index/user')
   * @param payload - Request payload (will be encrypted)
   * @param method - HTTP method
   * @returns API response
   */
  async request<T = any>(
    sasConfig: SasConfig,
    authToken: string,
    endpoint: string,
    payload?: any,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
  ): Promise<T> {
    let attempt = 0;
    let lastError: any;
    const requestStartTime = Date.now();

    while (attempt < this.maxRetries) {
      try {
        attempt++;
        const axiosInstance = this.createAxiosInstance(sasConfig);

        // Prepare request config
        const config: AxiosRequestConfig = {
          method,
          url: endpoint,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        };

        let encryptedPayload: string | undefined;
        // Encrypt payload if provided
        if (payload && (method === 'POST' || method === 'PUT')) {
          encryptedPayload = this.encryptionService.encryptPayload(payload);
          config.data = `payload=${encodeURIComponent(encryptedPayload)}`;
        }

        this.logger.log(
          `SAS Request: ${method} ${endpoint} (Attempt ${attempt}/${this.maxRetries})`,
        );

        // Log detailed request audit
        await this.auditService.log({
          action: 'SAS_REQUEST',
          entity: 'sas_api',
          entityId: sasConfig.id,
          sasSystemId: sasConfig.id,
          oldValue: null,
          newValue: JSON.stringify({
            method,
            endpoint,
            attempt,
            maxRetries: this.maxRetries,
            requestHeaders: {
              'Content-Type': config.headers?.['Content-Type'],
              Authorization: 'Bearer [REDACTED]',
            },
            requestPayload: payload, // Original unencrypted payload for audit
            encryptedPayloadLength: encryptedPayload?.length,
          }),
        });

        // Make request
        const response = await axiosInstance.request(config);
        const requestDuration = Date.now() - requestStartTime;

        this.logger.log(`SAS Request successful: ${method} ${endpoint} (${requestDuration}ms)`);

        // Log successful response audit
        await this.auditService.log({
          action: 'SAS_RESPONSE_SUCCESS',
          entity: 'sas_api',
          entityId: sasConfig.id,
          sasSystemId: sasConfig.id,
          oldValue: null,
          newValue: JSON.stringify({
            method,
            endpoint,
            statusCode: response.status,
            statusText: response.statusText,
            duration: requestDuration,
            responseHeaders: {
              'Content-Type': response.headers['content-type'],
              'Content-Length': response.headers['content-length'],
            },
            responseData: response.data,
          }),
        });
        
        return response.data;
      } catch (error) {
        lastError = error;
        const requestDuration = Date.now() - requestStartTime;
        
        this.logger.warn(
          `SAS Request failed (Attempt ${attempt}/${this.maxRetries}): ${error.message}`,
        );

        // Log failed request audit
        await this.auditService.log({
          action: 'SAS_RESPONSE_FAILED',
          entity: 'sas_api',
          entityId: sasConfig.id,
          sasSystemId: sasConfig.id,
          oldValue: null,
          newValue: JSON.stringify({
            method,
            endpoint,
            attempt,
            duration: requestDuration,
            errorMessage: error.message,
            errorStatus: axios.isAxiosError(error) ? error.response?.status : null,
            errorData: axios.isAxiosError(error) ? error.response?.data : null,
          }),
        });

        // Don't retry on authentication errors
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          throw new HttpException(
            'SAS authentication expired',
            HttpStatus.UNAUTHORIZED,
          );
        }

        // Wait before retrying
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    // All retries failed
    this.logger.error(
      `SAS Request failed after ${this.maxRetries} attempts: ${lastError.message}`,
    );
    
    throw new HttpException(
      'SAS service temporarily unavailable',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  /**
   * Helper method to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get user list from SAS
   * @param sasConfig - SAS system configuration
   * @param authToken - Authentication token
   * @param options - Pagination and filter options
   */
  async getUserList(
    sasConfig: SasConfig,
    authToken: string,
    options: {
      page: number;
      count: number;
      sortBy?: string;
      direction?: 'asc' | 'desc';
      search?: string;
      columns?: string[];
    },
  ): Promise<any> {
    const payload = {
      page: options.page,
      count: options.count,
      sortBy: options.sortBy || 'username',
      direction: options.direction || 'asc',
      search: options.search || '',
      columns: options.columns || [
        'id',
        'username',
        'firstname',
        'lastname',
        'expiration',
        'parent_username',
        'name',
        'balance',
        'traffic',
      ],
    };

    return this.request(
      sasConfig,
      authToken,
      '/admin/api/index.php/api/index/user',
      payload,
      'POST',
    );
  }

  /**
   * Get user wallet balance from SAS
   */
  async getWalletBalance(
    sasConfig: SasConfig,
    authToken: string,
    username: string,
  ): Promise<any> {
    // Implementation depends on SAS API endpoint
    // Placeholder for now
    return this.request(
      sasConfig,
      authToken,
      '/admin/api/index.php/api/wallet/balance',
      { username },
      'POST',
    );
  }

  /**
   * Get transactions from SAS
   */
  async getTransactions(
    sasConfig: SasConfig,
    authToken: string,
    options: {
      page: number;
      count: number;
      username?: string;
    },
  ): Promise<any> {
    return this.request(
      sasConfig,
      authToken,
      '/admin/api/index.php/api/transactions',
      options,
      'POST',
    );
  }

  /**
   * Get manager tree hierarchy from SAS
   * Returns the tree of managers based on the authenticated user's token
   */
  async getManagerTree(
    sasConfig: SasConfig,
    authToken: string,
  ): Promise<any> {
    this.logger.log(`Fetching manager tree from SAS system: ${sasConfig.id}`);
    
    return this.request(
      sasConfig,
      authToken,
      '/admin/api/index.php/api/manager/tree',
      undefined,
      'GET',
    );
  }

  /**
   * Get authenticated user information from SAS
   * Returns user details including balance, permissions, and features
   */
  async getUserInfo(
    sasConfig: SasConfig,
    authToken: string,
  ): Promise<any> {
    this.logger.log(`Fetching user info from SAS system: ${sasConfig.id}`);
    
    return this.request(
      sasConfig,
      authToken,
      '/admin/api/index.php/api/auth',
      undefined,
      'GET',
    );
  }

  /**
   * List users with pagination, filtering, and custom columns
   */
  async listUsers(
    sasConfig: SasConfig,
    authToken: string,
    options: {
      page: number;
      count: number;
      sortBy?: string;
      direction?: 'asc' | 'desc';
      search?: string;
      columns?: string[];
    },
  ): Promise<any> {
    this.logger.log(`Fetching users list from SAS system: ${sasConfig.id} (page: ${options.page})`);
    
    return this.request(
      sasConfig,
      authToken,
      '/admin/api/index.php/api/index/user',
      options,
      'POST',
    );
  }

  /**
   * Create a new user in SAS
   */
  async createUser(
    sasConfig: SasConfig,
    authToken: string,
    userData: any,
  ): Promise<any> {
    this.logger.log(`Creating user in SAS system: ${sasConfig.id} (username: ${userData.username})`);
    
    return this.request(
      sasConfig,
      authToken,
      '/admin/api/index.php/api/user',
      userData,
      'POST',
    );
  }

  /**
   * Get user details by ID
   */
  async getUserById(
    sasConfig: SasConfig,
    authToken: string,
    userId: number,
  ): Promise<any> {
    this.logger.log(`Fetching user details from SAS system: ${sasConfig.id} (userId: ${userId})`);
    
    return this.request(
      sasConfig,
      authToken,
      `/admin/api/index.php/api/user/${userId}`,
      undefined,
      'GET',
    );
  }

  /**
   * Get manager details by ID
   */
  async getManagerById(
    sasConfig: SasConfig,
    authToken: string,
    managerId: number,
  ): Promise<any> {
    this.logger.log(`Fetching manager details from SAS system: ${sasConfig.id} (managerId: ${managerId})`);
    
    return this.request(
      sasConfig,
      authToken,
      `/admin/api/index.php/api/manager/${managerId}`,
      undefined,
      'GET',
    );
  }

  /**
   * Deposit money to a manager
   * Transfers money from authenticated user to target manager
   */
  async depositToManager(
    sasConfig: SasConfig,
    authToken: string,
    depositData: {
      manager_id: number;
      my_balance: number;
      manager_username: string;
      amount: number;
      comment: string;
      transaction_id: string;
      is_loan: boolean;
      balance: number;
    },
  ): Promise<any> {
    this.logger.log(
      `Depositing ${depositData.amount} to manager ${depositData.manager_username} (ID: ${depositData.manager_id})`,
    );
    
    return this.request(
      sasConfig,
      authToken,
      '/admin/api/index.php/api/manager/deposit',
      depositData,
      'POST',
    );
  }

  /**
   * Get list of profiles
   */
  async getProfiles(
    sasConfig: SasConfig,
    authToken: string,
  ): Promise<any> {
    this.logger.log(`Fetching profiles list from SAS system: ${sasConfig.id}`);
    
    return this.request(
      sasConfig,
      authToken,
      '/admin/api/index.php/api/list/profile/0',
      undefined,
      'GET',
    );
  }

  /**
   * Get activation data for a user
   */
  async getUserActivationData(
    sasConfig: SasConfig,
    authToken: string,
    userId: number,
  ): Promise<any> {
    this.logger.log(
      `Fetching activation data for user ID ${userId} from SAS system: ${sasConfig.id}`,
    );
    
    return this.request(
      sasConfig,
      authToken,
      `/admin/api/index.php/api/user/activationData/${userId}`,
      undefined,
      'GET',
    );
  }

  /**
   * Activate a user
   */
  async activateUser(
    sasConfig: SasConfig,
    authToken: string,
    userId: number,
    userPrice: number,
    transactionId: string,
    comments?: string,
  ): Promise<any> {
    this.logger.log(
      `Activating user ID ${userId} with price ${userPrice} on SAS system: ${sasConfig.id}`,
    );

    const payload = {
      method: 'credit',
      pin: '',
      user_id: userId,
      money_collected: 1,
      comments: comments || null,
      user_price: userPrice,
      issue_invoice: 0,
      transaction_id: transactionId,
      activation_units: 1,
    };

    return this.request(
      sasConfig,
      authToken,
      '/admin/api/index.php/api/user/activate',
      payload,
      'POST',
    );
  }

  /**
   * Change user profile
   */
  async changeUserProfile(
    sasConfig: SasConfig,
    authToken: string,
    userId: number,
    profileId: number,
    changeType: 'schedule' | 'immediate',
  ): Promise<any> {
    this.logger.log(
      `Changing profile for user ID ${userId} to profile ${profileId} (${changeType}) on SAS system: ${sasConfig.id}`,
    );

    const payload = {
      user_id: userId,
      profile_id: profileId,
      change_type: changeType,
    };

    return this.request(
      sasConfig,
      authToken,
      '/admin/api/index.php/api/user/changeProfile',
      payload,
      'POST',
    );
  }

  /**
   * Update user data
   */
  async updateUser(
    sasConfig: SasConfig,
    authToken: string,
    userId: number,
    userData: any,
  ): Promise<any> {
    this.logger.log(
      `Updating user ID ${userId} on SAS system: ${sasConfig.id}`,
    );

    return this.request(
      sasConfig,
      authToken,
      `/admin/api/index.php/api/user/${userId}`,
      userData,
      'PUT',
    );
  }

  /**
   * Get user traffic data
   */
  async getUserTraffic(
    sasConfig: SasConfig,
    authToken: string,
    userId: number,
    reportType: 'daily' | 'monthly',
    month: number,
    year: number,
  ): Promise<any> {
    this.logger.log(
      `Fetching ${reportType} traffic for user ID ${userId} (${month}/${year}) on SAS system: ${sasConfig.id}`,
    );

    const payload = {
      report_type: reportType,
      month,
      year,
      user_id: userId.toString(),
    };

    return this.request(
      sasConfig,
      authToken,
      '/admin/api/index.php/api/user/traffic',
      payload,
      'POST',
    );
  }

  /**
   * Top up agent balance (using admin credentials)
   * This is called by the system after successful payment
   * Uses the same deposit endpoint as manager deposits
   */
  async topUpAgentBalance(
    sasConfig: SasConfig,
    adminToken: string,
    agentId: number,
    agentUsername: string,
    amount: number,
    transactionId: string,
    currentAgentBalance: number,
  ): Promise<any> {
    this.logger.log(
      `Topping up ${amount} for agent ${agentUsername} (ID: ${agentId}) on SAS system: ${sasConfig.id}`,
    );

    const payload = {
      manager_id: agentId, // SAS agent ID from auth endpoint
      my_balance: currentAgentBalance,
      manager_username: agentUsername,
      amount: amount,
      comment: `Wallet top-up via payment gateway`,
      transaction_id: transactionId,
      is_loan: false,
      balance: currentAgentBalance + amount,
    };

    return this.request(
      sasConfig,
      adminToken,
      '/admin/api/index.php/api/manager/deposit',
      payload,
      'POST',
    );
  }
}
