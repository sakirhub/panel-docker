import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../../../../supabase/supabase.service';
import { CreateBankTransferDto } from './create-bank-transfer.dto';
import { CreateHavaleDto } from './create-havale-transfer.dto';
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

  async createHavale(createBankTransferDto: CreateHavaleDto) {
    const client: any = await this.supabaseService.getServiceRole();
    const role = await this.supabaseService.getUserRole();
    const investor = await this.supabaseService.checkInvestor(
      createBankTransferDto.user,
    );

    const { data: organizationTeams, error: organizationTeamsError } =
      await client
        .from('team_organizations')
        .select('*, team(id, name, status)')
        .eq('organization', role.data.organization.id)
        .eq('team.status', 'active');
    if (organizationTeamsError) {
      return new BadRequestException(
        organizationTeamsError.message,
      ).getResponse();
    }

    let randomBankAccount;
    for (let i = 0; i < organizationTeams.length; i++) {
      const randomTeam =
        organizationTeams[Math.floor(Math.random() * organizationTeams.length)];
      const { data: bankAccounts, error: bankAccountsError } = await client
        .from('bank_accounts')
        .select(
          'id, name, account_number, team, payment_method(id, name, logo)',
        )
        .eq('status', 'active')
        .eq('payment_method', createBankTransferDto.payment_method)
        .lte('min_limit', createBankTransferDto.amount)
        .gte('max_limit', createBankTransferDto.amount)
        .eq('team', randomTeam.team.id);
      if (bankAccountsError) {
        console.error('Bir hata oluştu:', bankAccountsError);
        continue;
      }

      if (bankAccounts.length > 0) {
        randomBankAccount =
          bankAccounts[Math.floor(Math.random() * bankAccounts.length)];
        break;
      }
    }

    if (!randomBankAccount) {
      return new BadRequestException(
        'Uygun banka hesabı bulunamadı',
      ).getResponse();
    }
    const investment: any = {
      investor: investor,
      bank_account: randomBankAccount.id,
      amount: createBankTransferDto.amount,
      currency: 'TRY',
      status: 'pending',
      type: 'havale',
      team: randomBankAccount.team.id,
      creator: role.data.id,
      organization: role.data.organization.id,
      transaction_id: createBankTransferDto.transaction_id,
      payment_method: randomBankAccount.payment_method.id,
    };
    const { data: investData, error } = await client
      .from('investments')
      .insert([investment])
      .select(
        '*, bank_account(name, account_number), payment_method(name, logo)',
      )
      .single();
    if (error) {
      return new BadRequestException(error.message).getResponse();
    }
    return {
      name: investData.bank_account.name,
      account_number: investData.bank_account.account_number,
      logo: investData.payment_method.logo,
    };
  }
}
