import { Controller, Get, Param } from '@nestjs/common';
import { StatusService } from './status.service';
@Controller('/v1/integration/deposit/papara')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}
  @Get('/:id')
  async getStatus(@Param('id') id: string) {
    return this.statusService.getStatus(id);
  }
}
