import { Body, Controller, Post } from '@nestjs/common';
import { VerifyService } from './verify.service';
import { Public } from '../../../decorator/public.decorator';
@Controller('v1/integration/verify')
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}
  @Public()
  @Post()
  async verify(@Body() body: any) {
    return this.verifyService.verify(body);
  }
}
