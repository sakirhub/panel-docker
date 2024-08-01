import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateBankAccountsDto } from './create-bank-accounts.dto';
import OpenAI from 'openai';
import { LoggingInterceptor } from '../../interceptors/logging.interceptor';

@Injectable()
export class BankAccountsService {
  constructor(private readonly supabaseService: SupabaseService) {}
  async findAll(queryParams: any) {
    const role = await this.supabaseService.getUserRole();
    const client = await this.supabaseService.getServiceRole();
    const bank_accounts = client
      .from('bank_accounts')
      .select('*, team(name), payment_method(name), creator(display_name)')
      .neq('id', 'aad2e73d-0a8a-4de4-9841-980567cbf34f')
      .neq('id', '279fbfdb-34c8-41e5-9d9b-54137ad20f8b')
      .is('type', null)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (role.role !== 'supervisor' && role.role !== 'ekip') {
      bank_accounts.eq('team', role.data.team.id);
    }
    if (queryParams?.page) {
      bank_accounts.range(
        (queryParams.page - 1) * (queryParams.limit || 20),
        queryParams.page * (queryParams.limit || 20),
      );
    } else {
      bank_accounts.range(0, queryParams.limit || 20);
    }
    if (queryParams?.limit) {
      bank_accounts.limit(queryParams.limit);
    } else {
      bank_accounts.limit(20);
    }
    if (queryParams?.team) {
      bank_accounts.eq('team', queryParams.team);
    }
    const { data, error } = await bank_accounts;
    if (error) {
      return new BadRequestException(error.message).getResponse();
    }
    const count = client.from('bank_accounts').select('id');
    if (role.role !== 'supervisor' && role.role !== 'ekip') {
      count.eq('team', role.data.team.id);
    }
    const { data: countData } = await count;
    const total_page = Math.ceil(
      countData?.length / (queryParams?.limit || 20),
    );
    return {
      data,
      meta: {
        data_count: countData.length,
        total_page,
        current_page: Number(queryParams?.page - 1),
        limit: Number(queryParams?.limit) || 20,
        prev_page:
          Number(queryParams?.page - 1) >= 1
            ? Number(queryParams.page - 1) - 1
            : null,
        next_page:
          Number(queryParams?.page - 1) < Number(total_page)
            ? Number(queryParams.page - 1) + 1
            : null,
      },
    };
  }
  async findAllAuto(queryParams: any) {
    const role = await this.supabaseService.getUserRole();
    const client = await this.supabaseService.getServiceRole();
    const bank_accounts = client
      .from('bank_accounts')
      .select('*, team(name), payment_method(name), creator(display_name)')
      .neq('id', 'aad2e73d-0a8a-4de4-9841-980567cbf34f')
      .neq('id', '279fbfdb-34c8-41e5-9d9b-54137ad20f8b')
      .eq('type', 'auto')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (role.role !== 'supervisor' && role.role !== 'ekip') {
      bank_accounts.eq('team', role.data.team.id);
    }
    if (queryParams?.page) {
      bank_accounts.range(
        (queryParams.page - 1) * (queryParams.limit || 20),
        queryParams.page * (queryParams.limit || 20),
      );
    } else {
      bank_accounts.range(0, queryParams.limit || 20);
    }
    if (queryParams?.limit) {
      bank_accounts.limit(queryParams.limit);
    } else {
      bank_accounts.limit(20);
    }
    if (queryParams?.team) {
      bank_accounts.eq('team', queryParams.team);
    }
    const { data, error } = await bank_accounts;
    if (error) {
      return new BadRequestException(error.message).getResponse();
    }
    const count = client.from('bank_accounts').select('id');
    if (role.role !== 'supervisor' && role.role !== 'ekip') {
      count.eq('team', role.data.team.id);
    }
    const { data: countData } = await count;
    const total_page = Math.ceil(
      countData?.length / (queryParams?.limit || 20),
    );
    return {
      data,
      meta: {
        data_count: countData.length,
        total_page,
        current_page: Number(queryParams?.page - 1),
        limit: Number(queryParams?.limit) || 20,
        prev_page:
          Number(queryParams?.page - 1) >= 1
            ? Number(queryParams.page - 1) - 1
            : null,
        next_page:
          Number(queryParams?.page - 1) < Number(total_page)
            ? Number(queryParams.page - 1) + 1
            : null,
      },
    };
  }
  async create(createBankAccountsDto: CreateBankAccountsDto) {
    const role = await this.supabaseService.getUserRole();
    const client = await this.supabaseService.getServiceRole();
    const insertData = {
      ...createBankAccountsDto,
      status: 'active',
      creator: role.data.id,
    };
    if (role.role !== 'supervisor') {
      insertData.team = role.data.team.id;
    }
    const { data, error } = await client
      .from('bank_accounts')
      .insert([insertData])
      .select();
    if (error) {
      return new BadRequestException(error.message).getResponse();
    }
    return { data, message: 'Bank account created successfully' };
  }
  async postAccountDetails(body) {
    const loggingInterceptor = new LoggingInterceptor();
    const client = await this.supabaseService.getServiceRole();
    const apiKeys = [
      //process.env.OPENAI_API_KEY,
      process.env.OPENAI_API_KEY2,
      process.env.OPENAI_API_KEY3,
    ];

    const randomKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

    const openai = new OpenAI({
      apiKey: randomKey,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Merhaba, sana bazı finansal işlem verileri vereceğim. Lütfen bu verilerdeki isim ve soyisimleri bul ve aşağıdaki adımları izle:\n\n1. Verilen verilerdeki isim ve soyisimleri algıla.\n2. İsim ve soyisimlerdeki Türkçe karakterleri İngilizce karakterlere çevir.\n3. İsim ve soyisimleri küçük harflere dönüştür.\n4. İşlem görmüş isim ve soyisimleri yalnızca bir text formatında bana geri gönder.\n\nÖrnek Veri:\n- "FAST:YUSUF DURGUT"\n- "FAST:MUHAMMET SEVAL FAST ANLIK ÖDEME"\n- "FAST:ABDULSAMET AKAGÜNDÜZ F"\n- "7777/MBL-HAV.SERHAN KAPLAN"\n- "7777/MBL-HAV.TOLGA ÜNALMIŞ-7777/HAVYILMAZ ARDE"\n\nBeklenen Çıktı Formatı (örneğin):\n- yusuf durgut\n- muhammet seval\n- abdulsamet akagunduz\n- serhan kaplan\n- tolga unalmis\n\nLütfen yukarıdaki adımları izle ve sadece dönüştürülmüş isimleri ve soyisimleri gönder. Text dışında bir şey yazma.\n',
        },
        {
          role: 'user',
          content: body.user_name,
        },
      ],
      temperature: 0,
      max_tokens: 256,
      top_p: 0.3,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
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

    const normalizedContent = normalizeString(
      response.choices[0].message.content.toLowerCase(),
    );
    const postData = {
      account_id: body.account_id,
      amount: body.amount,
      last_balance: body.last_balance,
      description: body.user_name,
      sender_name: normalizedContent,
      transaction_date: body.created_bank,
    };

    const { data: checkData, error: checkError } = await client
      .from('bank_account_details')
      .select('id')
      .eq('account_id', body.account_id)
      .eq('transaction_date', body.created_bank)
      .eq('amount', body.amount)
      .eq('last_balance', body.last_balance)
      .eq('description', body.user_name);

    if (checkError) {
      throw new Error(`Error checking data: ${checkError.message}`);
    }

    if (checkData && checkData.length > 0) {
      return 'Data already exists';
    }

    const { data: details, error } = await client
      .from('bank_account_details')
      .insert([postData])
      .select('*')
      .single();

    if (error) {
      throw new Error(`Error inserting data: ${error.message}`);
    }

    const { data: investmentData } = await client
      .from('investments')
      .select(
        `
      id, 
      amount, 
      status, 
      transaction_id,
      investor!inner (
        *
      ),
      organization(*), 
      team(*)
    `,
      )
      .eq('status', 'pending')
      .eq('amount', body.amount)
      .eq('bank_account', body.account_id);

    let filteredInvestmentData: any = investmentData.filter(
      (investment: any) => {
        const normalizedInvestorName = normalizeString(
          investment.investor.full_name.toLowerCase(),
        );
        return normalizedInvestorName == normalizedContent;
      },
    );
    if (filteredInvestmentData.length === 0) {
      return 'No investment found';
    }
    filteredInvestmentData = filteredInvestmentData[0];
    const team_commission = filteredInvestmentData.team.definitions.commission;
    const organization_commission =
      filteredInvestmentData.organization.definitions.commission;
    const total_org_commission =
      Number(organization_commission) - Number(team_commission);
    const total_team_commission = Number(team_commission);
    const total_investment = Number(body.amount);

    const team_commission_amount =
      (total_team_commission / 100) * total_investment;

    const organization_commission_amount =
      (total_org_commission / 100) * total_investment;

    const callBackUrl =
      filteredInvestmentData.organization.definitions.callback_url;
    const { error: updateInvestmentError } = await client
      .from('investments')
      .update({
        status: 'approved',
        amount: body.amount,
        organization_commission: organization_commission_amount,
        team_commission: team_commission_amount,
        accepted_at: new Date(),
      })
      .eq('transaction_id', filteredInvestmentData.transaction_id);
    const { error: updateBankAccountError } = await client
      .from('bank_account_details')
      .update({
        transaction_id: filteredInvestmentData.transaction_id,
      })
      .eq('id', details.id);
    if (updateInvestmentError) {
      return updateInvestmentError;
    }

    const callBackData = {
      service: 'deposit',
      method: 'bank-transfer',
      transaction_id: filteredInvestmentData.transaction_id,
      user_id: filteredInvestmentData.investor.organization_user_id,
      username: filteredInvestmentData.investor.username,
      amount: body.amount,
      currency: 'TRY',
      status: 'successful',
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
          reqBody: `Yatırım onaylandı. Yatırımcı: ${filteredInvestmentData.investor.full_name}, Miktar: ${body.amount}`,
          investment: filteredInvestmentData.id,
        },
        transaction_id: filteredInvestmentData.transaction_id,
      });
      loggingInterceptor.sendLog({
        type: 'callback',
        data: {
          action: 'send',
          reqBody: callBackData,
          resBody: callbackRes,
        },
        transaction_id: filteredInvestmentData.transaction_id,
      });
    } catch (e) {
      loggingInterceptor.sendLog({
        type: 'investment',
        data: {
          action: 'approve',
          reqBody: `Yatırım onaylandı. Yatırımcı: ${filteredInvestmentData.investor.name}, Miktar: ${body.amount}`,
          investment: filteredInvestmentData.transaction_id,
        },
        transaction_id: filteredInvestmentData.transaction_id,
      });
      loggingInterceptor.sendLog({
        type: 'callback',
        data: {
          action: 'send',
          reqBody: callBackData,
          resBody: e,
        },
        transaction_id: filteredInvestmentData.transaction_id,
      });
    }
    return {
      status: 'ok',
      message: 'Yatırım başarıyla onaylandı',
    };
  }
  async loginAccount(body) {
    const client = await this.supabaseService.getServiceRole();
    const { data: update, error } = await client
      .from('bank_accounts')
      .update({ login: true, status: 'active' })
      .eq('id', body.id);
    return 'success';
  }
  async logoutAccount(body) {
    const client = await this.supabaseService.getServiceRole();
    const { data: update, error } = await client
      .from('bank_accounts')
      .update({ login: false, status: 'inactive' })
      .eq('id', body.id);
    return 'success';
  }
}
