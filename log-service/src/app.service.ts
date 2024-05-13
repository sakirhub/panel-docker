import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase/supabase.service';
@Injectable()
export class AppService {
  constructor(private readonly supabaseService: SupabaseService) {}
  async createLog(data: number[]) {
    const supabase = await this.supabaseService.getServiceRole();
    const { data: logs, error } = await supabase.from('logs').insert(data);
    if (error) {
      return error;
    }
    return logs;
  }
}
