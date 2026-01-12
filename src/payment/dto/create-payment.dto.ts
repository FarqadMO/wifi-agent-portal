import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsEnum, IsOptional, IsObject, Min } from 'class-validator';
import { ServiceType, PaymentMethod } from '../enums/payment.enum';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'المبلغ المراد دفعه | Amount to be paid',
    example: 50.0,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'نوع الخدمة | Service type',
    example: ServiceType.AGENT_TOP_UP,
    enum: ServiceType,
  })
  @IsNotEmpty()
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiProperty({
    description: 'طريقة الدفع | Payment method',
    example: PaymentMethod.QI_CARD,
    enum: PaymentMethod,
    default: PaymentMethod.QI_CARD,
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'بيانات إضافية | Additional metadata',
    example: { userId: '123', note: 'Top-up for agent' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
