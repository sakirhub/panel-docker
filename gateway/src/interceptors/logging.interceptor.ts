import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private client: ClientProxy;

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://rabbitmq:5672'],
        queue: 'log-queue',
        queueOptions: {
          durable: true,
        },
      },
    });
  }
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { method, url, ip, headers, user } = req;
    const sensitiveResponseUrls = ['/v1/integration/auth', '/supervisor/logs'];
    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - now;
        const contentLength = JSON.stringify(data).length;
        const _user = user ? user.session : 'Anonymous';

        const logMessage = {
          type: 'http',
          data: {
            ip,
            headers,
            method,
            url,
            statusCode: res.statusCode,
            reqBody:
              url === '/v1/integration/auth'
                ? {
                    app_key: req.body.app_key,
                    app_secret: '*********',
                  }
                : req.body,
            resBody: sensitiveResponseUrls.includes(url) ? {} : data,

            responseTime: `${responseTime}ms`,
            responseSize: `${contentLength} bytes`,
            _user,
          },
        };
        this.client.send('log_message', logMessage).subscribe();
      }),
    );
  }
  public sendLog(customLogMessage: any): void {
    this.client.send('log_message', customLogMessage).subscribe({
      error: (error) => console.error('Log sending error:', error),
    });
  }
}
