import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../../../supabase/supabase.service';
@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}
  async login(loginAuthDto: any): Promise<any> {
    try {
      const { app_key, app_secret } = loginAuthDto;
      const { data, error } = await this.supabaseService
        .client()
        .auth.signInWithPassword({ email: app_key, password: app_secret });
      if (error) {
        throw new BadRequestException(error.message).getResponse();
      }

      const client: any = (await this.supabaseService.getServiceRole()) as any;
      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (profileError) {
        throw new BadRequestException(profileError.message).getResponse();
      }
      if (profile.status !== 'active') {
        throw new BadRequestException(
          'Your account is not active! Please contact the administrator.',
        ).getResponse();
      }
      await client
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);
      return {
        token: data.session.access_token,
        expires: new Date(data.session.expires_at * 1000).toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message).getResponse();
    }
  }

  async status(): Promise<any> {
    const client: any = (await this.supabaseService.getClient()) as any;
    const authUser = await client.auth.getUser();
    return {
      status: 'authenticated',
      last_sign_in_at: authUser?.data?.user?.last_sign_in_at,
    };
  }

  async getRole(): Promise<any> {
    const client: any = (await this.supabaseService.getClient()) as any;
    const authUser = await client.auth.getUser();
    const { data, error } = await client
      .from('profiles')
      .select('role(name)')
      .eq('id', authUser?.data?.user?.id)
      .single();
    if (error) {
      return new BadRequestException(error.message).getResponse();
    }
    return data.role.name;
  }

  async logout(): Promise<any> {
    const client: any = (await this.supabaseService.getClient()) as any;
    await client.auth.signOut();
    return { status: 'logged out' };
  }
}
