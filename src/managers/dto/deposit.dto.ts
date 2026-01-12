import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, IsBoolean, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DepositDto {
  @ApiProperty({ description: 'Target manager ID to deposit to', example: 224 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  manager_id: number;

  @ApiProperty({ description: 'Amount to deposit', example: 1000, minimum: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ description: 'Comment/note for the transaction', example: 'Monthly deposit' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ description: 'Is this a loan transaction', example: false })
  @IsBoolean()
  is_loan: boolean;
}

export class DepositResponseDto {
  @ApiProperty({ description: 'Status code', example: 200 })
  status: number;

  @ApiProperty({ description: 'Success message', example: 'Deposit successful' })
  message: string;

  @ApiProperty({ description: 'Transaction ID', example: '3065926f-e578-817a-e22c-1640e3f7f88f' })
  transaction_id: string;

  @ApiProperty({ description: 'New balance of depositor', example: 14000 })
  new_balance: number;

  @ApiProperty({ description: 'Target manager new balance', example: 16000 })
  target_balance: number;
}
