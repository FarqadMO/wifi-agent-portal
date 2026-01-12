import { Module } from '@nestjs/common';
import { SasTokenService } from './sas-token.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { SasModule } from '../../sas/sas.module';

@Module({
  imports: [PrismaModule, EncryptionModule, SasModule],
  providers: [SasTokenService],
  exports: [SasTokenService],
})
export class SasTokenModule {}
