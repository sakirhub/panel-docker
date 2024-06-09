import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateTeamDto } from './create-team.dto';
import { LoggingInterceptor } from '../../interceptors/logging.interceptor';
import { UpdateTeamDto } from './update-team.dto';
@Injectable()
export class TeamsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(queryParams: any) {
    const role = await this.supabaseService.getUserRole();
    const client = await this.supabaseService.getServiceRole();
    if (
      role.role !== 'supervisor' &&
      role.role !== 'admin' &&
      role.role !== 'ekip'
    ) {
      return new ForbiddenException(
        'You are not authorized to access this resource',
      ).getResponse();
    }
    const teams = client
      .from('teams')
      .select('*, creator(display_name)')
      .order('created_at', { ascending: true })
      .limit(queryParams?.limit || 20);

    if (queryParams?.page) {
      teams.range(
        (queryParams?.page - 1) * (queryParams?.limit || 20),
        queryParams?.page * (queryParams?.limit || 20),
      );
    } else {
      teams.range(0, queryParams?.limit || 20);
    }
    if (queryParams?.search) {
      teams.ilike('name', `%${queryParams.name}%`);
    }
    const { data, error } = await teams;
    if (error) {
      return new InternalServerErrorException(error.message).getResponse();
    }
    const { data: countData } = await client.from('teams').select('id');
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

  async createTeam(createTeamDto: CreateTeamDto) {
    const loggingInterceptor = new LoggingInterceptor();
    const role = await this.supabaseService.getUserRole();
    const client = await this.supabaseService.getServiceRole();
    if (role.role !== 'supervisor') {
      return new ForbiddenException(
        'You are not authorized to access this resource',
      ).getResponse();
    }
    const insertData = {
      ...createTeamDto,
      status: 'active',
      creator: role.data.id,
    };
    const { data, error } = await client
      .from('teams')
      .insert([insertData])
      .select('*')
      .single();
    if (error) {
      return new InternalServerErrorException(error.message).getResponse();
    }
    loggingInterceptor.sendLog({
      type: 'team',
      data: {
        action: 'create',
        description: `${data.name} takımı ${role.data.name} tarafından oluşturuldu.`,
        team: data.id,
        creator: role.data.id,
      },
    });
    return data;
  }

  async updateTeam(updateTeamDto: UpdateTeamDto) {
    const loggingInterceptor = new LoggingInterceptor();
    const role = await this.supabaseService.getUserRole();
    const client = await this.supabaseService.getServiceRole();
    if (role.role !== 'supervisor') {
      return new ForbiddenException(
        'You are not authorized to access this resource',
      ).getResponse();
    }
    const updateData = {
      ...updateTeamDto,
      status: 'active',
      creator: role.data.id,
    };
    const { data, error } = await client
      .from('teams')
      .update(updateData)
      .eq('id', updateTeamDto.id)
      .select('*')
      .single();
    if (error) {
      return new InternalServerErrorException(error.message).getResponse();
    }
    loggingInterceptor.sendLog({
      type: 'team',
      data: {
        action: 'update',
        description: `${data.name} takımı ${role.data.name} tarafından güncellendi.`,
        team: data.id,
        creator: role.data.id,
      },
    });
    return data;
  }
}
