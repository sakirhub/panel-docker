import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateWithdrawDto } from './create-withdraw.dto';
import { SupabaseService } from '../../../supabase/supabase.service';
@Injectable()
export class WithdrawService {
  constructor(private readonly supabaseService: SupabaseService) {}
  async createWithdraw(createWithdrawDto: CreateWithdrawDto) {
    const client: any = await this.supabaseService.getServiceRole();
    const role = await this.supabaseService.getUserRole();
    const investor = await this.supabaseService.checkInvestor(
      createWithdrawDto.user,
    );
    const withdrawData = {
      status: 'pending',
      transaction_id: createWithdrawDto.transaction_id,
      organization: role.data.organization.id,
      investor: investor,
      creator: role.data.id,
      type: createWithdrawDto.type,
      amount: createWithdrawDto.amount,
      account_name: createWithdrawDto.account_name,
      account_number: createWithdrawDto.account_number,
    };
    const { data: teams, error: teamsError } = await client
      .from('team_organizations')
      .select('*, team(id, name, status, withdraw_status)')
      .eq('organization', role.data.organization.id)
      .eq('team.withdraw_status', 'active')
      .eq('team.status', 'active');
    if (teamsError) {
      return new BadRequestException(teamsError).getResponse();
    }
    let randomTeam;
    for (let i = 0; i < teams.length; i++) {
      randomTeam = await teams[Math.floor(Math.random() * teams.length)];
      if (!randomTeam.team) {
        i--;
        continue;
      }
      if (randomTeam.team.withdraw_status === 'active') {
        break;
      }
    }
    if (!randomTeam) {
      return new BadRequestException('Bir hata oluştu').getResponse();
    }
    withdrawData['team'] = await randomTeam.team.id;
    const { error } = await client.from('withdraws').insert([withdrawData]);
    if (error) {
      return new BadRequestException(error).getResponse();
    }
    return {
      status: 'success',
    };
  }
}
