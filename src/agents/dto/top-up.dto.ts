import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';
import { PaymentMethod } from '../../payment/enums/payment.enum';

export class TopUpDto {
  @ApiProperty({
    description: 'المبلغ المراد شحنه | Amount to top up',
    example: 10000,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'طريقة الدفع | Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.QI_CARD,
    required: false,
    default: PaymentMethod.QI_CARD,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod = PaymentMethod.QI_CARD;
}

export class TopUpResponseDto {
  @ApiProperty({ 
    description: 'معرف المعاملة | Transaction ID',
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  transactionId: string;

  @ApiProperty({ 
    description: 'معرف عملية الدفع | Payment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  paymentId?: string;

  @ApiProperty({ 
    description: 'المبلغ | Amount',
    example: 10000 
  })
  amount: number;

  @ApiProperty({ 
    description: 'الرصيد السابق | Previous balance',
    example: 40000,
    required: false,
  })
  previousBalance?: number;

  @ApiProperty({ 
    description: 'الرصيد الجديد | New balance',
    example: 50000,
    required: false,
  })
  newBalance?: number;

  @ApiProperty({ 
    description: 'طريقة الدفع | Payment method',
    example: 'qi_card',
    required: false,
  })
  paymentMethod?: string;

  @ApiProperty({ 
    description: 'حالة الدفع | Payment status',
    example: 'pending',
    required: false,
  })
  paymentStatus?: string;

  @ApiProperty({ 
    description: 'رابط بوابة الدفع | Gateway URL',
    example: 'https://payment.gateway.com/pay/123abc',
    required: false,
  })
  gatewayUrl?: string;

  @ApiProperty({ 
    description: 'رسالة | Message',
    example: 'يرجى إكمال عملية الدفع | Please complete the payment process',
    required: false,
  })
  message?: string;

  @ApiProperty({ 
    description: 'نتيجة الشحن من SAS | Top-up result from SAS',
    example: { status: 'success' },
    required: false,
  })
  topUpResult?: any;
}
