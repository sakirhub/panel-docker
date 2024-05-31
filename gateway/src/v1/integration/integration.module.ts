import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { DepositModule } from './deposit/deposit.module';
import { WithdrawModule } from './withdraw/withdraw.module';
import { VerifyModule } from './verify/verify.module';

@Module({
  controllers: [AuthController],
  providers: [SupabaseService, AuthService],
  imports: [DepositModule, WithdrawModule, VerifyModule],
})
export class IntegrationModule {}
