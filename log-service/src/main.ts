import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://rabbitmq:5672'],
        queue: 'log-queue',
        queueOptions: {
          durable: true,
        },
        noAck: false,
      },
    },
  );
  await app.listen();
}
bootstrap().then(() => console.log('Log service is running'));
