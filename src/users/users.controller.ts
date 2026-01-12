import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ListUsersDto } from './dto/list-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateUserResponseDto } from './dto/update-user.dto';
import { ActivateUserDto, ActivateUserResponseDto, ActivationDataResponseDto } from './dto/activate-user.dto';
import { ChangeProfileDto, ChangeProfileResponseDto } from './dto/change-profile.dto';
import { GetUserTrafficDto, UserTrafficResponseDto } from './dto/user-traffic.dto';
import { ProfileListResponseDto } from './dto/profile.dto';
import { AgentUsername } from '../common/decorators/user.decorator';
import { IpAddress, UserAgent, CorrelationId } from '../common/decorators/request.decorator';
import { AllowUserTypes } from '../common/decorators/auth.decorator';

@ApiTags('Users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('list')
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'List users with pagination and filtering',
    description:
      'Retrieve a paginated list of users from SAS Radius with advanced filtering, sorting, ' +
      'and custom column selection. This endpoint is only accessible by agents.',
  })
  @ApiResponse({
    status: 200,
    description: 'Users list retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          users: [
            {
              id: 123,
              username: 'user123',
              firstname: 'Ahmed',
              lastname: 'Ali',
              expiration: '2024-12-31 23:59:59',
              balance: 50000,
              traffic: '100GB',
            },
          ],
          total: 250,
          page: 1,
          count: 10,
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Agent only' })
  async listUsers(
    @Body() listUsersDto: ListUsersDto,
    @AgentUsername() agentUsername: string,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.usersService.listUsers(
      agentUsername,
      listUsersDto,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Post()
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user in the SAS Radius system. This endpoint is only accessible by agents.',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        data: {
          id: 123,
          message: 'User created successfully',
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Agent only' })
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @AgentUsername() agentUsername: string,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.usersService.createUser(
      agentUsername,
      createUserDto,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Get('profiles')
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'Get list of available profiles',
    description:
      'Retrieves all available profiles from SAS Radius that can be used when creating users. ' +
      'This endpoint is only accessible by agents.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profiles list retrieved successfully',
    type: ProfileListResponseDto,
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          status: 'success',
          data: [
            { id: 1, name: 'Basic Plan' },
            { id: 2, name: 'Standard Plan' },
            { id: 3, name: 'Premium Plan' },
            { id: 4, name: 'Enterprise Plan' },
          ],
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Agent only' })
  async listProfiles(
    @AgentUsername() agentUsername: string,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.usersService.listProfiles(
      agentUsername,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Get(':id/activation-data')
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'Get user activation data',
    description:
      'Retrieves activation data for a specific user including pricing and profile details. ' +
      'This data is required before activating a user. This endpoint is only accessible by agents.',
  })
  @ApiResponse({
    status: 200,
    description: 'Activation data retrieved successfully',
    type: ActivationDataResponseDto,
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          username: 'aa',
          profile_name: 'MM',
          profile_id: 221,
          parent_id: 224,
          manager_balance: 'IQD -36,750.00',
          user_balance: 'IQD 0.00',
          user_expiration: '2026-04-11 10:37:56',
          unit_price: 'IQD 250.00',
          user_price: 250,
          profile_duration: '30 day(s)',
          profile_traffic: '0 B',
          profile_dl_traffic: '0 B',
          profile_ul_traffic: '0 B',
          profile_description: null,
          vat: 'IQD 0.00',
          units: 1,
          required_amount: 'IQD 250.00',
          n_required_amount: 250,
          reward_points: 0,
          required_points: 0,
          reward_points_balance: 0,
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Agent only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserActivationData(
    @Param('id', ParseIntPipe) id: number,
    @AgentUsername() agentUsername: string,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.usersService.getUserActivationData(
      agentUsername,
      id,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Post('activate')
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'Activate a user',
    description:
      'Activates a user subscription based on their profile. The required amount is automatically ' +
      'fetched from the activation data. Agent must have sufficient balance. This endpoint is only ' +
      'accessible by agents.',
  })
  @ApiResponse({
    status: 200,
    description: 'User activated successfully',
    type: ActivateUserResponseDto,
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          transaction_id: '42920871-3242-760b-3f28-887b644a012c',
          user_id: 4278,
          amount: 250,
          message: 'User activated successfully',
          activationResult: {
            status: 200,
            message: 'User activated',
          },
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Insufficient balance or validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Agent only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async activateUser(
    @Body() activateUserDto: ActivateUserDto,
    @AgentUsername() agentUsername: string,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.usersService.activateUser(
      agentUsername,
      activateUserDto,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Post('change-profile')
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'Change user profile',
    description:
      'Changes a user profile to a different plan. Can be scheduled (applies at next expiration) or ' +
      'immediate (applies now). This endpoint is only accessible by agents.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile changed successfully',
    type: ChangeProfileResponseDto,
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          transaction_id: '42920871-3242-760b-3f28-887b644a012c',
          user_id: 4278,
          profile_id: 220,
          change_type: 'schedule',
          message: 'Profile scheduled to change',
          changeResult: {
            status: 200,
            message: 'Profile change scheduled',
          },
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Agent only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changeUserProfile(
    @Body() changeProfileDto: ChangeProfileDto,
    @AgentUsername() agentUsername: string,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.usersService.changeUserProfile(
      agentUsername,
      changeProfileDto,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Put(':id')
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'Update user data',
    description:
      'Updates user information in SAS Radius. Can update profile, personal details, settings, etc. ' +
      'Password is optional - leave null to keep current password. This endpoint is only accessible by agents.',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UpdateUserResponseDto,
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          transaction_id: '42920871-3242-760b-3f28-887b644a012c',
          user_id: 4278,
          message: 'User updated successfully',
          updateResult: {
            status: 200,
            message: 'User updated',
          },
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed or passwords do not match' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Agent only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @AgentUsername() agentUsername: string,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.usersService.updateUser(
      agentUsername,
      id,
      updateUserDto,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Post('traffic')
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'Get user traffic data',
    description:
      'Retrieves daily or monthly traffic reports for a user from SAS Radius. ' +
      'Daily report shows detailed breakdown by day, monthly shows summary by month. ' +
      'This endpoint is only accessible by agents.',
  })
  @ApiResponse({
    status: 200,
    description: 'Traffic data retrieved successfully',
    type: UserTrafficResponseDto,
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          user_id: 4278,
          report_type: 'daily',
          month: 1,
          year: 2026,
          trafficData: {
            status: 200,
            data: [
              {
                date: '2026-01-01',
                download: '1.5 GB',
                upload: '500 MB',
                total: '2 GB',
              },
              {
                date: '2026-01-02',
                download: '2 GB',
                upload: '750 MB',
                total: '2.75 GB',
              },
            ],
          },
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Agent only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserTraffic(
    @Body() getUserTrafficDto: GetUserTrafficDto,
    @AgentUsername() agentUsername: string,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.usersService.getUserTraffic(
      agentUsername,
      getUserTrafficDto,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Get(':id')
  @AllowUserTypes('agent')
  @ApiOperation({
    summary: 'Get user details by ID',
    description:
      'Retrieves all data for a specific user from SAS Radius including activation details. ' +
      'This endpoint is only accessible by agents.',
  })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          id: 123,
          username: 'user123',
          enabled: 1,
          firstname: 'Ahmed',
          lastname: 'Ali',
          email: 'user@example.com',
          phone: '+9647XXXXXXXXX',
          balance: 50000,
          expiration: '2024-12-31 23:59:59',
          profile_name: 'Gold Package',
          traffic: '100GB',
          used_traffic: '25GB',
        },
        timestamp: '2026-01-08T12:00:00.000Z',
        correlationId: 'xxx-xxx-xxx',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Agent only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
    @AgentUsername() agentUsername: string,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.usersService.getUserById(
      agentUsername,
      id,
      ipAddress,
      userAgent,
      correlationId,
    );
  }
}
