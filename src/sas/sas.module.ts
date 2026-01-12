import { Module } from '@nestjs/common';
import { SasClientService } from './sas-client.service';
import { SasController } from './sas.controller';
import { SasService } from './sas.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { EncryptionModule } from '../common/encryption/encryption.module';
import { AuditModule } from '../common/audit/audit.module';

@Module({
  imports: [PrismaModule, EncryptionModule, AuditModule],
  controllers: [SasController],
  providers: [SasService, SasClientService],
  exports: [SasService, SasClientService],
})
export class SasModule {}
