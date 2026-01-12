import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ManagerInfoDto {
  @ApiProperty({ description: 'Manager ID', example: 224 })
  id: number;

  @ApiProperty({ description: 'Username', example: 'E.PAY' })
  username: string;

  @ApiProperty({ description: 'Enabled status', example: 1 })
  enabled: number;

  @ApiPropertyOptional({ description: 'City', example: 'Baghdad' })
  city?: string | null;

  @ApiPropertyOptional({ description: 'Country', example: 'Iraq' })
  country?: string | null;

  @ApiPropertyOptional({ description: 'First name', example: 'Ahmed' })
  firstname?: string | null;

  @ApiPropertyOptional({ description: 'Last name', example: 'Ali' })
  lastname?: string | null;

  @ApiPropertyOptional({ description: 'Email', example: 'manager@example.com' })
  email?: string | null;

  @ApiPropertyOptional({ description: 'Phone', example: '+9647XXXXXXXXX' })
  phone?: string | null;

  @ApiPropertyOptional({ description: 'Company', example: 'ABC Corp' })
  company?: string | null;

  @ApiPropertyOptional({ description: 'Address', example: '123 Street' })
  address?: string | null;

  @ApiProperty({ description: 'Balance', example: 15000 })
  balance: number;

  @ApiPropertyOptional({ description: 'Loan balance', example: null })
  loan_balance?: number | null;

  @ApiProperty({ description: 'Debt limit', example: '0.000' })
  debt_limit: string;

  @ApiPropertyOptional({ description: 'Subscriber suffix', example: null })
  subscriber_suffix?: string | null;

  @ApiPropertyOptional({ description: 'Subscriber prefix', example: null })
  subscriber_prefix?: string | null;

  @ApiPropertyOptional({ description: 'Notes', example: null })
  notes?: string | null;

  @ApiPropertyOptional({ description: 'Manager ID', example: null })
  manager_id?: number | null;

  @ApiPropertyOptional({ description: 'Max users', example: 0 })
  max_users?: number;

  @ApiProperty({ description: 'Created at', example: '2024-12-05 14:14:12' })
  created_at: string;

  @ApiPropertyOptional({ description: 'Deleted at', example: null })
  deleted_at?: string | null;

  @ApiProperty({ description: 'ACL group ID', example: 35 })
  acl_group_id: number;

  @ApiPropertyOptional({ description: 'Site ID', example: null })
  site_id?: number | null;

  @ApiPropertyOptional({ description: 'Avatar', example: null })
  avatar?: string | null;

  @ApiProperty({ description: 'Parent ID', example: 1 })
  parent_id: number;

  @ApiProperty({ description: 'Created by', example: 110 })
  created_by: number;

  @ApiProperty({ description: 'Reward points', example: 0 })
  reward_points: number;

  @ApiProperty({ description: 'Discount rate', example: '0.00' })
  discount_rate: string;

  @ApiPropertyOptional({ description: 'Admin notes', example: null })
  admin_notes?: string | null;

  @ApiProperty({ description: 'Requires 2FA', example: 0 })
  requires_2fa: number;

  @ApiProperty({ description: 'Force change password', example: 0 })
  force_change_password: number;

  @ApiProperty({ description: 'Allowed NASes', type: [String], example: [] })
  allowed_nases: string[];
}

export class ManagerInfoResponseDto {
  @ApiProperty({ description: 'Status code', example: 200 })
  status: number;

  @ApiProperty({ description: 'Manager data', type: ManagerInfoDto })
  data: ManagerInfoDto;
}
