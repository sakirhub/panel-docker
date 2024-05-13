import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateTeamDto } from './create-team.dto';
import { LoggingInterceptor } from '../../interceptors/logging.interceptor';
@Injectable()
export class TeamsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(queryParams: any) {
    const role = await this.supabaseService.getUserRole();
    const client = await this.supabaseService.getServiceRole();
    if (role.role !== 'supervisor') {
      return new ForbiddenException(
        'You are not authorized to access this resource',
      ).getResponse();
    }
    const teams = client
      .from('teams')
      .select('*')
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
    if (queryParams?.status) {
      teams.eq('status', queryParams.status);
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
        current_page: queryParams?.page || 1,
        limit: queryParams?.limit || 20,
        prev_page: queryParams?.page > 1 ? queryParams.page - 1 : null,
        next_page: queryParams?.page < total_page ? queryParams.page + 1 : null,
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
}
