import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
@Injectable()
export class LogsService {
  constructor(private readonly supabaseService: SupabaseService) {}
  async getLogs(queryParams: any): Promise<any> {
    const client: any = (await this.supabaseService.getServiceRole()) as any;
    const logs = client.from('logs').select('*');
    if (queryParams?.url) {
      logs.contains('data', { url: queryParams.url });
    }
    if (queryParams?.method) {
      logs.contains('data', { method: queryParams.method });
    }
    if (queryParams?.statusCode) {
      logs.contains('data', { statusCode: Number(queryParams.statusCode) });
    }
    if (queryParams?.page) {
      logs.range(
        Number(queryParams?.page - 1) * (Number(queryParams?.limit) || 20),
        queryParams?.page * (queryParams?.limit || 20),
      );
    } else {
      logs.range(0, queryParams.limit || 20);
    }
    if (queryParams?.limit) {
      logs.limit(queryParams.limit);
    } else {
      logs.limit(20);
    }
    const { data, error } = await logs.order('created_at', {
      ascending: false,
    });
    if (error) {
      return error;
    }
    const { data: countData } = await client.from('logs').select('id');
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
}
