import { Injectable } from '@nestjs/common';
import { CreateWithdrawDto } from './create-withdraw.dto';

@Injectable()
export class WithdrawService {
  async createWithdraw(createWithdrawDto: CreateWithdrawDto) {
    return {
      status: 'success',
    };
  }
}
