import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../enums/payment.enum';

export class PaymentStatusDto {
  @ApiProperty({
    description: 'معرف الدفع | Payment ID',
    example: 'pay_123abc',
  })
  paymentId: string;

  @ApiProperty({
    description: 'حالة الدفع | Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.COMPLETED,
  })
  status: PaymentStatus;

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
