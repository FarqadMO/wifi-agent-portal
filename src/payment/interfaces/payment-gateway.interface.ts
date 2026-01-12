import { PaymentStatus, PaymentMethod, ServiceType } from '../enums/payment.enum';

/**
 * Interface for payment gateway providers
 * All payment gateways must implement this interface
 */
export interface IPaymentGateway {
  /**
   * Create a new payment
   */
  createPayment(
    amount: number,
    agentId: string,
    serviceType: ServiceType,
    metadata?: Record<string, any>,
  ): Promise<PaymentCreationResponse>;

  /**
   * Get payment status
   */
  getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse>;

  /**
   * Refund a payment
   */
  refundPayment(paymentId: string, amount: number, reason: string): Promise<PaymentRefundResponse>;

  /**
   * Cancel a payment
   */
  cancelPayment(paymentId: string): Promise<PaymentCancellationResponse>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Promise<boolean>;

  /**
   * Process webhook notification
   */
  processWebhookNotification(payload: any): Promise<WebhookProcessResult>;
}

export interface PaymentCreationResponse {
  success: boolean;
  paymentId: string;
  gatewayUrl?: string;
  referenceId: string;
  callbackUrl?: string;
  notificationUrl?: string;
  details?: any;
  error?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  status: PaymentStatus;
  paymentId: string;
  amount?: number;
  currency?: string;
  details?: any;
  error?: string;
}

export interface PaymentRefundResponse {
  success: boolean;
  refundId: string;
  amount: number;
  error?: string;
}

export interface PaymentCancellationResponse {
  success: boolean;
  paymentId: string;
  error?: string;
}

export interface WebhookProcessResult {
  success: boolean;
  paymentId: string;
  status: PaymentStatus;
  shouldUpdateDatabase: boolean;
  data?: any;
}
