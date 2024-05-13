import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { SupabaseService } from '../../supabase/supabase.service';

@Module({
  controllers: [TeamsController],
  providers: [TeamsService, SupabaseService],
})
export class TeamsModule {}
