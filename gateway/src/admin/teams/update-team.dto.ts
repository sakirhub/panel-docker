import { IsObject, IsString } from 'class-validator';

export class UpdateTeamDto {
  @IsString()
  id: string;
  @IsString()
  daily_limit: string;
  @IsObject()
  definitions: any;
}
