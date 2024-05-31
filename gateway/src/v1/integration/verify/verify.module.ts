import { Module } from '@nestjs/common';
import { VerifyController } from './verify.controller';
import { VerifyService } from './verify.service';
import { SupabaseService } from '../../../supabase/supabase.service';

@Module({
  controllers: [VerifyController],
  providers: [VerifyService, SupabaseService],
})
export class VerifyModule {}
