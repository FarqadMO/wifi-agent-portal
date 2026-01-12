import { ApiProperty } from '@nestjs/swagger';

export class ProfileDto {
  @ApiProperty({ description: 'Profile ID', example: 222 })
  id: number;

  @ApiProperty({ description: 'Profile name', example: 'Hero Plus' })
  name: string;
}

export class ProfileListResponseDto {
  @ApiProperty({ description: 'Status code', example: 200 })
  status: number;

  @ApiProperty({ description: 'List of profiles', type: [ProfileDto] })
  data: ProfileDto[];
}
