import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../../supabase/supabase.service';
@Injectable()
export class VerifyService {
  constructor(private readonly supabaseService: SupabaseService) {}
  async verify(body: any) {
    return body;
  }
}
