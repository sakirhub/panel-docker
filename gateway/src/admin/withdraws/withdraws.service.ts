import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { LoggingInterceptor } from '../../interceptors/logging.interceptor';
import crypto from 'crypto';
@Injectable()
export class WithdrawsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getAllInvestments(queryParams: any) {
    const client: any = await this.supabaseService.getServiceRole();
    const role = await this.supabaseService.getUserRole();

    const investments = client
      .from('withdraws')
      .select(
        '*, organization(name), investor!inner(id,name, full_name, organization_user_id), team(name)',
      )
      .neq('status', 'pending')
      .order('created_at', { ascending: false });

    if (queryParams?.status !== 'all') {
      investments.eq('status', queryParams.status);
    }

    if (queryParams?.id !== 'all') {
      investments.eq('transaction_id', `${queryParams?.id}`);
    }

    if (queryParams?.investor !== 'all') {
      investments.ilike('investor.full_name', `%${queryParams?.investor}%`);
    }

    if (
      role.role !== 'supervisor' &&
      role.role !== 'admin' &&
      role.role !== 'ekip'
    ) {
      investments.eq('team', role.data.team.id);
    }
    if (queryParams?.page) {
      investments.range(
        (queryParams.page - 1) * (queryParams.limit || 50),
        queryParams.page * (queryParams.limit || 50),
      );
    } else {
      investments.range(0, queryParams.limit || 50);
    }
    if (queryParams?.limit) {
      investments.limit(queryParams.limit);
    } else {
      investments.limit(50);
    }
    const { data, error } = await investments;
    if (error) {
      return error;
    }

    const count = client
      .from('withdraws')
      .select('id')
      .neq('status', 'pending');
    if (
      role.role !== 'supervisor' &&
      role.role !== 'admin' &&
      role.role !== 'ekip'
    ) {
      count.eq('team', role.data.team.id);
    }
    const { data: countData } = await count;
    const total_page = Math.ceil(
      countData?.length / (queryParams?.limit || 50),
    );

    return {
      data,
      meta: {
        data_count: countData.length,
        total_page,
        current_page: Number(queryParams?.page - 1),
        limit: Number(queryParams?.limit) || 50,
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
      .from('withdraws')
      .select(
        '*, organization(name), investor(id,name, full_name, organization_user_id), team(name)',
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (
      role.role !== 'supervisor' &&
      role.role !== 'admin' &&
      role.role !== 'ekip'
    ) {
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

    const count = client.from('withdraws').select('id').eq('status', 'pending');
    if (
      role.role !== 'supervisor' &&
      role.role !== 'admin' &&
      role.role !== 'ekip'
    ) {
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

  async approveInvestment(body: any) {
    const loggingInterceptor = new LoggingInterceptor();
    const client: any = await this.supabaseService.getServiceRole();
    const role = await this.supabaseService.getUserRole();
    const { id, amount, type } = body;

    const { data: investmentData, error: investmentError } = await client
      .from('withdraws')
      .select('*, organization(*), investor(*)')
      .eq('transaction_id', id)
      .eq('status', 'pending')
      .single();
    if (investmentError) {
      return investmentError;
    }
    const { error: updateInvestmentError } = await client
      .from('withdraws')
      .update({
        status: 'approved',
        accepted_at: new Date(),
        transactor_by: role.data.id,
      })
      .eq('transaction_id', id);
    if (updateInvestmentError && investmentData.type !== 'manual') {
      return updateInvestmentError;
    }
    if (investmentData.type !== 'manual') {
      const callBackUrl = investmentData.organization.definitions.callback_url;

      const callBackData = {
        service: 'withdraw',
        method: type,
        transaction_id: id,
        user_id: investmentData.investor.organization_user_id,
        username: investmentData.investor.username,
        amount: investmentData.amount,
        currency: 'TRY',
        status: 'successful',
        hash: crypto.createHash('sha1').update(id + '+' + 'wlh61ueieiC09os'),
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
        type: 'callback',
        data: {
          action: 'send',
          reqBody: callBackData,
          resBody: callbackRes,
          creator: role.data.id,
        },
      });
    }

    loggingInterceptor.sendLog({
      type: 'withdraw',
      data: {
        action: 'approve',
        reqBody: `Çekim onaylandı. Yatırımcı: ${investmentData.investor.full_name}, Miktar: ${amount}`,
        investment: investmentData.id,
        creator: role.data.id,
      },
    });

    return {
      status: 'ok',
      message: 'Çekim başarıyla onaylandı',
    };
  }

  async rejectInvestment(body: any) {
    const loggingInterceptor = new LoggingInterceptor();
    const client: any = await this.supabaseService.getServiceRole();
    const role = await this.supabaseService.getUserRole();
    const { id, type } = body;

    const { data: investmentData, error: investmentError } = await client
      .from('withdraws')
      .select('*, organization(*), investor(*)')
      .eq('transaction_id', id)
      .eq('status', 'pending')
      .single();
    if (investmentError) {
      return investmentError;
    }
    const callBackUrl = investmentData.organization.definitions.callback_url;
    const { error: updateInvestmentError } = await client
      .from('withdraws')
      .update({
        status: 'rejected',
        transactor_by: role.data.id,
      })
      .eq('transaction_id', id);
    if (updateInvestmentError) {
      return updateInvestmentError;
    }

    const callBackData = {
      service: 'withdraw',
      method: type,
      transaction_id: id,
      user_id: investmentData.investor.organization_user_id,
      username: investmentData.investor.username,
      amount: investmentData.amount,
      currency: 'TRY',
      status: 'unsuccessful',
      hash: crypto.createHash('sha1').update(id + '+' + 'wlh61ueieiC09os'),
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
      type: 'withdraw',
      data: {
        action: 'reject',
        reqBody: `Çekim talebi reddedildi. Yatırımcı: ${investmentData.investor.name}, Miktar: ${investmentData.amount}`,
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
      message: 'Çekim başarıyla reddedildi',
    };
  }
}
