import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { BankTransferService } from './bank-transfer.service';
import { CreateBankTransferDto } from './create-bank-transfer.dto';
@Controller('/v1/integration/deposit/bank-transfer')
export class BankTransferController {
  constructor(private readonly bankTransferService: BankTransferService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async createBankTransfer(
    @Body() createBankTransferDto: CreateBankTransferDto,
  ) {
    return this.bankTransferService.createBankTransfer(createBankTransferDto);
  }
}
