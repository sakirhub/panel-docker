import { Module } from '@nestjs/common';
import { IntegrationModule } from './integration/integration.module';

@Module({
  imports: [IntegrationModule],
  controllers: [],
  providers: [],
})
export class V1Module {}
