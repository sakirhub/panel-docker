import { IsObject, IsString } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  name: string;
  @IsString()
  daily_limit: string;
  @IsObject()
  definitions: any;
}
