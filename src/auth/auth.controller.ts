import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, AgentLoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { Public } from '../common/decorators/auth.decorator';
import { IpAddress, UserAgent, CorrelationId } from '../common/decorators/request.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'System user login' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(
    @Body() loginDto: LoginDto,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.authService.login(loginDto, ipAddress, userAgent, correlationId);
  }

  @Post('agent/login')
  @Public()
  @ApiOperation({ 
    summary: 'Agent login (auto-discovers SAS system)', 
    description: 'Automatically tries all active SAS systems and associates agent with the first successful authentication'
  })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials or agent not found in any SAS system' })
  agentLogin(
    @Body() agentLoginDto: AgentLoginDto,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.authService.agentLogin(agentLoginDto, ipAddress, userAgent, correlationId);
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register new system user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
