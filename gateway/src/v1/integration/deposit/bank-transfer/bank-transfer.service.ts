import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../../../supabase/supabase.service';
import { CreateBankTransferDto } from './create-bank-transfer.dto';
@Injectable()
export class BankTransferService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createBankTransfer(createBankTransferDto: CreateBankTransferDto) {
    return {
      status: 'ok',
      payment_url:
        'https://paymenturl.info/bank-transfer/' +
        createBankTransferDto.transaction_id,
    };
  }
}
