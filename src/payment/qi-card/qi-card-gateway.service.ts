import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QiCardConfigService } from './qi-card-config.service';
import {
  IPaymentGateway,
  PaymentCreationResponse,
  PaymentStatusResponse,
  PaymentRefundResponse,
  PaymentCancellationResponse,
  WebhookProcessResult,
} from '../interfaces/payment-gateway.interface';
import { PaymentStatus, ServiceType } from '../enums/payment.enum';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as fs from 'fs';

@Injectable()
export class QiCardGatewayService implements IPaymentGateway {
  private readonly logger = new Logger(QiCardGatewayService.name);
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly config: QiCardConfigService,
    private readonly configService: ConfigService,
  ) {
    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  async createPayment(
    amount: number,
    agentId: string,
    serviceType: ServiceType,
    metadata?: Record<string, any>,
  ): Promise<PaymentCreationResponse> {
    try {
      const requestId = uuidv4();
      const baseUrl = this.configService.get<string>('app.url')!;
      const callbackToken = this.config.callbackToken;

      const payload = {
        requestId,
        amount,
        locale: 'en_US',
        currency: this.config.currency,
        finishPaymentUrl: `${baseUrl}/api/v1/payment/qi-card/callback?token=${callbackToken}`,
        notificationUrl: `${baseUrl}/api/v1/payment/qi-card/notification?token=${callbackToken}`,
      };

      const headers = {
        'X-Terminal-Id': this.config.xTerminalId,
        'Authorization': this.config.getBasicAuthHeader(),
      };

      this.logger.debug(`QiCard API URL: ${this.config.apiUrl}`);
      this.logger.debug(`QiCard Terminal ID: ${this.config.xTerminalId}`);
      this.logger.debug(`QiCard Username: ${this.config.username}`);
      this.logger.debug(`QiCard Request Payload: ${JSON.stringify(payload)}`);

      const response = await this.httpClient.post(
        '/payment',
        payload,
        { headers },
      );

      if (response.data && response.data.paymentId) {
        this.logger.log(
          `QiCard payment created successfully: ${response.data.paymentId}`,
        );

        return {
          success: true,
          paymentId: response.data.paymentId,
          referenceId: requestId,
          gatewayUrl: response.data.formUrl,
        };
      }

      return {
        success: false,
        paymentId: '',
        referenceId: requestId,
        error: 'Invalid response from QiCard',
      };
    } catch (error: any) {
      this.logger.error(`QiCard payment creation failed: ${error.message}`);
      return {
        success: false,
        paymentId: '',
        referenceId: '',
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await this.httpClient.get(
        `/payment/${paymentId}/status`,
        {
          headers: {
            'X-Terminal-Id': this.config.xTerminalId,
            'Authorization': this.config.getBasicAuthHeader(),
          },
        },
      );

      if (response.data) {
        const status = this.mapQiStatusToInternal(response.data.status);

        return {
          success: true,
          status,
          paymentId,
          amount: response.data.amount,
          currency: response.data.currency,
          details: response.data,
        };
      }

      return {
        success: false,
        status: PaymentStatus.FAILED,
        paymentId,
        error: 'Invalid response from QiCard',
      };
    } catch (error: any) {
      this.logger.error(
        `QiCard payment status check failed: ${error.message}`,
      );
      return {
        success: false,
        status: PaymentStatus.FAILED,
        paymentId,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async refundPayment(
    paymentId: string,
    amount: number,
    reason: string,
  ): Promise<PaymentRefundResponse> {
    try {
      const requestId = uuidv4();

      const response = await this.httpClient.post(
        `/payment/${paymentId}/refund`,
        {
          requestId,
          amount,
          message: reason,
        },
        {
          headers: {
            'X-Terminal-Id': this.config.xTerminalId,
            'Authorization': this.config.getBasicAuthHeader(),
          },
        },
      );

      if (response.data) {
        this.logger.log(`QiCard payment refunded successfully: ${paymentId}`);

        return {
          success: true,
          refundId: response.data.refundId || requestId,
          amount,
        };
      }

      return {
        success: false,
        refundId: '',
        amount,
        error: 'Invalid response from QiCard',
      };
    } catch (error: any) {
      this.logger.error(`QiCard payment refund failed: ${error.message}`);
      return {
        success: false,
        refundId: '',
        amount,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async cancelPayment(paymentId: string): Promise<PaymentCancellationResponse> {
    try {
      const requestId = uuidv4();

      const response = await this.httpClient.post(
        `/payment/${paymentId}/cancel`,
        {
          requestId,
        },
        {
          headers: {
            'X-Terminal-Id': this.config.xTerminalId,
            'Authorization': this.config.getBasicAuthHeader(),
          },
        },
      );

      if (response.data) {
        this.logger.log(`QiCard payment cancelled successfully: ${paymentId}`);

        return {
          success: true,
          paymentId,
        };
      }

      return {
        success: false,
        paymentId,
        error: 'Invalid response from QiCard',
      };
    } catch (error: any) {
      this.logger.error(`QiCard payment cancellation failed: ${error.message}`);
      return {
        success: false,
        paymentId,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async verifyWebhookSignature(
    payload: string,
    signature: string,
  ): Promise<boolean> {
    try {
      // Decode the Base64 signature
      const decodedSignature = Buffer.from(signature, 'base64');

      // Load the public key
      const publicKeyPath = this.config.publicKeyPath;
      
      if (!fs.existsSync(publicKeyPath)) {
        this.logger.error(`Public key not found at: ${publicKeyPath}`);
        return false;
      }

      const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

      // Verify the signature using SHA256 with RSA
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(payload);
      verifier.end();

      const isValid = verifier.verify(publicKey, decodedSignature);

      if (!isValid) {
        this.logger.warn('QiCard webhook signature verification failed');
      }

      return isValid;
    } catch (error: any) {
      this.logger.error(
        `QiCard signature verification error: ${error.message}`,
      );
      return false;
    }
  }

  async processWebhookNotification(payload: any): Promise<WebhookProcessResult> {
    try {
      const status = this.mapQiStatusToInternal(payload.status);

      return {
        success: true,
        paymentId: payload.paymentId,
        status,
        shouldUpdateDatabase: status === PaymentStatus.COMPLETED || status === PaymentStatus.FAILED,
        data: payload,
      };
    } catch (error: any) {
      this.logger.error(
        `QiCard webhook processing error: ${error.message}`,
      );
      return {
        success: false,
        paymentId: payload?.paymentId || '',
        status: PaymentStatus.FAILED,
        shouldUpdateDatabase: false,
      };
    }
  }

  private mapQiStatusToInternal(qiStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      SUCCESS: PaymentStatus.COMPLETED,
      PENDING: PaymentStatus.PENDING,
      FAILED: PaymentStatus.FAILED,
      CANCELLED: PaymentStatus.CANCELLED,
      REFUNDED: PaymentStatus.REFUNDED,
    };

    return statusMap[qiStatus] || PaymentStatus.FAILED;
  }
}
