import { Module } from '@nestjs/common';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';
import { SupabaseService } from '../../supabase/supabase.service';

@Module({
  controllers: [InvestmentsController],
  providers: [InvestmentsService, SupabaseService],
})
export class InvestmentsModule {}
