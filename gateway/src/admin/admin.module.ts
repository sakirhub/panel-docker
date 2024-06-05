import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { TeamsModule } from './teams/teams.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { InvestmentsModule } from './investments/investments.module';
import { WithdrawsModule } from './withdraws/withdraws.module';

@Module({
  imports: [
    UsersModule,
    OrganizationsModule,
    TeamsModule,
    BankAccountsModule,
    InvestmentsModule,
    WithdrawsModule,
  ],
})
export class AdminModule {}
