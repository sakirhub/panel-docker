import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import {
  Payload,
  MessagePattern,
  Ctx,
  RmqContext,
} from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('log_message')
  async getNotifications(
    @Payload() data: number[],
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    await this.appService.createLog(data);
    channel.ack(originalMsg);
  }
}
