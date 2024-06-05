import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { LoggingInterceptor } from '../../interceptors/logging.interceptor';
@Injectable()
export class InvestmentsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getAllInvestments(queryParams: any) {
    const client: any = await this.supabaseService.getServiceRole();
    const role = await this.supabaseService.getUserRole();

    const investments = client
      .from('investments')
      .select(
        '*, organization(name), investor(id,name, full_name, organization_user_id), team(name), payment_method(name, logo), bank_account(name, account_number)',
      )
      .neq('status', 'pending')
      .order('created_at', { ascending: false });

    if (role.role !== 'supervisor') {
      investments.eq('team', role.data.team.id);
    }
    if (queryParams?.page) {
      investments.range(
        (queryParams.page - 1) * (queryParams.limit || 20),
        queryParams.page * (queryParams.limit || 20),
      );
    } else {
      investments.range(0, queryParams.limit || 20);
    }
    if (queryParams?.limit) {
      investments.limit(queryParams.limit);
    } else {
      investments.limit(20);
    }
    const { data, error } = await investments;
    if (error) {
      return error;
    }

    const count = client
      .from('investments')
      .select('id')
      .neq('status', 'pending');
    if (role.role !== 'supervisor') {
      count.eq('team', role.data.team);
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

  async getPendingInvestments(queryParams: any) {
    const client: any = await this.supabaseService.getServiceRole();
    const role = await this.supabaseService.getUserRole();

    const investments = client
      .from('investments')
      .select(
        '*, organization(name), investor(id,name, full_name, organization_user_id), team(name), payment_method(name, logo), bank_account(name, account_number)',
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (role.role !== 'supervisor') {
      investments.eq('team', role.data.team.id);
    }
    if (queryParams?.page) {
      investments.range(
        (queryParams.page - 1) * (queryParams.limit || 20),
        queryParams.page * (queryParams.limit || 20),
      );
    } else {
      investments.range(0, queryParams.limit || 20);
    }
    if (queryParams?.limit) {
      investments.limit(queryParams.limit);
    } else {
      investments.limit(20);
    }
    const { data, error } = await investments;
    if (error) {
      return error;
    }

    const count = client
      .from('investments')
      .select('id')
      .eq('status', 'pending');
    if (role.role !== 'supervisor') {
      count.eq('team', role.data.team);
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

  async approveInvestment(body: any) {
    const loggingInterceptor = new LoggingInterceptor();
    const client: any = await this.supabaseService.getServiceRole();
    const role = await this.supabaseService.getUserRole();
    const { id, amount, type } = body;

    const { data: investmentData, error: investmentError } = await client
      .from('investments')
      .select('*, organization(*), investor(*)')
      .eq('transaction_id', id)
      .eq('status', 'pending')
      .single();

    if (investmentError) {
      return new BadRequestException(investmentError.message).getResponse();
    }

    const callBackUrl = investmentData.organization.definitions.callback_url;
    const { error: updateInvestmentError } = await client
      .from('investments')
      .update({
        status: 'approved',
        amount,
        transactor_by: role.data.id,
      })
      .eq('transaction_id', id);
    if (updateInvestmentError) {
      return updateInvestmentError;
    }

    const callBackData = {
      service: 'deposit',
      method: type,
      transaction_id: id,
      user_id: investmentData.investor.organization_user_id,
      username: investmentData.investor.username,
      amount,
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
          reqBody: `Yatırım onaylandı. Yatırımcı: ${investmentData.investor.name}, Miktar: ${amount}`,
          investment: investmentData.id,
          creator: role.data.id,
        },
      });
      loggingInterceptor.sendLog({
        type: 'callback',
        data: {
          action: 'send',
          reqBody: callBackData,
          resBody: callbackRes,
          creator: role.data.id,
        },
      });
    } catch (e) {
      loggingInterceptor.sendLog({
        type: 'investment',
        data: {
          action: 'approve',
          reqBody: `Yatırım onaylandı. Yatırımcı: ${investmentData.investor.name}, Miktar: ${amount}`,
          investment: investmentData.id,
          creator: role.data.id,
        },
      });
      loggingInterceptor.sendLog({
        type: 'callback',
        data: {
          action: 'send',
          reqBody: callBackData,
          resBody: e,
          creator: role.data.id,
        },
      });
    }
    return {
      status: 'ok',
      message: 'Yatırım başarıyla onaylandı',
    };
  }

  async rejectInvestment(body: any) {
    const loggingInterceptor = new LoggingInterceptor();
    const client: any = await this.supabaseService.getServiceRole();
    const role = await this.supabaseService.getUserRole();
    const { id, type } = body;

    const { data: investmentData, error: investmentError } = await client
      .from('investments')
      .select('*, organization(*), investor(*)')
      .eq('transaction_id', id)
      .eq('status', 'pending')
      .single();
    if (investmentError) {
      return investmentError;
    }
    const callBackUrl = investmentData.organization.definitions.callback_url;
    const { error: updateInvestmentError } = await client
      .from('investments')
      .update({
        status: 'rejected',
        transactor_by: role.data.id,
      })
      .eq('transaction_id', id);
    if (updateInvestmentError) {
      return updateInvestmentError;
    }

    const callBackData = {
      service: 'deposit',
      method: type,
      transaction_id: id,
      user_id: investmentData.investor.organization_user_id,
      username: investmentData.investor.username,
      amount: investmentData.amount,
      currency: 'TRY',
      status: 'unsuccessful',
    };

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
        action: 'reject',
        reqBody: `Yatırım reddedildi. Yatırımcı: ${investmentData.investor.name}, Miktar: ${investmentData.amount}`,
        investment: investmentData.id,
        creator: role.data.id,
      },
    });
    loggingInterceptor.sendLog({
      type: 'callback',
      data: {
        action: 'send',
        reqBody: callBackData,
        resBody: callbackRes,
        creator: role.data.id,
      },
    });
    return {
      status: 'ok',
      message: 'Yatırım başarıyla reddedildi',
    };
  }
}
