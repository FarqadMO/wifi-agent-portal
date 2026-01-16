import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/decorators/auth.decorator';
import { PaymentService } from '../payment.service';
import { QiCardGatewayService } from './qi-card-gateway.service';
import { I18nService } from 'nestjs-i18n';
import type { Request, Response } from 'express';

@ApiTags('QiCard Webhook')
@Controller('payment/qi-card')
export class QiCardWebhookController {
  private readonly logger = new Logger(QiCardWebhookController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly qiCardGateway: QiCardGatewayService,
    private readonly i18n: I18nService,
  ) {}

  @Get('callback')
  @Public()
  @ApiOperation({
    summary: 'QiCard Callback Handler | معالج العودة من QiCard',
    description:
      'يتم استدعاؤه عندما يعود المستخدم من بوابة الدفع | Called when user returns from payment gateway',
  })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Callback token for verification',
  })
  @ApiQuery({
    name: 'paymentId',
    required: false,
    description: 'Payment ID from gateway',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Payment status',
  })
  @ApiResponse({
    status: 200,
    description: 'Callback processed successfully',
  })
  async handleCallback(
    @Query('token') token: string,
    @Query('paymentId') paymentId: string,
    @Query('status') status: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Verify callback token
      const expectedToken = process.env.QI_CALLBACK_TOKEN;
      if (token !== expectedToken) {
        this.logger.warn('Invalid callback token received');
        res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
        return;
      }

      this.logger.log(`QiCard callback received for payment: ${paymentId}`);

      if (!paymentId) {
        res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
        return;
      }

      // Get payment details
      const payment = await this.paymentService.getPaymentByTransactionId(
        paymentId,
      );

      // Check current payment status from gateway to ensure we have latest status
      if (payment.status === 'pending') {
        this.logger.log(
          `Payment still pending, checking status with QiCard: ${paymentId}`,
        );
        
        try {
          // Get fresh status from QiCard
          const statusResult = await this.qiCardGateway.getPaymentStatus(paymentId);
          
          if (statusResult.success && statusResult.status !== payment.status) {
            this.logger.log(
              `Status updated from QiCard: ${payment.status} -> ${statusResult.status}`,
            );
            
            // Process the webhook to update payment and trigger top-up if successful
            await this.paymentService.processWebhook(paymentId, {
              paymentId: paymentId,
              status: statusResult.status === 'completed' ? 'SUCCESS' : statusResult.status.toUpperCase(),
              amount: statusResult.amount,
              currency: statusResult.currency,
              details: statusResult.details,
            });
            
            // Get updated payment
            const updatedPayment = await this.paymentService.getPaymentByTransactionId(paymentId);
            
            // Redirect based on updated status
            if (updatedPayment.status === 'completed') {
              res.redirect(
                `${process.env.FRONTEND_URL}/payment/success?paymentId=${updatedPayment.id}`,
              );
              return;
            } else if (updatedPayment.status === 'failed') {
              res.redirect(
                `${process.env.FRONTEND_URL}/payment/failed?paymentId=${updatedPayment.id}`,
              );
              return;
            }
          }
        } catch (statusError: any) {
          this.logger.error(`Failed to check payment status: ${statusError.message}`);
          // Continue with existing status
        }
      }

      // Redirect based on current status
      if (status === 'SUCCESS' || payment.status === 'completed') {
        res.redirect(
          `${process.env.FRONTEND_URL}/payment/success?paymentId=${payment.id}`,
        );
      } else if (status === 'FAILED' || payment.status === 'failed') {
        res.redirect(
          `${process.env.FRONTEND_URL}/payment/failed?paymentId=${payment.id}`,
        );
      } else {
        res.redirect(
          `${process.env.FRONTEND_URL}/payment/pending?paymentId=${payment.id}`,
        );
      }
    } catch (error: any) {
      this.logger.error(`Callback processing error: ${error.message}`);
      res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
    }
  }

  @Post('notification')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'QiCard Notification Webhook | إشعار من QiCard',
    description:
      'يتم استدعاؤه من قبل QiCard لإرسال حالة الدفع | Called by QiCard to send payment status',
  })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Notification token for verification',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Notification processed successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature or token',
  })
  async handleNotification(
    @Query('token') token: string,
    @Body() payload: any,
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify notification token
      const expectedToken = process.env.QI_CALLBACK_TOKEN;
      if (token !== expectedToken) {
        this.logger.warn('Invalid notification token received');
        throw new BadRequestException('Invalid token');
      }

      this.logger.log(
        `QiCard notification webhook received for payment: ${payload.paymentId} with status: ${payload.status}`,
      );

      // Get signature from headers
      const signature = req.headers['x-signature'] as string;

      if (!signature) {
        this.logger.warn('No signature in notification headers');
        throw new BadRequestException('Missing signature');
      }

      // Verify signature
      const rawBody = JSON.stringify(payload);
      const isValid = await this.qiCardGateway.verifyWebhookSignature(
        rawBody,
        signature,
      );

      if (!isValid) {
        this.logger.warn('Invalid signature in notification');
        throw new BadRequestException('Invalid signature');
      }

      // Process notification webhook - this will update payment status and trigger agent wallet top-up if successful
      await this.paymentService.processWebhook(payload.paymentId, payload);

      this.logger.log(
        `✅ QiCard notification processed successfully for: ${payload.paymentId}`,
      );

      return {
        success: true,
        message: 'Notification processed successfully',
      };
    } catch (error: any) {
      this.logger.error(`❌ Notification processing error: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  @Get('status')
  @ApiOperation({
    summary: 'Check QiCard payment status | التحقق من حالة دفع QiCard',
    description: 'التحقق من حالة الدفع من QiCard مباشرة | Check payment status directly from QiCard',
  })
  @ApiQuery({
    name: 'paymentId',
    required: true,
    description: 'Payment ID from gateway',
  })
  @ApiResponse({
    status: 200,
    description: 'Status retrieved successfully',
  })
  async checkStatus(@Query('paymentId') paymentId: string) {
    try {
      const result = await this.qiCardGateway.getPaymentStatus(paymentId);

      return {
        success: result.success,
        message: result.success
          ? 'Status retrieved successfully'
          : 'Failed to retrieve status',
        data: result,
      };
    } catch (error: any) {
      this.logger.error(`Status check error: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }
}
