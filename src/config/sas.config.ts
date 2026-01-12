import { registerAs } from '@nestjs/config';

export default registerAs('sas', () => ({
  encryptionKey: process.env.SAS_ENCRYPTION_KEY!,
  requestTimeout: parseInt(process.env.SAS_REQUEST_TIMEOUT || '30000', 10),
  maxRetries: parseInt(process.env.SAS_MAX_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.SAS_RETRY_DELAY || '1000', 10),
}));
