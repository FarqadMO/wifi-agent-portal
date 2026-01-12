import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({
    description: 'المبلغ المراد استرجاعه | Amount to refund',
    example: 50.0,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description: 'سبب الاسترجاع | Refund reason',
    example: 'Customer requested refund',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
