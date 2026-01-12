import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class ActivateUserDto {
  @ApiProperty({ 
    example: 4278, 
    description: 'User ID to activate' 
  })
  @IsInt()
  user_id: number;

  @ApiProperty({ 
    example: 'Activation for customer', 
    description: 'Optional comments',
    required: false 
  })
  @IsOptional()
  @IsString()
  comments?: string;
}

export class ActivationDataResponseDto {
  @ApiProperty({ example: 'aa', description: 'Username' })
  username: string;

  @ApiProperty({ example: 'MM', description: 'Profile name' })
  profile_name: string;

  @ApiProperty({ example: 221, description: 'Profile ID' })
  profile_id: number;

  @ApiProperty({ example: 224, description: 'Parent ID' })
  parent_id: number;

  @ApiProperty({ example: 'IQD -36,750.00', description: 'Manager balance' })
  manager_balance: string;

  @ApiProperty({ example: 'IQD 0.00', description: 'User balance' })
  user_balance: string;

  @ApiProperty({ example: '2026-04-11 10:37:56', description: 'User expiration' })
  user_expiration: string;

  @ApiProperty({ example: 'IQD 250.00', description: 'Unit price' })
  unit_price: string;

  @ApiProperty({ example: 250, description: 'User price (numeric)' })
  user_price: number;

  @ApiProperty({ example: '30 day(s)', description: 'Profile duration' })
  profile_duration: string;

  @ApiProperty({ example: '0 B', description: 'Profile traffic' })
  profile_traffic: string;

  @ApiProperty({ example: '0 B', description: 'Profile download traffic' })
  profile_dl_traffic: string;

  @ApiProperty({ example: '0 B', description: 'Profile upload traffic' })
  profile_ul_traffic: string;

  @ApiProperty({ example: null, description: 'Profile description' })
  profile_description: string | null;

  @ApiProperty({ example: 'IQD 0.00', description: 'VAT' })
  vat: string;

  @ApiProperty({ example: 1, description: 'Units' })
  units: number;

  @ApiProperty({ example: 'IQD 250.00', description: 'Required amount' })
  required_amount: string;

  @ApiProperty({ example: 250, description: 'Required amount (numeric)' })
  n_required_amount: number;

  @ApiProperty({ example: 0, description: 'Reward points' })
  reward_points: number;

  @ApiProperty({ example: 0, description: 'Required points' })
  required_points: number;

  @ApiProperty({ example: 0, description: 'Reward points balance' })
  reward_points_balance: number;
}

export class ActivateUserResponseDto {
  @ApiProperty({ example: '42920871-3242-760b-3f28-887b644a012c', description: 'Transaction ID' })
  transaction_id: string;

  @ApiProperty({ example: 4278, description: 'User ID' })
  user_id: number;

  @ApiProperty({ example: 250, description: 'Amount charged' })
  amount: number;

  @ApiProperty({ example: 'User activated successfully', description: 'Activation message' })
  message: string;

  @ApiProperty({ description: 'Raw SAS response data' })
  activationResult: any;
}
