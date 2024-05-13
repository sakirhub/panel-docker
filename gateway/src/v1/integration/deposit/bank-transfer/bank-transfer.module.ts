import { Module } from '@nestjs/common';
import { SupabaseService } from '../../../../supabase/supabase.service';
import { BankTransferController } from './bank-transfer.controller';
import { BankTransferService } from './bank-transfer.service';

@Module({
  imports: [],
  controllers: [BankTransferController],
  providers: [SupabaseService, BankTransferService],
})
export class BankTransferModule {}
