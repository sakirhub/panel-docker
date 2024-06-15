import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
@Injectable()
export class IntegrationService {
  constructor(private readonly supabaseService: SupabaseService) {}
  async verify(body: any) {
    const client: any = await this.supabaseService.getServiceRole();
    const { id, amount } = body;

    const { data: investmentData, error: investmentError } = await client
      .from('investments')
      .select('*')
      .eq('transaction_id', id)
      .eq('status', 'transaction_pending')
      .single();

    if (investmentError) {
      return new BadRequestException(investmentError.message).getResponse();
    }

    const { data: organizationTeams, error: organizationTeamsError } =
      await client
        .from('team_organizations')
        .select('*, team(id, name, status)')
        .eq('organization', investmentData.organization)
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
        .neq('payment_method', '279fbfdb-34c8-41e5-9d9b-54137ad20f8b')
        .neq('payment_method', 'aad2e73d-0a8a-4de4-9841-980567cbf34f')
        .lte('min_limit', amount)
        .gte('max_limit', amount)
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

    const { error: updateError } = await client
      .from('investments')
      .update({
        status: 'pending',
        amount,
        bank_account: randomBankAccount.id,
        team: randomBankAccount.team,
        payment_method: randomBankAccount.payment_method.id,
      })
      .eq('transaction_id', id);
    if (updateError) {
      return new BadRequestException(updateError.message).getResponse();
    }
    return {
      status: 'ok',
      bank_account: randomBankAccount,
      redirect_url: investmentData.redirect_url,
    };
  }

  async getPaymentMethods() {
    const client: any = await this.supabaseService.getServiceRole();
    const paymentMethods = client
      .from('payment_methods')
      .select('id, name, logo')
      .neq('id', '279fbfdb-34c8-41e5-9d9b-54137ad20f8b')
      .neq('id', 'aad2e73d-0a8a-4de4-9841-980567cbf34f');
    const { data, error } = await paymentMethods;
    if (error) {
      return new BadRequestException(error.message).getResponse();
    }
    return data;
  }
}
