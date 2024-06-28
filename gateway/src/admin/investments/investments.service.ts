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
        '*, organization(name), investor!inner(id,name, full_name, organization_user_id), team(name), payment_method(name, logo), bank_account(name, account_number)',
      )
      .neq('status', 'pending')
      .neq('status', 'transaction_pending')
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
      role.role !== 'ekip' &&
      role.role !== 'admin'
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
      .from('investments')
      .select('id')
      .neq('status', 'pending');
    if (
      role.role !== 'supervisor' &&
      role.role !== 'ekip' &&
      role.role !== 'admin'
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
      .from('investments')
      .select(
        '*, organization(name), investor(id,name, full_name, organization_user_id), team(name), payment_method(name, logo), bank_account(name, account_number)',
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

    const count = client
      .from('investments')
      .select('id')
      .eq('status', 'pending');
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
      .from('investments')
      .select('*, organization(*), investor(*), team(*)')
      .eq('transaction_id', id)
      .eq('status', 'pending')
      .single();

    if (investmentError) {
      return new BadRequestException(investmentError.message).getResponse();
    }

    if (investmentData.status !== 'pending') {
      return new BadRequestException('Yatırım zaten onaylanmış').getResponse();
    }

    const team_commission = investmentData.team.definitions.commission;
    const organization_commission =
      investmentData.organization.definitions.commission;
    const total_org_commission =
      Number(organization_commission) - Number(team_commission);
    const total_team_commission = Number(team_commission);
    const total_investment = Number(amount);

    const team_commission_amount =
      (total_team_commission / 100) * total_investment;

    const organization_commission_amount =
      (total_org_commission / 100) * total_investment;

    const callBackUrl = investmentData.organization.definitions.callback_url;
    const { error: updateInvestmentError } = await client
      .from('investments')
      .update({
        status: 'approved',
        amount,
        organization_commission: organization_commission_amount,
        team_commission: team_commission_amount,
        transactor_by: role.data.id,
        accepted_at: new Date(),
      })
      .eq('transaction_id', id);
    if (updateInvestmentError) {
      return updateInvestmentError;
    }
    if (
      investmentData.organization.id === 'b11d71d1-9c94-416f-86d4-a85940233bf2'
    ) {
      const callBackData = {
        transaction_id: investmentData.transaction_id,
        user_id: investmentData.investor.site_user_id,
        status: 'approved',
        amount: amount,
      };
      const fetchCallback = await fetch(
        investmentData.organization.definitions.callback_url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(callBackData),
        },
      );
      const fetchCallbackData = await fetchCallback.json();
    } else {
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
            reqBody: `Yatırım onaylandı. Yatırımcı: ${investmentData.investor.full_name}, Miktar: ${amount}`,
            investment: investmentData.id,
            creator: role.data.id,
          },
          transaction_id: id,
        });
        loggingInterceptor.sendLog({
          type: 'callback',
          data: {
            action: 'send',
            reqBody: callBackData,
            resBody: callbackRes,
            creator: role.data.id,
          },
          transaction_id: id,
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
          transaction_id: id,
        });
        loggingInterceptor.sendLog({
          type: 'callback',
          data: {
            action: 'send',
            reqBody: callBackData,
            resBody: e,
            creator: role.data.id,
          },
          transaction_id: id,
        });
      }
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
    if (
      investmentData.organization.id === 'b11d71d1-9c94-416f-86d4-a85940233bf2'
    ) {
      const callBackData = {
        transaction_id: investmentData.transaction_id,
        user_id: investmentData.investor.site_user_id,
        status: 'rejected',
        amount: investmentData.amount,
      };
      const fetchCallback = await fetch(
        investmentData.organization.definitions.callback_url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(callBackData),
        },
      );
      const fetchCallbackData = await fetchCallback.json();
    } else {
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
          reqBody: `Yatırım reddedildi. Yatırımcı: ${investmentData.investor.full_name}, Miktar: ${investmentData.amount}`,
          investment: investmentData.id,
          creator: role.data.id,
        },
        transaction_id: id,
      });
      loggingInterceptor.sendLog({
        type: 'callback',
        data: {
          action: 'send',
          reqBody: callBackData,
          resBody: callbackRes,
          creator: role.data.id,
        },
        transaction_id: id,
      });
    }

    return {
      status: 'ok',
      message: 'Yatırım başarıyla reddedildi',
    };
  }
}
