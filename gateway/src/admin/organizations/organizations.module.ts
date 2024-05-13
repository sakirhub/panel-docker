import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { SupabaseService } from '../../supabase/supabase.service';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService, SupabaseService],
})
export class OrganizationsModule {}
