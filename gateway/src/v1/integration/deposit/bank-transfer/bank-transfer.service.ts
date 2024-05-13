import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../../../supabase/supabase.service';
import { CreateBankTransferDto } from './create-bank-transfer.dto';
@Injectable()
export class BankTransferService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createBankTransfer(createBankTransferDto: CreateBankTransferDto) {
    return {
      status: 'ok',
      payment_url: 'https://webhook.site/3398e34c-3f40-4a08-8981-35127c8922ff',
    };
  }
}
