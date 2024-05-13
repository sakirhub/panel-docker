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
    const { data, error } = await logs.order('created_at', {
      ascending: false,
    });
    if (error) {
      return error;
    }
    return data;
  }
}
