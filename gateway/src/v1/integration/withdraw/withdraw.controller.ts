import { Controller, Post } from '@nestjs/common';
import { WithdrawService } from './withdraw.service';
@Controller('/v1/integration/withdraw')
export class WithdrawController {
  constructor(private readonly withdrawService: WithdrawService) {}
  @Post()
  async createWithdraw() {
    return this.withdrawService.createWithdraw();
  }
}
