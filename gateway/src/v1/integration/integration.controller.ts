import { Body, Controller, Get, Post } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { Public } from '../../decorator/public.decorator';
@Controller('v1/integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}
  @Public()
  @Post('verify')
  async verify(@Body() body: any) {
    return this.integrationService.verify(body);
  }

  @Get('payment-methods')
  async getPaymentMethods() {
    return this.integrationService.getPaymentMethods();
  }
}
