import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../../../supabase/supabase.service';
import { CreatePaparaDto } from './create-papara.dto';
@Injectable()
export class PaparaService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createBankTransfer(createPaparaDto: CreatePaparaDto) {
    return {
      status: 'ok',
      payment_url:
        'https://paymenturl.info/papara/' + createPaparaDto.transaction_id,
    };
  }
}
