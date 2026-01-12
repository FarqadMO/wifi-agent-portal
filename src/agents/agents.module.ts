import { Module } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { SasModule } from '../sas/sas.module';
import { SasTokenModule } from '../common/sas-token/sas-token.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [SasModule, SasTokenModule, PaymentModule],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
