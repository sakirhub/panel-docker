import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { DepositModule } from './deposit/deposit.module';
import { WithdrawModule } from './withdraw/withdraw.module';
import { VerifyModule } from './verify/verify.module';
import { IntegrationService } from './integration.service';
import { IntegrationController } from './integration.controller';

@Module({
  controllers: [AuthController, IntegrationController],
  providers: [SupabaseService, AuthService, IntegrationService],
  imports: [DepositModule, WithdrawModule, VerifyModule],
})
export class IntegrationModule {}
