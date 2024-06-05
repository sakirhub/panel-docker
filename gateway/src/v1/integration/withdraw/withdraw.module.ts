import { Module } from '@nestjs/common';
import { WithdrawService } from './withdraw.service';
import { WithdrawController } from './withdraw.controller';
import { SupabaseService } from '../../../supabase/supabase.service';

@Module({
  providers: [WithdrawService, SupabaseService],
  controllers: [WithdrawController],
})
export class WithdrawModule {}
