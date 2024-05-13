import { Injectable, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ scope: Scope.REQUEST })
export class SupabaseService {
  private serviceInstance: SupabaseClient;

  constructor(private readonly configService: ConfigService) {}

  async getServiceRole() {
    this.serviceInstance = createClient(
      process.env.SUPABASE_URL,
      process.env.SERVICE_KEY,
    );
    return this.serviceInstance;
  }
}
