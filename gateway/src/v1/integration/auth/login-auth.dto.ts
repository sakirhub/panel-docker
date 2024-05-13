import { IsString } from 'class-validator';
export class LoginAuthDto {
  @IsString()
  app_key: string;
  @IsString()
  app_secret: string;
}
