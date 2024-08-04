import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountsDto } from './create-bank-accounts.dto';
import { Public } from '../../decorator/public.decorator';
@Controller('admin/bank-accounts')
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}
  @Get()
  async findAll(@Query() queryParams: string) {
    return this.bankAccountsService.findAll(queryParams);
  }

  @Get('auto')
  async findAllAuto(@Query() queryParams: string) {
    return this.bankAccountsService.findAllAuto(queryParams);
  }

  @Post()
  async create(@Body() createBankAccountsDto: CreateBankAccountsDto) {
    return this.bankAccountsService.create(createBankAccountsDto);
  }

  @Post('account-details')
  @Public()
  async getAccountDetails(@Body() body: any) {
    return this.bankAccountsService.postAccountDetails(body);
  }

  @Post('login')
  @Public()
  async login(@Body() body: any) {
    return this.bankAccountsService.loginAccount(body);
  }

  @Post('logout')
  @Public()
  async logout(@Body() body: any) {
    return this.bankAccountsService.logoutAccount(body);
  }

  @Get('details')
  async getDetails(@Query() queryParams: string) {
    return this.bankAccountsService.getAccountDetails(queryParams);
  }
}
