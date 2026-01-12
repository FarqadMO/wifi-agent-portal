import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsEmail,
  IsIn,
  Min,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Username (login name)', example: 'user123' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ description: 'Enable/disable user login', example: 1, enum: [0, 1] })
  @IsInt()
  @IsIn([0, 1])
  enabled: number;

  @ApiProperty({ description: 'Login password', example: '1111' })
  @IsString()
  @MinLength(4)
  password: string;

  @ApiProperty({ description: 'Confirm password', example: '1111' })
  @IsString()
  @MinLength(4)
  confirm_password: string;

  @ApiProperty({ description: 'Profile ID', example: 1 })
  @IsInt()
  @Min(1)
  profile_id: number;

  @ApiProperty({ description: 'Parent manager ID', example: 2 })
  @IsInt()
  @Min(1)
  parent_id: number;

  @ApiProperty({ description: 'Site ID', example: 0 })
  @IsInt()
  site_id: number;

  @ApiPropertyOptional({ description: 'MAC authentication', example: 0, enum: [0, 1] })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  mac_auth?: number;

  @ApiPropertyOptional({ description: 'Allowed MAC addresses', example: null })
  @IsOptional()
  @IsString()
  allowed_macs?: string | null;

  @ApiPropertyOptional({ description: 'First name', example: 'Ahmed' })
  @IsOptional()
  @IsString()
  firstname?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Ali' })
  @IsOptional()
  @IsString()
  lastname?: string;

  @ApiPropertyOptional({ description: 'Company name', example: 'ABC Corp' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+9647XXXXXXXXX' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Baghdad' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Address', example: '123 Street' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Apartment', example: 'Apt 5' })
  @IsOptional()
  @IsString()
  apartment?: string;

  @ApiPropertyOptional({ description: 'Street', example: 'Main Street' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ description: 'Contract ID', example: 'CNT-001' })
  @IsOptional()
  @IsString()
  contract_id?: string;

  @ApiPropertyOptional({ description: 'National ID', example: 'ID-123456' })
  @IsOptional()
  @IsString()
  national_id?: string;

  @ApiPropertyOptional({ description: 'Notes', example: 'VIP customer' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Expiration date', example: '2024-12-31 23:59:59' })
  @IsOptional()
  @IsString()
  expiration?: string;

  @ApiPropertyOptional({ description: 'Simultaneous sessions allowed', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  simultaneous_sessions?: number;

  @ApiPropertyOptional({ description: 'Static IP address', example: '192.168.1.100' })
  @IsOptional()
  @IsString()
  static_ip?: string;

  @ApiPropertyOptional({ description: 'MikroTik WinBox group', example: null })
  @IsOptional()
  @IsString()
  mikrotik_winbox_group?: string | null;

  @ApiPropertyOptional({ description: 'MikroTik framed route', example: null })
  @IsOptional()
  @IsString()
  mikrotik_framed_route?: string | null;

  @ApiPropertyOptional({ description: 'MikroTik address list', example: null })
  @IsOptional()
  @IsString()
  mikrotik_addresslist?: string | null;

  @ApiPropertyOptional({ description: 'MikroTik IPv6 prefix', example: null })
  @IsOptional()
  @IsString()
  mikrotik_ipv6_prefix?: string | null;

  @ApiPropertyOptional({ description: 'Auto renew', example: 0, enum: [0, 1] })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  auto_renew?: number;

  @ApiPropertyOptional({ description: 'User type', example: '0' })
  @IsOptional()
  @IsString()
  user_type?: string;
}

export class CreateUserResponseDto {
  @ApiProperty({ description: 'Created user ID', example: 123 })
  id: number;

  @ApiProperty({ description: 'Success message', example: 'User created successfully' })
  message: string;
}
