import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../../../../supabase/supabase.service';
import { CreateBankTransferDto } from './create-bank-transfer.dto';
import { CreateHavaleDto } from './create-havale-transfer.dto';
import { createVerifyDepositDto } from './create-verify.dto';
import * as crypto from 'crypto';

import { LoggingInterceptor } from '../../../../interceptors/logging.interceptor';
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
      try {
        const randomTeam =
          await organizationTeams[
            Math.floor(Math.random() * organizationTeams.length)
          ];
        if (!randomTeam.team) {
          continue;
        }
        const { data: bankAccounts, error: bankAccountsError } = await client
          .from('bank_accounts')
          .select(
            'id, name, account_number, team(id), payment_method(id, name, logo)',
          )
          .eq('status', 'active')
          .neq('payment_method', '279fbfdb-34c8-41e5-9d9b-54137ad20f8b')
          .neq('payment_method', 'aad2e73d-0a8a-4de4-9841-980567cbf34f')
          .lte('min_limit', createBankTransferDto.amount)
          .gte('max_limit', createBankTransferDto.amount)
          .eq('team', randomTeam.team.id);
        if (bankAccountsError) {
          console.log('buraya girdi');
          console.error('Bir hata oluştu:', bankAccountsError);
          continue;
        }

        if (bankAccounts.length > 0) {
          randomBankAccount =
            await bankAccounts[Math.floor(Math.random() * bankAccounts.length)];
          break;
        }
      } catch (e) {
        console.error('Bir hata oluştu:', e);
        continue;
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

  async getBankAccounts() {
    const client: any = await this.supabaseService.getServiceRole();
    const role = await this.supabaseService.getUserRole();

    const { data: organizationTeams, error: organizationTeamsError } =
      await client
        .from('team_organizations')
        .select('*, team(id, name, status)')
        .eq('organization', role.data.organization.id)
        .eq('team.status', 'active');

    if (organizationTeamsError) {
      console.error(
        'Organization Teams Error:',
        organizationTeamsError.message,
      );
      return new BadRequestException(
        'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
      ).getResponse();
    }

    const activeTeams = organizationTeams.map((orgTeam) => orgTeam.team);
    let selectedBankAccounts = [];

    while (activeTeams.length > 0 && selectedBankAccounts.length === 0) {
      const randomIndex = Math.floor(Math.random() * activeTeams.length);
      const randomTeam = activeTeams.splice(randomIndex, 1)[0];

      if (!randomTeam) {
        continue;
      }

      const { data: bankAccounts, error: bankAccountsError } = await client
        .from('bank_accounts')
        .select(
          'id, name, account_number, payment_method(id, name, logo), min_limit, max_limit',
        )
        .eq('status', 'active')
        .neq('payment_method', '279fbfdb-34c8-41e5-9d9b-54137ad20f8b')
        .neq('payment_method', 'aad2e73d-0a8a-4de4-9841-980567cbf34f')
        .eq('team', randomTeam.id);

      if (bankAccountsError) {
        console.error('Bank Accounts Error:', bankAccountsError.message);
        return new BadRequestException(bankAccountsError.message).getResponse();
      }

      if (bankAccounts.length > 0) {
        selectedBankAccounts = bankAccounts
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
      }
    }

    if (selectedBankAccounts.length === 0) {
      console.warn('No suitable bank accounts found.');
      return new BadRequestException(
        'Uygun banka hesabı bulunamadı',
      ).getResponse();
    }

    return {
      accounts: selectedBankAccounts,
    };
  }

  async createVerifyDeposit(createVerifyDepositDto: createVerifyDepositDto) {
    const loggingInterceptor = new LoggingInterceptor();
    const client: any = await this.supabaseService.getServiceRole();
    const role = await this.supabaseService.getUserRole();
    const investor = await this.supabaseService.checkInvestor(
      createVerifyDepositDto.user,
    );

    const { data: bankAccount, error: bankAccountError } = await client
      .from('bank_accounts')
      .select('team(id), payment_method(id, name, logo)')
      .eq('id', createVerifyDepositDto.bank_account_id)
      .single();
    const investmentData = {
      status: 'pending',
      transaction_id: createVerifyDepositDto.transaction_id,
      organization: role.data.organization.id,
      amount: createVerifyDepositDto.amount,
      investor: investor,
      currency: 'TRY',
      payment_url:
        'https://paymenturl.info/bank-transfer/' +
        createVerifyDepositDto.transaction_id,
      redirect_url: '',
      url_confirm: false,
      organization_commission: role.data.organization.definitions.commission,
      creator: role.data.id,
      team: bankAccount.team.id,
      bank_account: createVerifyDepositDto.bank_account_id,
      payment_method: bankAccount.payment_method.id,
    };
    const { data: investmentDataSelect, error } = await client
      .from('investments')
      .insert([investmentData])
      .select('*, investor(*), organization(*), team(*)')
      .single();
    if (error) {
      return new BadRequestException('Bir hata oluştu').getResponse();
    }

    function normalizeString(str: string) {
      const charMap = {
        ç: 'c',
        ğ: 'g',
        ı: 'i',
        ö: 'o',
        ş: 's',
        ü: 'u',
        Ç: 'C',
        Ğ: 'G',
        İ: 'I',
        Ö: 'O',
        Ş: 'S',
        Ü: 'U',
      };

      return str
        .split('')
        .map((char) => charMap[char] || char)
        .join('');
    }

    const normalizedInvestor = normalizeString(
      investmentDataSelect.investor.full_name.toLowerCase(),
    );
    const { data: invest, error: investError } = await client
      .from('bank_account_details')
      .select('*')
      .eq('amount', createVerifyDepositDto.amount)
      .eq('sender_name', normalizedInvestor)
      .eq('account_id', createVerifyDepositDto.bank_account_id)
      .eq('transaction_id', null)
      .single();
    if (invest) {
      await client
        .from('bank_account_details')
        .update({ transaction_id: createVerifyDepositDto.transaction_id })
        .eq('id', invest.id);
      const callBackUrl =
        investmentDataSelect.organization.definitions.callback_url;
      const team_commission = investmentDataSelect.team.definitions.commission;
      const organization_commission =
        investmentDataSelect.organization.definitions.commission;
      const total_org_commission =
        Number(organization_commission) - Number(team_commission);
      const total_team_commission = Number(team_commission);
      const total_investment = Number(investmentDataSelect.amount);

      const team_commission_amount =
        (total_team_commission / 100) * total_investment;

      const organization_commission_amount =
        (total_org_commission / 100) * total_investment;

      const { error: updateInvestmentError } = await client
        .from('investments')
        .update({
          status: 'approved',
          amount: createVerifyDepositDto.amount,
          organization_commission: organization_commission_amount,
          team_commission: team_commission_amount,
          transactor_by: role.data.id,
          accepted_at: new Date(),
        })
        .eq('transaction_id', createVerifyDepositDto.transaction_id);

      const callBackData = {
        service: 'deposit',
        method: 'bank-transfer',
        transaction_id: createVerifyDepositDto.transaction_id,
        user_id: investmentDataSelect.investor.organization_user_id,
        username: investmentDataSelect.investor.username,
        amount: investmentDataSelect.amount,
        currency: 'TRY',
        status: 'successful',
        hash: crypto
          .createHash('sha1')
          .update(
            createVerifyDepositDto.transaction_id + '+' + 'wlh61ueieiC09os',
          )
          .digest('hex'),
      };
      try {
        const callbackReq = await fetch(callBackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(callBackData),
        });
        const callbackRes = await callbackReq.json();
        loggingInterceptor.sendLog({
          type: 'investment',
          data: {
            action: 'approve',
            reqBody: `Yatırım onaylandı. Yatırımcı: ${investmentDataSelect.investor.full_name}, Miktar: ${investmentDataSelect.amount}`,
            investment: investmentDataSelect.transaction_id,
            creator: role.data.id,
          },
          transaction_id: investmentDataSelect.transaction_id,
        });
        loggingInterceptor.sendLog({
          type: 'callback',
          data: {
            action: 'send',
            reqBody: callBackData,
            resBody: callbackRes,
            creator: role.data.id,
          },
          transaction_id: investmentDataSelect.transaction_id,
        });
      } catch (e) {
        loggingInterceptor.sendLog({
          type: 'investment',
          data: {
            action: 'approve',
            reqBody: `Yatırım onaylandı. Yatırımcı: ${investmentDataSelect.investor.full_name}, Miktar: ${investmentDataSelect.amount}`,
            investment: investmentData.transaction_id,
            creator: role.data.id,
          },
          transaction_id: investmentData.transaction_id,
        });
        loggingInterceptor.sendLog({
          type: 'callback',
          data: {
            action: 'send',
            reqBody: callBackData,
            resBody: e,
            creator: role.data.id,
          },
          transaction_id: investmentData.transaction_id,
        });
      }
    }
    return {
      status: 'success',
      transaction_id: createVerifyDepositDto.transaction_id,
    };
  }
}
