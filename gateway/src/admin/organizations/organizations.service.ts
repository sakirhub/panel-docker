import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { LoggingInterceptor } from '../../interceptors/logging.interceptor';
import { UpdateOrganizationApikeyDto } from './update-organization-apikey.dto';
import { DeleteOrganizationDto } from './delete-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private supabaseService: SupabaseService) {}
  private async checkRole() {
    const role = await this.supabaseService.getUserRole();
    if (role.role !== 'supervisor') {
      return new BadRequestException(
        'You are not authorized to access this resource',
      ).getResponse();
    }
  }

  async findAll(queryParams: any) {
    await this.checkRole();
    const client = await this.supabaseService.getServiceRole();
    const organizations = client.from('organizations').select('*');
    if (queryParams?.page) {
      organizations.range(
        (queryParams.page - 1) * (queryParams.limit || 20),
        queryParams.page * (queryParams.limit || 20),
      );
    } else {
      organizations.range(0, queryParams.limit || 20);
    }
    if (queryParams?.limit) {
      organizations.limit(queryParams.limit);
    } else {
      organizations.limit(20);
    }
    const { data, error } = await organizations;
    if (error) {
      return new BadRequestException(error.message).getResponse();
    }
    const { data: countData } = await client.from('organizations').select('id');
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

  async createOrganization(createOrganizationDto: any) {
    const loggingInterceptor = new LoggingInterceptor();
    await this.checkRole();
    const role = await this.supabaseService.getUserRole();
    const client = await this.supabaseService.getServiceRole();
    const insertData = {
      name: createOrganizationDto.name,
      definitions: createOrganizationDto.definitions,
      creator: role.data.id,
      status: 'active',
    };
    const { data, error } = await client
      .from('organizations')
      .insert([insertData])
      .select('*')
      .single();
    if (error) {
      console.log('Buraya girdi');
      return new BadRequestException(error.message).getResponse();
    }
    const apiUserData = {
      id: '',
      email: createOrganizationDto.api_key,
      password: createOrganizationDto.api_secret,
      role: 'fa90ce6e-67d7-4863-99a6-3e281caa0b1a',
      team: null,
      organization: data.id,
      creator: role.data.id,
      status: 'active',
      display_name: data.name + ' API User',
    };
    const { data: createUser, error: createUserError } =
      await client.auth.admin.createUser({
        email: apiUserData.email,
        password: apiUserData.password,
        email_confirm: true,
      });
    if (createUserError) {
      return new InternalServerErrorException(
        createUserError.message,
      ).getResponse();
    }
    apiUserData.id = createUser.user.id;
    apiUserData.creator = role.data.id;
    delete apiUserData.password;
    const { error: profileError } = await client
      .from('profiles')
      .insert([apiUserData])
      .select('*, role(name, description)')
      .single();
    if (profileError) {
      return new InternalServerErrorException(
        profileError.message,
      ).getResponse();
    }
    loggingInterceptor.sendLog({
      type: 'organization',
      data: {
        action: 'create',
        description: `${data.name} organizasyonu ${role.data.email} tarafından oluşturuldu.`,
        organization: data.id,
        creator: role.data.id,
      },
    });
    return { data: data };
  }

  async updateOrganization(updateOrganizationDto: any) {
    const loggingInterceptor = new LoggingInterceptor();
    await this.checkRole();
    const role = await this.supabaseService.getUserRole();
    const client = await this.supabaseService.getServiceRole();
    const { data: organization, error: organizationError } = await client
      .from('organizations')
      .select('*')
      .eq('id', updateOrganizationDto.organization_id)
      .single();
    if (organizationError) {
      return new BadRequestException(organizationError.message).getResponse();
    }
    const updateData = {
      name: updateOrganizationDto.name || organization.name,
      definitions:
        updateOrganizationDto.definitions || organization.definitions,
      status: updateOrganizationDto.status || organization.status,
    };
    const { data, error } = await client
      .from('organizations')
      .update(updateData)
      .eq('id', updateOrganizationDto.organization_id)
      .select('*')
      .single();
    if (error) {
      return new BadRequestException(error.message).getResponse();
    }
    loggingInterceptor.sendLog({
      type: 'organization',
      data: {
        action: 'update',
        description: `${data.name} organizasyonu ${role.data.email} tarafından güncellendi.`,
        organization: data.id,
        creator: role.data.id,
      },
    });
    return { data: data };
  }

  async updateOrganizationStatus(updateOrganizationDto: any) {
    const loggingInterceptor = new LoggingInterceptor();
    await this.checkRole();
    const role = await this.supabaseService.getUserRole();
    const client = await this.supabaseService.getServiceRole();
    const { data: organization, error: organizationError } = await client
      .from('organizations')
      .select('*')
      .eq('id', updateOrganizationDto.organization_id)
      .single();
    if (organizationError) {
      return new BadRequestException(organizationError.message).getResponse();
    }
    const updateData = {
      status: organization.status === 'active' ? 'inactive' : 'active',
    };
    const { data, error } = await client
      .from('organizations')
      .update(updateData)
      .eq('id', updateOrganizationDto.organization_id)
      .select('*')
      .single();
    if (error) {
      return new BadRequestException(error.message).getResponse();
    }
    loggingInterceptor.sendLog({
      type: 'organization',
      data: {
        action: 'update',
        description: `${data.name} organizasyonu ${role.data.email} tarafından durumu güncellendi.`,
        organization: data.id,
        creator: role.data.id,
      },
    });
    return { data: data };
  }

  async updateOrganizationApikey(
    updateOrganizationApikeyDto: UpdateOrganizationApikeyDto,
  ) {
    const loggingInterceptor = new LoggingInterceptor();
    await this.checkRole();
    const role = await this.supabaseService.getUserRole();
    const client = await this.supabaseService.getServiceRole();
    const { data: organization, error: organizationError } = await client
      .from('organizations')
      .select('*')
      .eq('id', updateOrganizationApikeyDto.organization_id)
      .single();
    if (organizationError) {
      return new BadRequestException(organizationError.message).getResponse();
    }
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('*, role(name, description)')
      .eq('organization', updateOrganizationApikeyDto.organization_id)
      .eq('role', 'fa90ce6e-67d7-4863-99a6-3e281caa0b1a')
      .single();
    if (profileError) {
      return new InternalServerErrorException(
        profileError.message,
      ).getResponse();
    }
    const updateData = {
      email: updateOrganizationApikeyDto.api_key,
      password: updateOrganizationApikeyDto.api_secret,
    };
    const { error } = await client.auth.admin.updateUserById(profile.id, {
      email: updateData.email,
      password: updateData.password,
    });
    if (error) {
      return new BadRequestException(error.message).getResponse();
    }
    const { error: updatedProfileError } = await client
      .from('profiles')
      .update({
        email: updateData.email,
      })
      .eq('id', profile.id)
      .select('*, role(name, description)')
      .single();
    if (updatedProfileError) {
      return new InternalServerErrorException(
        updatedProfileError.message,
      ).getResponse();
    }
    loggingInterceptor.sendLog({
      type: 'organization',
      data: {
        action: 'update apikey',
        description: `${organization.name} organizasyonu ${role.data.email} tarafından API bilgileri güncellendi.`,
        organization: organization.id,
        creator: role.data.id,
      },
    });
    return { data: 'API Key updated' };
  }

  async deleteOrganization(deleteOrganizationDto: DeleteOrganizationDto) {
    const loggingInterceptor = new LoggingInterceptor();
    await this.checkRole();
    const role = await this.supabaseService.getUserRole();
    const client = await this.supabaseService.getServiceRole();
    const { data: organization, error: organizationError } = await client
      .from('organizations')
      .select('*')
      .eq('id', deleteOrganizationDto.organization_id)
      .single();
    if (organizationError) {
      return new BadRequestException(organizationError.message).getResponse();
    }
    const { error } = await client
      .from('organizations')
      .delete()
      .eq('id', deleteOrganizationDto.organization_id);
    if (error) {
      return new BadRequestException(error.message).getResponse();
    }
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('*, role(name, description)')
      .eq('organization', deleteOrganizationDto.organization_id)
      .eq('role', 'fa90ce6e-67d7-4863-99a6-3e281caa0b1a')
      .single();
    if (profileError) {
      return new InternalServerErrorException(
        profileError.message,
      ).getResponse();
    }
    const { error: userError } = await client.auth.admin.deleteUser(profile.id);
    if (userError) {
      return new InternalServerErrorException(userError.message).getResponse();
    }
    const { error: deleteProfileError } = await client
      .from('profiles')
      .delete()
      .eq('id', profile.id);
    if (deleteProfileError) {
      return new InternalServerErrorException(
        deleteProfileError.message,
      ).getResponse();
    }
    loggingInterceptor.sendLog({
      type: 'organization',
      data: {
        action: 'delete',
        description: `${organization.name} organizasyonu ${role.data.email} tarafından silindi.`,
        organization: organization.id,
        creator: role.data.id,
      },
    });
    return { data: 'Organization deleted' };
  }
}
