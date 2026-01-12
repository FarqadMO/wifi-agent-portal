import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus, PaymentMethod, ServiceType } from '../enums/payment.enum';

export class PaymentResponseDto {
  @ApiProperty({
    description: 'معرف عملية الدفع | Payment transaction ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'معرف الدفع من بوابة الدفع | Gateway payment ID',
    example: 'pay_123abc',
  })
  transactionId: string;

  @ApiProperty({
    description: 'المعرف المرجعي | Reference ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  referenceId: string;

  @ApiProperty({
    description: 'المبلغ | Amount',
    example: 50.0,
  })
  amount: number;

  @ApiProperty({
    description: 'العملة | Currency',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    description: 'حالة الدفع | Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'طريقة الدفع | Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.QI_CARD,
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'نوع الخدمة | Service type',
    enum: ServiceType,
    example: ServiceType.AGENT_TOP_UP,
  })
  serviceType: ServiceType;

  @ApiProperty({
    description: 'رابط بوابة الدفع | Gateway URL for payment',
    example: 'https://payment.gateway.com/pay/123abc',
    required: false,
  })
  gatewayUrl?: string;

  @ApiProperty({
    description: 'تاريخ الإنشاء | Created at',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'تاريخ المعالجة | Processed at',
    required: false,
  })
  processedAt?: Date;

  @ApiProperty({
    description: 'سبب الفشل | Failure reason',
    required: false,
  })
  failureReason?: string;
}

export class CreatePaymentResponseDto {
  @ApiProperty({
    description: 'هل تمت العملية بنجاح | Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'الرسالة | Message',
    example: 'عملية الدفع تم إنشاؤها بنجاح | Payment created successfully',
  })
  message: string;

  @ApiProperty({
    description: 'بيانات عملية الدفع | Payment data',
    type: PaymentResponseDto,
  })
  data: PaymentResponseDto;
}

export class PaymentStatusResponseDto {
  @ApiProperty({
    description: 'هل تمت العملية بنجاح | Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'الرسالة | Message',
    example: 'حالة الدفع تم استرجاعها بنجاح | Payment status retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'بيانات عملية الدفع | Payment data',
    type: PaymentResponseDto,
  })
  data: PaymentResponseDto;
}
