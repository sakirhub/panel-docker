import { Inject, Injectable, Scope } from '@nestjs/common';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ExtractJwt } from 'passport-jwt';

@Injectable({ scope: Scope.REQUEST })
export class SupabaseService {
  private readonly supabase: SupabaseClient;
  private clientInstance: SupabaseClient;
  private serviceInstance: SupabaseClient;

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getClient() {
    this.clientInstance = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
      {
        auth: {
          persistSession: true,
        },
        global: {
          headers: {
            Authorization: `Bearer ${
              ExtractJwt.fromAuthHeaderAsBearerToken() && this.request
                ? ExtractJwt.fromAuthHeaderAsBearerToken()(this.request)
                : ''
            }`,
          },
        },
      },
    );
    return this.clientInstance;
  }

  client() {
    return this.supabase;
  }

  async getAuthUser(client: any) {
    const authUser = await client.auth.getUser();
    const authId = authUser.data.user.id;
    const { data: user } = await client
      .from('users')
      .select('*')
      .eq('id', authId)
      .single();

    return user;
  }

  async getUserRole() {
    const client: any = (await this.getClient()) as any;
    const authUser = await client.auth.getUser();
    const { data, error } = await client
      .from('profiles')
      .select(
        '*, role(name), organization(id, name, definitions), team(id, name)',
      )
      .eq('id', authUser?.data?.user?.id)
      .single();
    if (error) {
      return error;
    }
    return {
      role: data.role.name,
      data: data,
    };
  }

  async getServiceRole() {
    this.serviceInstance = createClient(
      process.env.SUPABASE_URL,
      process.env.SERVICE_KEY,
    );
    return this.serviceInstance;
  }

  async checkInvestor(investor: any): Promise<any> {
    const client: any = await this.getServiceRole();
    const role = await this.getUserRole();
    const { data: user, error: userError } = await client
      .from('investors')
      .select('id')
      .eq('organization_user_id', investor.id)
      .eq('organization', role.data.organization.id);
    if (userError) {
      console.error('Bir hata oluştu:', userError);
      return;
    }
    if (user.length > 0) {
      return user[0].id;
    }
    const { data, error } = await client
      .from('investors')
      .insert([
        {
          name: investor.name,
          surname: investor.surname,
          full_name: investor.name + ' ' + investor.surname,
          username: investor.username || null,
          organization: role.data.organization.id,
          organization_user_id: investor.id,
          metadata: {
            email: investor.email ? investor.email : null,
            tc_number: investor.tc_number ? investor.tc_number : null,
            phone: investor.phone ? investor.phone : null,
            birth_date: investor.birth_date ? investor.birth_date : null,
          },
          creator: role.data.id,
        },
      ])
      .select('id');
    if (error) {
      console.error('Bir hata oluştu:', error);
      return;
    }
    return data[0].id;
  }
}
