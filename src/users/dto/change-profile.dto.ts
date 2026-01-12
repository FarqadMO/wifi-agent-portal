import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsEnum } from 'class-validator';

export enum ChangeType {
  SCHEDULE = 'schedule',
  IMMEDIATE = 'immediate',
}

export class ChangeProfileDto {
  @ApiProperty({ 
    example: 4278, 
    description: 'User ID' 
  })
  @IsInt()
  user_id: number;

  @ApiProperty({ 
    example: 220, 
    description: 'Profile ID to change to' 
  })
  @IsInt()
  profile_id: number;

  @ApiProperty({ 
    example: 'schedule',
    enum: ChangeType,
    description: 'Change type: schedule (applies at next expiration) or immediate (applies now)'
  })
  @IsEnum(ChangeType)
  change_type: ChangeType;
}

export class ChangeProfileResponseDto {
  @ApiProperty({ example: '42920871-3242-760b-3f28-887b644a012c', description: 'Transaction ID' })
  transaction_id: string;

  @ApiProperty({ example: 4278, description: 'User ID' })
  user_id: number;

  @ApiProperty({ example: 220, description: 'New profile ID' })
  profile_id: number;

  @ApiProperty({ example: 'schedule', description: 'Change type applied' })
  change_type: string;

  @ApiProperty({ example: 'Profile changed successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ description: 'Raw SAS response data' })
  changeResult: any;
}
