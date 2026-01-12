import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions, AllowUserTypes } from '../common/decorators/auth.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import {
  CreatePaymentResponseDto,
  PaymentStatusResponseDto,
  PaymentResponseDto,
} from './dto/payment-response.dto';
import { I18nService } from 'nestjs-i18n';

@ApiTags('Payment')
@Controller('payment')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly i18n: I18nService,
  ) {}

  @Post()
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'إنشاء عملية دفع جديدة | Create new payment',
    description: 'إنشاء عملية دفع جديدة للوكيل | Create a new payment for agent (Agents only)',
  })
  @ApiResponse({
    status: 201,
    description: 'تم إنشاء عملية الدفع بنجاح | Payment created successfully',
    type: CreatePaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'بيانات غير صحيحة | Invalid input',
  })
  @ApiResponse({
    status: 401,
    description: 'غير مصرح | Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'محظور - الوصول للوكلاء فقط | Forbidden - Agents only',
  })
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: any,
  ): Promise<CreatePaymentResponseDto> {
    // Extract agent info from JWT (agent tokens use agentId/agentUsername)
    const agentId = req.user.agentId;
    const agentUsername = req.user.agentUsername;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const payment = await this.paymentService.createPayment(
      agentId,
      agentUsername,
      createPaymentDto,
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      message: this.i18n.t('payment.messages.created'),
      data: payment,
    };
  }

  @Get(':id')
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'الحصول على تفاصيل عملية دفع | Get payment details',
    description: 'الحصول على تفاصيل عملية دفع محددة | Get details of a specific payment',
  })
  @ApiParam({
    name: 'id',
    description: 'معرف عملية الدفع | Payment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'تم الحصول على بيانات عملية الدفع بنجاح | Payment retrieved successfully',
    type: PaymentStatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'عملية الدفع غير موجودة | Payment not found',
  })
  async getPayment(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<PaymentStatusResponseDto> {
    const agentId = req.user.agentId;

    const payment = await this.paymentService.getPaymentById(id, agentId);

    return {
      success: true,
      message: this.i18n.t('payment.messages.retrieved'),
      data: payment,
    };
  }

  @Get()
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'الحصول على قائمة عمليات الدفع للوكيل | Get agent payments list',
    description: 'الحصول على قائمة جميع عمليات الدفع للوكيل | Get list of all payments for the agent',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'عدد السجلات المراد تخطيها | Number of records to skip',
    example: 0,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'عدد السجلات المراد عرضها | Number of records to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'تم الحصول على قائمة عمليات الدفع بنجاح | Payments list retrieved successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/PaymentResponseDto' },
        },
        total: { type: 'number', example: 50 },
      },
    },
  })
  async getAgentPayments(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Req() req: any,
  ) {
    const agentId = req.user.agentId;
    const skipNum = parseInt(skip, 10);
    const takeNum = parseInt(take, 10);

    const result = await this.paymentService.getAgentPayments(
      agentId,
      skipNum,
      takeNum,
    );

    return {
      success: true,
      message: this.i18n.t('payment.messages.listRetrieved'),
      data: result.data,
      total: result.total,
    };
  }

  @Get(':id/status')
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'التحقق من حالة عملية دفع | Check payment status',
    description: 'التحقق من حالة عملية دفع محددة | Check the status of a specific payment',
  })
  @ApiParam({
    name: 'id',
    description: 'معرف عملية الدفع | Payment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'تم التحقق من حالة عملية الدفع بنجاح | Payment status checked successfully',
    type: PaymentStatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'عملية الدفع غير موجودة | Payment not found',
  })
  async checkPaymentStatus(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<PaymentStatusResponseDto> {
    const agentId = req.user.agentId;

    const payment = await this.paymentService.checkPaymentStatus(id, agentId);

    return {
      success: true,
      message: this.i18n.t('payment.messages.statusRetrieved'),
      data: payment,
    };
  }

  @Post(':id/refund')
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'استرجاع عملية دفع | Refund payment',
    description: 'استرجاع مبلغ عملية دفع محددة | Refund a specific payment',
  })
  @ApiParam({
    name: 'id',
    description: 'معرف عملية الدفع | Payment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'تم استرجاع المبلغ بنجاح | Payment refunded successfully',
    type: PaymentStatusResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'لا يمكن استرجاع هذه العملية | Cannot refund this payment',
  })
  @ApiResponse({
    status: 404,
    description: 'عملية الدفع غير موجودة | Payment not found',
  })
  async refundPayment(
    @Param('id') id: string,
    @Body() refundDto: RefundPaymentDto,
    @Req() req: any,
  ): Promise<PaymentStatusResponseDto> {
    const agentId = req.user.agentId;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const payment = await this.paymentService.refundPayment(
      id,
      agentId,
      refundDto,
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      message: this.i18n.t('payment.messages.refunded'),
      data: payment,
    };
  }

  @Post(':id/cancel')
  @AllowUserTypes('agent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'إلغاء عملية دفع | Cancel payment',
    description: 'إلغاء عملية دفع معلقة | Cancel a pending payment',
  })
  @ApiParam({
    name: 'id',
    description: 'معرف عملية الدفع | Payment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'تم إلغاء عملية الدفع بنجاح | Payment cancelled successfully',
    type: PaymentStatusResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'لا يمكن إلغاء هذه العملية | Cannot cancel this payment',
  })
  @ApiResponse({
    status: 404,
    description: 'عملية الدفع غير موجودة | Payment not found',
  })
  async cancelPayment(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<PaymentStatusResponseDto> {
    const agentId = req.user.agentId;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const payment = await this.paymentService.cancelPayment(
      id,
      agentId,
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      message: this.i18n.t('payment.messages.cancelled'),
      data: payment,
    };
  }
}
