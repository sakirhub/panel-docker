import { Module } from '@nestjs/common';
import { BankAccountsController } from './bank-accounts.controller';
import { BankAccountsService } from './bank-accounts.service';
import { SupabaseService } from '../../supabase/supabase.service';

@Module({
  controllers: [BankAccountsController],
  providers: [BankAccountsService, SupabaseService],
})
export class BankAccountsModule {}
