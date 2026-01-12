import { Module } from '@nestjs/common';
import { ManagersService } from './managers.service';
import { ManagersController } from './managers.controller';
import { SasModule } from '../sas/sas.module';
import { SasTokenModule } from '../common/sas-token/sas-token.module';

@Module({
  imports: [SasModule, SasTokenModule],
  controllers: [ManagersController],
  providers: [ManagersService],
  exports: [ManagersService],
})
export class ManagersModule {}
