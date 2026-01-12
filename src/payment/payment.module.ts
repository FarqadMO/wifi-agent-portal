import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { QiCardGatewayService } from './qi-card/qi-card-gateway.service';
import { QiCardConfigService } from './qi-card/qi-card-config.service';
import { QiCardWebhookController } from './qi-card/qi-card-webhook.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuditModule } from '../common/audit/audit.module';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuditModule,
    forwardRef(() => AgentsModule), // Use forwardRef to prevent circular dependency
  ],
  controllers: [PaymentController, QiCardWebhookController],
  providers: [PaymentService, QiCardGatewayService, QiCardConfigService],
  exports: [PaymentService],
})
export class PaymentModule {}
