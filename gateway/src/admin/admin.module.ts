import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [UsersModule, OrganizationsModule, TeamsModule],
})
export class AdminModule {}
