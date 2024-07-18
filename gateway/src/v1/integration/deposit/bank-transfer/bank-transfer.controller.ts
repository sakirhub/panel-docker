import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { BankTransferService } from './bank-transfer.service';
import { CreateBankTransferDto } from './create-bank-transfer.dto';
import { CreateHavaleDto } from './create-havale-transfer.dto';
import { createVerifyDepositDto } from './create-verify.dto';
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

  @Post('havale')
  @HttpCode(HttpStatus.OK)
  async createHavale(@Body() createBankTransferDto: CreateHavaleDto) {
    return this.bankTransferService.createHavale(createBankTransferDto);
  }

  @Post('fast')
  @HttpCode(HttpStatus.OK)
  async createFast(@Body() createBankTransferDto: CreateHavaleDto) {
    return this.bankTransferService.createHavale(createBankTransferDto);
  }

  @Get('accounts')
  @HttpCode(HttpStatus.OK)
  async getBankAccounts() {
    return this.bankTransferService.getBankAccounts();
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyDeposit(@Body() createVerifyDepositDto: createVerifyDepositDto) {
    return this.bankTransferService.createVerifyDeposit(createVerifyDepositDto);
  }
}
