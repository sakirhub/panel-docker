import { Module } from '@nestjs/common';
import { WithdrawsController } from './withdraws.controller';
import { WithdrawsService } from './withdraws.service';
import { SupabaseService } from '../../supabase/supabase.service';

@Module({
  controllers: [WithdrawsController],
  providers: [WithdrawsService, SupabaseService],
})
export class WithdrawsModule {}
