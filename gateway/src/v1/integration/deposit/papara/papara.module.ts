import { Module } from '@nestjs/common';
import { SupabaseService } from '../../../../supabase/supabase.service';
import { PaparaController } from './papara.controller';
import { PaparaService } from './papara.service';

@Module({
  imports: [],
  controllers: [PaparaController],
  providers: [SupabaseService, PaparaService],
})
export class PaparaModule {}
