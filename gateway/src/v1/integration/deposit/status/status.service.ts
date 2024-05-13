import { Injectable } from '@nestjs/common';

@Injectable()
export class StatusService {
  async getStatus(id: string) {
    return {
      status: 'ok',
      payment_url: 'https://webhook.site/3398e34c-3f40-4a08-8981-35127c8922ff',
    };
  }
}
