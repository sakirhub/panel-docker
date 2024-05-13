import { Injectable } from '@nestjs/common';

@Injectable()
export class WithdrawService {
  async createWithdraw() {
    return {
      status: 'success',
    };
  }
}
