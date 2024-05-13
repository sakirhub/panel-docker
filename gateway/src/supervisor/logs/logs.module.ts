import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { SupabaseService } from '../../supabase/supabase.service';

@Module({
  controllers: [LogsController],
  providers: [LogsService, SupabaseService],
})
export class LogsModule {}
