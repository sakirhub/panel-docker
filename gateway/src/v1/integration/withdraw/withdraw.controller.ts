import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { WithdrawService } from './withdraw.service';
import { CreateWithdrawDto } from './create-withdraw.dto';
@Controller('/v1/integration/withdraw')
export class WithdrawController {
  constructor(private readonly withdrawService: WithdrawService) {}
  @Post()
  @HttpCode(HttpStatus.OK)
  async createWithdraw(@Body() createWithdrawDto: CreateWithdrawDto) {
    return this.withdrawService.createWithdraw(createWithdrawDto);
  }
}
