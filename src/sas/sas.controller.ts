import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SasService } from './sas.service';
import { CreateSasSystemDto, UpdateSasSystemDto, SasSystemResponseDto } from './dto/sas-system.dto';
import { CurrentUser } from '../common/decorators/user.decorator';
import { IpAddress, UserAgent, CorrelationId } from '../common/decorators/request.decorator';
import { Permissions } from '../common/decorators/auth.decorator';

@ApiTags('SAS Systems')
@ApiBearerAuth('bearer')
@Controller('sas-systems')
export class SasController {
  constructor(private readonly sasService: SasService) {}

  @Post()
  @Permissions('sas.create')
  @ApiOperation({ summary: 'Create a new SAS system' })
  @ApiResponse({ status: 201, description: 'SAS system created successfully', type: SasSystemResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Body() createSasSystemDto: CreateSasSystemDto,
    @CurrentUser() user: any,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.sasService.create(
      createSasSystemDto,
      user.userId,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Get()
  @Permissions('sas.view')
  @ApiOperation({ summary: 'Get all SAS systems' })
  @ApiResponse({ status: 200, description: 'List of SAS systems', type: [SasSystemResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.sasService.findAll();
  }

  @Get(':id')
  @Permissions('sas.view')
  @ApiOperation({ summary: 'Get SAS system by ID' })
  @ApiResponse({ status: 200, description: 'SAS system details', type: SasSystemResponseDto })
  @ApiResponse({ status: 404, description: 'SAS system not found' })
  findOne(@Param('id') id: string) {
    return this.sasService.findOne(id);
  }

  @Patch(':id')
  @Permissions('sas.update')
  @ApiOperation({ summary: 'Update SAS system' })
  @ApiResponse({ status: 200, description: 'SAS system updated successfully', type: SasSystemResponseDto })
  @ApiResponse({ status: 404, description: 'SAS system not found' })
  update(
    @Param('id') id: string,
    @Body() updateSasSystemDto: UpdateSasSystemDto,
    @CurrentUser() user: any,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.sasService.update(
      id,
      updateSasSystemDto,
      user.userId,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Delete(':id')
  @Permissions('sas.delete')
  @ApiOperation({ summary: 'Delete SAS system' })
  @ApiResponse({ status: 200, description: 'SAS system deleted successfully' })
  @ApiResponse({ status: 404, description: 'SAS system not found' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.sasService.remove(id, user.userId, ipAddress, userAgent, correlationId);
  }
}
