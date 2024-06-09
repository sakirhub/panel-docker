import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateBankAccountsDto } from './create-bank-accounts.dto';
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
}
