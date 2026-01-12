import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { QiCardGatewayService } from './qi-card/qi-card-gateway.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentStatus, PaymentMethod, ServiceType } from './enums/payment.enum';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { I18nService } from 'nestjs-i18n';
import { AgentsService } from '../agents/agents.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly qiCardGateway: QiCardGatewayService,
    private readonly i18n: I18nService,
    @Inject(forwardRef(() => AgentsService))
    private readonly agentsService: AgentsService,
  ) {}

  /**
   * Select payment gateway based on payment method
   */
  private getPaymentGateway(paymentMethod: PaymentMethod) {
    switch (paymentMethod) {
      case PaymentMethod.QI_CARD:
        return this.qiCardGateway;
      // Add more gateways here as they are implemented
      // case PaymentMethod.ZAIN_CASH:
      //   return this.zainCashGateway;
      // case PaymentMethod.PAYPAL:
      //   return this.paypalGateway;
      default:
        throw new BadRequestException(
          this.i18n.t('payment.errors.unsupportedMethod', {
            args: { method: paymentMethod },
          }) || `Unsupported payment method: ${paymentMethod}`,
        );
    }
  }

  async createPayment(
    agentId: string,
    agentUsername: string,
    createPaymentDto: CreatePaymentDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<PaymentResponseDto> {
    const { amount, serviceType, paymentMethod, metadata } = createPaymentDto;

    // Select appropriate payment gateway
    const gateway = this.getPaymentGateway(paymentMethod);

    this.logger.log(
      `Creating payment for agent ${agentUsername} via ${paymentMethod}: ${amount}`,
    );

    // Create payment with selected gateway
    const paymentResult = await gateway.createPayment(
      amount,
      agentId,
      serviceType,
      metadata,
    );

    if (!paymentResult.success) {
      this.logger.error(
        `Payment creation failed for agent ${agentUsername}: ${paymentResult.error}`,
      );
      throw new BadRequestException(
        this.i18n.t('payment.errors.createFailed', {
          args: { reason: paymentResult.error },
        }),
      );
    }

    // Store payment transaction in database
    const payment = await this.prisma.paymentTransaction.create({
      data: {
        transactionId: paymentResult.paymentId,
        referenceId: paymentResult.referenceId,
        amount,
        currency: 'USD',
        status: PaymentStatus.PENDING,
        paymentMethod: paymentMethod, // Use selected payment method
        serviceType,
        agentId,
        gatewayUrl: paymentResult.gatewayUrl,
        callbackUrl: paymentResult.callbackUrl,
        notificationUrl: paymentResult.notificationUrl,
        paymentDetails: paymentResult.details || {},
        metadata: metadata || {},
      },
    });

    // Audit log
    await this.auditService.log({
      agentId: agentId,
      agentUsername: agentUsername,
      action: 'payment.create',
      entity: 'PaymentTransaction',
      entityId: payment.id,
      newValue: {
        transactionId: payment.transactionId,
        amount: payment.amount,
        serviceType: payment.serviceType,
      },
      ipAddress,
      userAgent,
    });

    this.logger.log(
      `Payment created successfully for agent ${agentUsername}: ${payment.id}`,
    );

    return this.mapToResponseDto(payment);
  }

  async getPaymentById(
    paymentId: string,
    agentId: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException(
        this.i18n.t('payment.errors.notFound'),
      );
    }

    // Ensure agent can only access their own payments
    if (payment.agentId !== agentId) {
      throw new NotFoundException(
        this.i18n.t('payment.errors.notFound'),
      );
    }

    return this.mapToResponseDto(payment);
  }

  async getPaymentByTransactionId(
    transactionId: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { transactionId },
    });

    if (!payment) {
      throw new NotFoundException(
        this.i18n.t('payment.errors.notFound'),
      );
    }

    return this.mapToResponseDto(payment);
  }

  async getAgentPayments(
    agentId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<{ data: PaymentResponseDto[]; total: number }> {
    const [payments, total] = await Promise.all([
      this.prisma.paymentTransaction.findMany({
        where: { agentId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.paymentTransaction.count({
        where: { agentId },
      }),
    ]);

    return {
      data: payments.map((p) => this.mapToResponseDto(p)),
      total,
    };
  }

  async checkPaymentStatus(
    paymentId: string,
    agentId: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException(
        this.i18n.t('payment.errors.notFound'),
      );
    }

    // Ensure agent can only check their own payments
    if (payment.agentId !== agentId) {
      throw new NotFoundException(
        this.i18n.t('payment.errors.notFound'),
      );
    }

    // If payment is already completed or failed, return cached status
    if (
      payment.status === PaymentStatus.COMPLETED ||
      payment.status === PaymentStatus.FAILED ||
      payment.status === PaymentStatus.CANCELLED ||
      payment.status === PaymentStatus.REFUNDED
    ) {
      return this.mapToResponseDto(payment);
    }

    // Check status with appropriate gateway
    const gateway = this.getPaymentGateway(payment.paymentMethod as PaymentMethod);
    const statusResult = await gateway.getPaymentStatus(
      payment.transactionId,
    );

    if (statusResult.success && statusResult.status !== payment.status) {
      // Update payment status in database
      const updatedPayment = await this.updatePaymentStatus(
        payment.id,
        statusResult.status,
        statusResult.details,
      );

      return this.mapToResponseDto(updatedPayment);
    }

    return this.mapToResponseDto(payment);
  }

  async refundPayment(
    paymentId: string,
    agentId: string,
    refundDto: RefundPaymentDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException(
        this.i18n.t('payment.errors.notFound'),
      );
    }

    // Ensure agent can only refund their own payments
    if (payment.agentId !== agentId) {
      throw new NotFoundException(
        this.i18n.t('payment.errors.notFound'),
      );
    }

    // Only completed payments can be refunded
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        this.i18n.t('payment.errors.cannotRefund'),
      );
    }

    // Refund with appropriate gateway
    const gateway = this.getPaymentGateway(payment.paymentMethod as PaymentMethod);
    const refundResult = await gateway.refundPayment(
      payment.transactionId,
      refundDto.amount,
      refundDto.reason || 'Refund requested by agent',
    );

    if (!refundResult.success) {
      throw new BadRequestException(
        this.i18n.t('payment.errors.refundFailed', {
          args: { reason: refundResult.error },
        }),
      );
    }

    // Update payment status
    const updatedPayment = await this.prisma.paymentTransaction.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        processedAt: new Date(),
        paymentDetails: {
          ...((payment.paymentDetails as any) || {}),
          refund: refundResult,
        },
      },
    });

    // Audit log
    await this.auditService.log({
      agentId: agentId,
      action: 'payment.refund',
      entity: 'PaymentTransaction',
      entityId: payment.id,
      oldValue: { status: payment.status },
      newValue: { status: PaymentStatus.REFUNDED, refundId: refundResult.refundId },
      ipAddress,
      userAgent,
    });

    this.logger.log(`Payment refunded: ${paymentId}`);

    return this.mapToResponseDto(updatedPayment);
  }

  async cancelPayment(
    paymentId: string,
    agentId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException(
        this.i18n.t('payment.errors.notFound'),
      );
    }

    // Ensure agent can only cancel their own payments
    if (payment.agentId !== agentId) {
      throw new NotFoundException(
        this.i18n.t('payment.errors.notFound'),
      );
    }

    // Only pending payments can be cancelled
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        this.i18n.t('payment.errors.cannotCancel'),
      );
    }

    // Cancel with appropriate gateway
    const gateway = this.getPaymentGateway(payment.paymentMethod as PaymentMethod);
    const cancelResult = await gateway.cancelPayment(
      payment.transactionId,
    );

    if (!cancelResult.success) {
      throw new BadRequestException(
        this.i18n.t('payment.errors.cancelFailed', {
          args: { reason: cancelResult.error },
        }),
      );
    }

    // Update payment status
    const updatedPayment = await this.prisma.paymentTransaction.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.CANCELLED,
        processedAt: new Date(),
      },
    });

    // Audit log
    await this.auditService.log({
      agentId: agentId,
      action: 'payment.cancel',
      entity: 'PaymentTransaction',
      entityId: payment.id,
      oldValue: { status: payment.status },
      newValue: { status: PaymentStatus.CANCELLED },
      ipAddress,
      userAgent,
    });

    this.logger.log(`Payment cancelled: ${paymentId}`);

    return this.mapToResponseDto(updatedPayment);
  }

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    details?: any,
    failureReason?: string,
  ): Promise<any> {
    const payment = await this.prisma.paymentTransaction.update({
      where: { id: paymentId },
      data: {
        status,
        processedAt: new Date(),
        paymentDetails: details ? { ...(details as any) } : undefined,
        failureReason,
      },
    });

    this.logger.log(`Payment status updated: ${paymentId} -> ${status}`);

    return payment;
  }

  async processWebhook(
    paymentId: string,
    webhookData: any,
  ): Promise<void> {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { transactionId: paymentId },
    });

    if (!payment) {
      this.logger.warn(`Webhook received for unknown payment: ${paymentId}`);
      return;
    }

    // Process webhook with appropriate gateway
    const gateway = this.getPaymentGateway(payment.paymentMethod as PaymentMethod);
    const result = await gateway.processWebhookNotification(webhookData);

    if (result.shouldUpdateDatabase) {
      await this.updatePaymentStatus(
        payment.id,
        result.status,
        result.data,
      );

      // If payment is completed, top up agent wallet
      if (result.status === PaymentStatus.COMPLETED) {
        await this.processSuccessfulPayment(payment);
      }
    }
  }

  private async processSuccessfulPayment(payment: any): Promise<void> {
    try {
      this.logger.log(
        `Processing successful payment for agent: ${payment.agentId}, amount: ${payment.amount}`,
      );

      // Only process agent top-ups (not other service types)
      if (payment.serviceType === ServiceType.AGENT_TOP_UP) {
        // Extract transaction ID from metadata
        const transactionId = payment.metadata?.transactionId || payment.transactionId;

        this.logger.log(
          `🔄 Automatically triggering SAS top-up for payment: ${payment.id}`,
        );

        try {
          // SECURITY: Automatic SAS wallet top-up triggered by webhook only
          await this.agentsService.completeTopUp(
            payment.id,
            payment.agentId,
            payment.amount,
            transactionId,
          );

          // Mark payment as processed
          await this.prisma.paymentTransaction.update({
            where: { id: payment.id },
            data: {
              metadata: {
                ...((payment.metadata as any) || {}),
                topUpCompleted: true,
                topUpCompletedAt: new Date().toISOString(),
                processedBy: 'webhook',
              },
            },
          });

          this.logger.log(
            `✅ SAS top-up completed successfully for payment: ${payment.id}`,
          );
        } catch (topUpError: any) {
          this.logger.error(
            `❌ Failed to complete SAS top-up for payment ${payment.id}: ${topUpError.message}`,
          );

          // Mark payment with top-up error but keep payment status as completed
          await this.prisma.paymentTransaction.update({
            where: { id: payment.id },
            data: {
              metadata: {
                ...((payment.metadata as any) || {}),
                topUpError: topUpError.message,
                topUpAttemptedAt: new Date().toISOString(),
              },
            },
          });

          throw topUpError;
        }
      }

      // Audit log
      await this.auditService.log({
        agentId: payment.agentId,
        action: 'payment.completed',
        entity: 'PaymentTransaction',
        entityId: payment.id,
        newValue: {
          status: PaymentStatus.COMPLETED,
          amount: payment.amount,
          serviceType: payment.serviceType,
        },
        ipAddress: 'system',
        userAgent: 'webhook',
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to process successful payment: ${error.message}`,
      );
    }
  }

  /**
   * Find payment by ID
   */
  async findPaymentById(paymentId: string) {
    return this.prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
    });
  }

  /**
   * Mark payment as having completed the top-up process
   */
  async markTopUpAsCompleted(paymentId: string) {
    return this.prisma.paymentTransaction.update({
      where: { id: paymentId },
      data: {
        metadata: {
          topUpCompleted: true,
          topUpCompletedAt: new Date().toISOString(),
        },
      },
    });
  }

  private mapToResponseDto(payment: any): PaymentResponseDto {
    return {
      id: payment.id,
      transactionId: payment.transactionId,
      referenceId: payment.referenceId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      serviceType: payment.serviceType,
      gatewayUrl: payment.gatewayUrl,
      createdAt: payment.createdAt,
      processedAt: payment.processedAt,
      failureReason: payment.failureReason,
    };
  }
}
