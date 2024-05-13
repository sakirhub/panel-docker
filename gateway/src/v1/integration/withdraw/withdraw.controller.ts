import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { WithdrawService } from './withdraw.service';
@Controller('/v1/integration/withdraw')
export class WithdrawController {
  constructor(private readonly withdrawService: WithdrawService) {}
  @Post()
  @HttpCode(HttpStatus.OK)
  async createWithdraw() {
    return this.withdrawService.createWithdraw();
  }
}
