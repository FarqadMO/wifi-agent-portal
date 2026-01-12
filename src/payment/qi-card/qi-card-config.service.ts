import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QiCardConfigService {
  private readonly logger = new Logger(QiCardConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  get isProduction(): boolean {
    return this.configService.get<string>('qi.isProduction') === 'true';
  }

  get username(): string {
    return this.isProduction
      ? this.configService.get<string>('qi.usernameProd')!
      : this.configService.get<string>('qi.usernameTest')!;
  }

  get password(): string {
    return this.isProduction
      ? this.configService.get<string>('qi.passwordProd')!
      : this.configService.get<string>('qi.passwordTest')!;
  }

  get xTerminalId(): string {
    return this.isProduction
      ? this.configService.get<string>('qi.xTerminalIdProd')!
      : this.configService.get<string>('qi.xTerminalIdTest')!;
  }

  get currency(): string {
    return this.isProduction
      ? this.configService.get<string>('qi.currencyProd')!
      : this.configService.get<string>('qi.currencyTest')!;
  }

  get apiUrl(): string {
    return this.isProduction
      ? this.configService.get<string>('qi.urlProd')!
      : this.configService.get<string>('qi.urlTest')!;
  }

  get callbackToken(): string {
    return this.configService.get<string>('qi.callbackToken')!;
  }

  get publicKeyPath(): string {
    return this.configService.get<string>('qi.publicKeyPath')!;
  }

  getBasicAuthHeader(): string {
    const credentials = `${this.username}:${this.password}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }
}
