import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  enabled: process.env.SWAGGER_ENABLED === 'true',
  title: process.env.SWAGGER_TITLE || 'Wi-Fi Agents Portal API',
  description: process.env.SWAGGER_DESCRIPTION || 'Enterprise-grade Multi-tenant SAS Radius Integration System',
  version: process.env.SWAGGER_VERSION || '1.0',
  path: process.env.SWAGGER_PATH || 'api-docs',
}));
