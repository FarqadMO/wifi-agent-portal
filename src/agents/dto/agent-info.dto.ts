import { ApiProperty } from '@nestjs/swagger';

export class AgentClientInfoDto {
  @ApiProperty({ description: 'User ID in SAS', example: 229 })
  id: number;

  @ApiProperty({ description: 'Account balance', example: 15000 })
  balance: number;

  @ApiProperty({ description: 'City', example: 'Baghdad', nullable: true })
  city: string | null;

  @ApiProperty({ description: 'First name', example: 'Ahmed' })
  firstname: string;

  @ApiProperty({ description: 'Last name', example: 'Ali' })
  lastname: string;

  @ApiProperty({ description: 'Email address', example: 'agent@example.com', nullable: true })
  email: string | null;

  @ApiProperty({ description: 'Force password change flag', example: 0 })
  force_change_password: number;

  @ApiProperty({ description: 'Phone number', example: '+9647XXXXXXXXX', nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'Reward points', example: 100 })
  reward_points: number;

  @ApiProperty({ description: 'Username', example: 'farqad' })
  username: string;

  @ApiProperty({ description: 'Requires 2FA flag', example: 0 })
  requires_2fa: number;

  @ApiProperty({ description: 'Country', example: 'Iraq', nullable: true })
  country: string | null;

  @ApiProperty({ description: 'Avatar data', example: '' })
  avatar_data: string;
}

export class AgentInfoResponseDto {
  @ApiProperty({ description: 'Response status', example: 200 })
  status: number;

  @ApiProperty({ description: 'Client information', type: AgentClientInfoDto })
  client: AgentClientInfoDto;

  @ApiProperty({
    description: 'User permissions in SAS',
    type: [String],
    example: ['prm_any', 'prm_users_index', 'prm_cards_index'],
  })
  permissions: string[];

  @ApiProperty({
    description: 'Enabled features',
    type: [String],
    example: ['freezone'],
  })
  features: string[];

  @ApiProperty({ description: 'License status', example: '1' })
  license_status: string;

  @ApiProperty({ description: 'License expiration date', example: '2027-01-03 12:56:16' })
  license_expiration: string;

  @ApiProperty({ description: 'MU value', example: '50' })
  mu: string;
}
