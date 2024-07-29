import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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
        urls: [process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672'],
        queue: 'log-queue',
        queueOptions: {
          durable: true,
        },
        socketOptions: {
          heartbeatIntervalInSeconds: 30,
        },
      },
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { method, url, ip, headers, user } = req;
    const sensitiveResponseUrls = [
      '/v1/integration/deposit/bank-transfer',
      '/v1/integration/deposit/bank-transfer/havale',
      '/v1/integration/deposit/papara',
      '/v1/integration/deposit/bank-transfer/verify',
      '/v1/integration/deposit/bank-transfer/accounts',
      '/v1/integration/withdraw',
      '/v1/integration/auth',
    ];

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - now;
        const contentLength = JSON.stringify(data).length;
        const _user = user ? user.session : 'Anonymous';

        const logMessage = {
          type: 'http',
          data: {
            ip: headers['x-real-ip'] || ip,
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
            resBody: sensitiveResponseUrls.includes(url)
              ? method == 'POST'
                ? data
                : {}
              : {},
            responseTime: `${responseTime}ms`,
            responseSize: `${contentLength} bytes`,
            _user,
          },
        };
        if (sensitiveResponseUrls.includes(url)) {
          this.client.send('log_message', logMessage).subscribe({
            error: (error) => console.error('Log sending error:', error),
          });
        }
      }),
      catchError((error) => {
        const responseTime = Date.now() - now;
        const errorLogMessage = {
          type: 'http_error',
          data: {
            ip: headers['x-real-ip'] || ip,
            headers,
            method,
            url,
            reqBody: req.body,
            resBody: JSON.stringify(error),
            statusCode: error.statusCode || 500,
            errorMessage: error.message,
            responseTime: `${responseTime}ms`,
            _user: user ? user.session : 'Anonymous',
          },
        };
        this.client.send('log_message', errorLogMessage).subscribe({
          error: (logError) => console.error('Log sending error:', logError),
        });
        return throwError(() => error);
      }),
    );
  }

  public sendLog(customLogMessage: any): void {
    this.client.send('log_message', customLogMessage).subscribe({
      error: (error) => console.error('Log sending error:', error),
    });
  }
}
