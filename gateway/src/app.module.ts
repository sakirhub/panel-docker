import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { SupabaseModule } from './supabase/supabase.module';
import { V1Module } from './v1/v1.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SupabaseGuard } from './supabase/supabase.guard';
import { SupervisorModule } from './supervisor/supervisor.module';
import { SupabaseService } from './supabase/supabase.service';
import { AuthService } from './v1/integration/auth/auth.service';
import { AdminModule } from './admin/admin.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '1d' },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 200,
      },
    ]),
    SupabaseModule,
    V1Module,
    SupervisorModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    SupabaseService,
    AuthService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: SupabaseGuard,
    },
    /*
    {
      provide: APP_GUARD,
      useClass: IpRangeWhitelistGuard,
    },
    */
    AppService,
  ],
})
export class AppModule {}
