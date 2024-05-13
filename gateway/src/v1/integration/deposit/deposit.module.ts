import { Module } from '@nestjs/common';
import { BankTransferModule } from './bank-transfer/bank-transfer.module';
import { PaparaModule } from './papara/papara.module';
import { StatusModule } from './status/status.module';

@Module({
  controllers: [],
  providers: [],
  imports: [BankTransferModule, PaparaModule, StatusModule],
})
export class DepositModule {}
