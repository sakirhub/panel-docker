import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { StatusService } from './status.service';
@Controller('/v1/integration/deposit/papara')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}
  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  async getStatus(@Param('id') id: string) {
    return this.statusService.getStatus(id);
  }
}
