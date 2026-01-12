import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional } from 'class-validator';

export class ManagerNodeDto {
  @ApiProperty({
    description: 'Manager ID',
    example: 209,
  })
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'Manager username',
    example: 'Ahmed.ADdDAs@s',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Parent manager ID',
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  parent_id: number | null;
}

export class ManagerTreeResponseDto {
  @ApiProperty({
    description: 'Array of manager nodes in the hierarchy tree',
    type: [ManagerNodeDto],
    example: [
      { id: 209, username: 'Ahmed.ADdDAs@s', parent_id: 1 },
      { id: 222, username: 'Ali.Kom', parent_id: 110 },
      { id: 210, username: 'AhmedLad', parent_id: 1 },
    ],
  })
  managers: ManagerNodeDto[];
}
