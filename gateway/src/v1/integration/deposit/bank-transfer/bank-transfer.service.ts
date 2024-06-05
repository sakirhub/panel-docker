import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../../../../supabase/supabase.service';
import { CreateBankTransferDto } from './create-bank-transfer.dto';
@Injectable()
export class BankTransferService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createBankTransfer(createBankTransferDto: CreateBankTransferDto) {
    const client: any = await this.supabaseService.getServiceRole();
    const role = await this.supabaseService.getUserRole();
    const investor = await this.supabaseService.checkInvestor(
      createBankTransferDto.user,
    );

    const investmentData = {
      status: 'transaction_pending',
      transaction_id: createBankTransferDto.transaction_id,
      organization: role.data.organization.id,
      investor: investor,
      currency: 'TRY',
      payment_url:
        'https://paymenturl.info/bank-transfer/' +
        createBankTransferDto.transaction_id,
      redirect_url: createBankTransferDto.redirect_url || '',
      url_confirm: false,
      organization_commission: role.data.organization.definitions.commission,
      creator: role.data.id,
    };

    const { error } = await client.from('investments').insert([investmentData]);

    if (error) {
      return new BadRequestException('Bir hata oluştu').getResponse();
    }

    return {
      status: 'ok',
      payment_url:
        'https://paymenturl.info/bank-transfer/' +
        createBankTransferDto.transaction_id,
    };
  }
}
