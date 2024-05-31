import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateUserDto } from './create-user.dto';
import { LoggingInterceptor } from '../../interceptors/logging.interceptor';
import { ChangePasswordUserDto } from './change-password-user.dto';
import { RemoveMfaUserDto } from './remove-mfa-user.dto';
@Injectable()
export class UsersService {
  constructor(private supabaseService: SupabaseService) {}
  async findAll(queryParams: any) {
    const role = await this.supabaseService.getUserRole();
    const client = await this.supabaseService.getServiceRole();
    const profile = client
      .from('profiles')
      .select(
        '*, role(name, description), team(name), organization(name), creator(display_name)',
      )
      .limit(queryParams?.limit || 20)
      .order('created_at', { ascending: false })
      .neq('id', role.data.id)
      .neq('role', 'fa90ce6e-67d7-4863-99a6-3e281caa0b1a');

    if (queryParams?.page) {
      profile.range(
        (queryParams.page - 1) * (queryParams.limit || 20),
        queryParams.page * (queryParams.limit || 20),
      );
    } else {
      profile.range(0, queryParams.limit || 20);
    }
    if (queryParams?.limit) {
      profile.limit(queryParams.limit);
    } else {
      profile.limit(20);
    }
    switch (role.role) {
      case 'supervisor':
        break;
      case 'organization-admin':
        profile.eq('organization', role.data.organization);
        break;
      case 'team-admin':
        profile.eq('team', role.data.team);
        break;
      default:
        return new ForbiddenException(
          'You are not authorized to access this resource',
        ).getResponse();
    }
    const { data, error } = await profile;
    if (error) {
      return new InternalServerErrorException(error.message).getResponse();
    }
    const { data: countData } = await client.from('profiles').select('id');
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

  async createUser(createUserDto: CreateUserDto) {
    const loggingInterceptor = new LoggingInterceptor();
    const role = await this.supabaseService.getUserRole();
    const client = await this.supabaseService.getServiceRole();
    const insertData = {
      id: null,
      email: createUserDto.email,
      display_name: createUserDto.display_name,
      password: createUserDto.password,
      role: createUserDto.role,
      team: createUserDto.team || null,
      organization: createUserDto.organization || null,
      creator: null,
      status: 'active',
    };
    switch (role.role) {
      case 'supervisor':
        insertData.role = createUserDto.role;
        insertData.organization = createUserDto.organization || null;
        insertData.team = createUserDto.team || null;
        break;
      case 'organization-admin':
        insertData.role = 'cfdcb4b2-1a4a-4804-90d1-cd7eae4c9e9a';
        insertData.organization = role.data.organization;
        break;
      case 'team-admin':
        insertData.role = '50d7be94-e135-463f-91e8-e5db8a15db79';
        insertData.team = role.data.team;
        break;
      default:
        return new ForbiddenException(
          'You are not authorized to access this resource',
        ).getResponse();
    }

    const { data: createUser, error: createUserError } =
      await client.auth.admin.createUser({
        email: insertData.email,
        password: insertData.password,
        email_confirm: true,
      });
    if (createUserError) {
      return new InternalServerErrorException(
        createUserError.message,
      ).getResponse();
    }
    insertData.id = createUser.user.id;
    insertData.creator = role.data.id;
    delete insertData.password;
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .insert([insertData])
      .select('*, role(name, description)')
      .single();
    if (profileError) {
      return new InternalServerErrorException(
        profileError.message,
      ).getResponse();
    }
    loggingInterceptor.sendLog({
      type: 'user',
      data: {
        action: 'create_user',
        description: `${profile.display_name} kullanıcısı ${role.data.email} tarafından oluşturuldu.`,
        creator: role.data.id,
        user: profile.id,
      },
    });
    return { data: profile };
  }

  async changePassword(changePasswordDto: ChangePasswordUserDto) {
    const loggingInterceptor = new LoggingInterceptor();
    const role = await this.supabaseService.getUserRole();
    const client = await this.supabaseService.getServiceRole();
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('*, role(name, description)')
      .eq('id', changePasswordDto.user_id)
      .single();
    if (profileError) {
      return new InternalServerErrorException(
        profileError.message,
      ).getResponse();
    }
    switch (role.role) {
      case 'supervisor':
        break;
      case 'organization-admin':
        if (profile.organization !== role.data.organization) {
          return new ForbiddenException(
            'You are not authorized to access this resource',
          ).getResponse();
        }
        break;
      case 'team-admin':
        if (profile.team !== role.data.team) {
          return new ForbiddenException(
            'You are not authorized to access this resource',
          ).getResponse();
        }
        break;
      default:
        return new ForbiddenException(
          'You are not authorized to access this resource',
        ).getResponse();
    }
    const { error } = await client.auth.admin.updateUserById(
      changePasswordDto.user_id,
      {
        password: changePasswordDto.password,
      },
    );
    if (error) {
      return new InternalServerErrorException(error.message).getResponse();
    }
    loggingInterceptor.sendLog({
      type: 'user',
      data: {
        action: 'change_password',
        description: `${role.data.display_name} kullanıcısı ${profile.display_name} kullanıcısının şifresini değiştirdi.`,
        creator: role.data.id,
        user: profile.id,
      },
    });
    return { data: 'Password changed successfully' };
  }

  async mfaFactorList(user_id: string) {
    const role = await this.supabaseService.getUserRole();
    const client = await this.supabaseService.getServiceRole();
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('*, role(name, description)')
      .eq('id', user_id)
      .single();
    if (profileError) {
      return new InternalServerErrorException(
        profileError.message,
      ).getResponse();
    }
    switch (role.role) {
      case 'supervisor':
        break;
      case 'organization-admin':
        if (profile.organization !== role.data.organization) {
          return new ForbiddenException(
            'You are not authorized to access this resource',
          ).getResponse();
        }
        break;
      case 'team-admin':
        if (profile.team !== role.data.team) {
          return new ForbiddenException(
            'You are not authorized to access this resource',
          ).getResponse();
        }
        break;
      default:
        return new ForbiddenException(
          'You are not authorized to access this resource',
        ).getResponse();
    }
    const { data: factors, error: factorsError } =
      await client.auth.admin.mfa.listFactors({
        userId: user_id,
      });
    if (factorsError) {
      return new InternalServerErrorException(
        factorsError.message,
      ).getResponse();
    }
    return { data: factors };
  }

  async removeMfa(removeMfaUserDto: RemoveMfaUserDto) {
    const loggingInterceptor = new LoggingInterceptor();
    const role = await this.supabaseService.getUserRole();
    const client = await this.supabaseService.getServiceRole();
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('*, role(name, description)')
      .eq('id', removeMfaUserDto.user_id)
      .single();
    if (profileError) {
      return new InternalServerErrorException(
        profileError.message,
      ).getResponse();
    }
    switch (role.role) {
      case 'supervisor':
        break;
      case 'organization-admin':
        if (profile.organization !== role.data.organization) {
          return new ForbiddenException(
            'You are not authorized to access this resource',
          ).getResponse();
        }
        break;
      case 'team-admin':
        if (profile.team !== role.data.team) {
          return new ForbiddenException(
            'You are not authorized to access this resource',
          ).getResponse();
        }
        break;
      default:
        return new ForbiddenException(
          'You are not authorized to access this resource',
        ).getResponse();
    }
    const { data: factors, error: factorsError } =
      await client.auth.admin.mfa.listFactors({
        userId: removeMfaUserDto.user_id,
      });
    if (!factors?.factors?.length || factorsError) {
      return new InternalServerErrorException(
        factorsError.message,
      ).getResponse();
    }
    const { error: deleteError } = await client.auth.admin.mfa.deleteFactor({
      id: factors.factors[0].id,
      userId: removeMfaUserDto.user_id,
    });
    if (deleteError) {
      return new InternalServerErrorException(
        deleteError.message,
      ).getResponse();
    }
    loggingInterceptor.sendLog({
      type: 'user',
      data: {
        action: 'remove_mfa',
        description: `${role.data.display_name} kullanıcısı ${profile.display_name} kullanıcısının MFA ayarlarını kaldırdı.`,
        creator: role.data.id,
        user: profile.id,
      },
    });
    return { data: 'MFA removed successfully' };
  }

  async me() {
    const role = await this.supabaseService.getUserRole();
    return {
      user: role.data,
      role: role.role,
    };
  }
}
