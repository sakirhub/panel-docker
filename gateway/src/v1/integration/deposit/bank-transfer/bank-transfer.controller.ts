import { Body, Controller, Post } from '@nestjs/common';
import { BankTransferService } from './bank-transfer.service';
import { CreateBankTransferDto } from './create-bank-transfer.dto';
@Controller('/v1/integration/deposit/bank-transfer')
export class BankTransferController {
  constructor(private readonly bankTransferService: BankTransferService) {}

  @Post()
  async createBankTransfer(
    @Body() createBankTransferDto: CreateBankTransferDto,
  ) {
    return this.bankTransferService.createBankTransfer(createBankTransferDto);
  }
}
