import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { Public } from '../../decorator/public.decorator';
@Controller('admin/investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get('all')
  async getAllInvestments(@Query() queryParams: string) {
    return this.investmentsService.getAllInvestments(queryParams);
  }

  @Get('pending')
  async getPendingInvestments(@Query() queryParams: string) {
    return this.investmentsService.getPendingInvestments(queryParams);
  }

  @Post('approve')
  async approveInvestment(@Body() body: any) {
    return this.investmentsService.approveInvestment(body);
  }

  @Post('reject')
  async rejectInvestment(@Body() body: any) {
    return this.investmentsService.rejectInvestment(body);
  }
}
