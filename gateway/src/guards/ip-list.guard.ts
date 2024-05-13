import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as ip from 'ip';

@Injectable()
export class IpRangeWhitelistGuard implements CanActivate {
  private readonly allowedRanges: string[];

  constructor() {
    this.allowedRanges = [
      '192.168.1.0/24', // 192.168.1.0 - 192.168.1.255
      '123.456.78.0/28', // 123.456.78.0 - 123.456.78.15
      '192.168.65.1', // IPv6
    ];
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const clientIp = request.ip;

    const isAllowed = this.allowedRanges.some((range) =>
      ip.cidrSubnet(range).contains(clientIp),
    );

    if (isAllowed) {
      return true;
    } else {
      throw new HttpException(
        'Unauthorized IP Address',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
