import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDetailDto {
  @ApiProperty({ description: 'User ID', example: 123 })
  id: number;

  @ApiProperty({ description: 'Username', example: 'user123' })
  username: string;

  @ApiProperty({ description: 'Enabled status', example: 1 })
  enabled: number;

  @ApiPropertyOptional({ description: 'First name', example: 'Ahmed' })
  firstname?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Ali' })
  lastname?: string;

  @ApiPropertyOptional({ description: 'Company', example: 'ABC Corp' })
  company?: string;

  @ApiPropertyOptional({ description: 'Email', example: 'user@example.com' })
  email?: string;

  @ApiPropertyOptional({ description: 'Phone', example: '+9647XXXXXXXXX' })
  phone?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Baghdad' })
  city?: string;

  @ApiPropertyOptional({ description: 'Address', example: '123 Street' })
  address?: string;

  @ApiPropertyOptional({ description: 'Expiration date', example: '2024-12-31 23:59:59' })
  expiration?: string;

  @ApiPropertyOptional({ description: 'Profile ID', example: 1 })
  profile_id?: number;

  @ApiPropertyOptional({ description: 'Profile name', example: 'Gold Package' })
  profile_name?: string;

  @ApiPropertyOptional({ description: 'Balance', example: 50000 })
  balance?: number;

  @ApiPropertyOptional({ description: 'Traffic limit', example: '100GB' })
  traffic?: string;

  @ApiPropertyOptional({ description: 'Used traffic', example: '25GB' })
  used_traffic?: string;

  @ApiPropertyOptional({ description: 'Simultaneous sessions', example: 1 })
  simultaneous_sessions?: number;

  @ApiPropertyOptional({ description: 'Static IP', example: '192.168.1.100' })
  static_ip?: string;

  @ApiPropertyOptional({ description: 'MAC authentication', example: 0 })
  mac_auth?: number;

  @ApiPropertyOptional({ description: 'Allowed MACs', example: null })
  allowed_macs?: string | null;

  @ApiPropertyOptional({ description: 'Auto renew', example: 0 })
  auto_renew?: number;

  @ApiPropertyOptional({ description: 'Parent ID', example: 2 })
  parent_id?: number;

  @ApiPropertyOptional({ description: 'Parent username', example: 'admin' })
  parent_username?: string;

  @ApiPropertyOptional({ description: 'Site ID', example: 0 })
  site_id?: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'VIP customer' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Contract ID', example: 'CNT-001' })
  contract_id?: string;

  @ApiPropertyOptional({ description: 'National ID', example: 'ID-123456' })
  national_id?: string;

  @ApiPropertyOptional({ description: 'Last online', example: '2024-01-08 10:30:00' })
  last_online?: string;

  @ApiPropertyOptional({ description: 'Created at', example: '2024-01-01 00:00:00' })
  created_at?: string;

  @ApiPropertyOptional({ description: 'Updated at', example: '2024-01-08 12:00:00' })
  updated_at?: string;
}
