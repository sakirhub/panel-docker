import { IsString } from 'class-validator';

export class RemoveMfaUserDto {
  @IsString()
  user_id: string;
}
