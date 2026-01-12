import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SasModule } from '../sas/sas.module';
import { SasTokenModule } from '../common/sas-token/sas-token.module';

@Module({
  imports: [SasModule, SasTokenModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
