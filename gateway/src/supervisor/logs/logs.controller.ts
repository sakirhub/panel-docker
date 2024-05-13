import { Controller, Get, Query } from '@nestjs/common';
import { LogsService } from './logs.service';
@Controller('supervisor/logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  getLogs(@Query() queryParams: string): Promise<any> {
    return this.logsService.getLogs(queryParams);
  }
}
