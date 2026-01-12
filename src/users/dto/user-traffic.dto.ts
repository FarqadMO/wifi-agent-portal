import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsEnum, Min, Max } from 'class-validator';

export enum ReportType {
  DAILY = 'daily',
  MONTHLY = 'monthly',
}

export class GetUserTrafficDto {
  @ApiProperty({ 
    example: 4278, 
    description: 'User ID' 
  })
  @IsInt()
  user_id: number;

  @ApiProperty({ 
    example: 'daily',
    enum: ReportType,
    description: 'Report type: daily (detailed daily breakdown) or monthly (monthly summary)'
  })
  @IsEnum(ReportType)
  report_type: ReportType;

  @ApiProperty({ 
    example: 1, 
    description: 'Month (1-12)' 
  })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ 
    example: 2026, 
    description: 'Year' 
  })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}

export class UserTrafficResponseDto {
  @ApiProperty({ example: 4278, description: 'User ID' })
  user_id: number;

  @ApiProperty({ example: 'daily', description: 'Report type' })
  report_type: string;

  @ApiProperty({ example: 1, description: 'Month' })
  month: number;

  @ApiProperty({ example: 2026, description: 'Year' })
  year: number;

  @ApiProperty({ description: 'Traffic data from SAS' })
  trafficData: any;
}
