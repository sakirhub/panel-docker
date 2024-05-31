import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './create-team.dto';
import { UpdateTeamDto } from './update-team.dto';
@Controller('admin/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}
  @Get()
  async findAll(@Query() queryParams: string) {
    return this.teamsService.findAll(queryParams);
  }

  @Post()
  async createTeam(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.createTeam(createTeamDto);
  }

  @Post('update')
  async updateTeam(@Body() updateTeamDto: UpdateTeamDto) {
    return this.teamsService.updateTeam(updateTeamDto);
  }
}
