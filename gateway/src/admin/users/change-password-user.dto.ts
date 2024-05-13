import { IsString } from 'class-validator';

export class ChangePasswordUserDto {
  @IsString()
  user_id: string;
  @IsString()
  password: string;
}
