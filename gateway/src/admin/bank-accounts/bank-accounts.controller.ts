import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountsDto } from './create-bank-accounts.dto';
@Controller('admin/bank-accounts')
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}
  @Get()
  async findAll(@Query() queryParams: string) {
    return this.bankAccountsService.findAll(queryParams);
  }

  @Post()
  async create(@Body() createBankAccountsDto: CreateBankAccountsDto) {
    return this.bankAccountsService.create(createBankAccountsDto);
  }
}
