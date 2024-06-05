import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
@Controller('admin/investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get('pending')
  async getPendingInvestments(@Query() queryParams: string) {
    return this.investmentsService.getPendingInvestments(queryParams);
  }

  @Post('approve')
  async approveInvestment(@Body() body: any) {
    return this.investmentsService.approveInvestment(body);
  }
}
