import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { TeamsModule } from './teams/teams.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';

@Module({
  imports: [UsersModule, OrganizationsModule, TeamsModule, BankAccountsModule],
})
export class AdminModule {}
