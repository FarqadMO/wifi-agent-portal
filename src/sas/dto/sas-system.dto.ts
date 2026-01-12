import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsEnum, IsOptional, IsUrl } from 'class-validator';

export enum SasGroupDto {
  WIFI = 'WIFI',
  FTTH = 'FTTH',
}

export class CreateSasSystemDto {
  @ApiProperty({ example: 'SAS System 1', description: 'Name of the SAS system' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'https://demo.sasradius.com', description: 'Base URL of the SAS system' })
  @IsUrl()
  @IsNotEmpty()
  baseUrl: string;

  @ApiProperty({ example: 'admin', description: 'Admin username for SAS integration' })
  @IsString()
  @IsNotEmpty()
  adminUsername: string;

  @ApiProperty({ example: 'adminPassword123', description: 'Admin password (will be encrypted)' })
  @IsString()
  @IsNotEmpty()
  adminPassword: string;

  @ApiProperty({ example: true, description: 'Enable SSL for HTTPS connections' })
  @IsBoolean()
  @IsOptional()
  sslEnabled?: boolean = true;

  @ApiProperty({ enum: SasGroupDto, example: SasGroupDto.WIFI, description: 'SAS group type' })
  @IsEnum(SasGroupDto)
  @IsOptional()
  group?: SasGroupDto = SasGroupDto.WIFI;
}

export class UpdateSasSystemDto {
  @ApiProperty({ example: 'SAS System 1 Updated', description: 'Name of the SAS system', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'https://demo.sasradius.com', description: 'Base URL of the SAS system', required: false })
  @IsUrl()
  @IsOptional()
  baseUrl?: string;

  @ApiProperty({ example: 'admin', description: 'Admin username for SAS integration', required: false })
  @IsString()
  @IsOptional()
  adminUsername?: string;

  @ApiProperty({ example: 'newPassword123', description: 'Admin password (will be encrypted)', required: false })
  @IsString()
  @IsOptional()
  adminPassword?: string;

  @ApiProperty({ example: true, description: 'Enable SSL for HTTPS connections', required: false })
  @IsBoolean()
  @IsOptional()
  sslEnabled?: boolean;

  @ApiProperty({ enum: SasGroupDto, example: SasGroupDto.WIFI, description: 'SAS group type', required: false })
  @IsEnum(SasGroupDto)
  @IsOptional()
  group?: SasGroupDto;
}

export class SasSystemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  baseUrl: string;

  @ApiProperty()
  adminUsername: string;

  @ApiProperty()
  sslEnabled: boolean;

  @ApiProperty({ enum: ['WIFI', 'FTTH'] })
  group: string;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'] })
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
