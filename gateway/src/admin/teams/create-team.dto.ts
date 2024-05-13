import { IsArray, IsNumber, IsObject, IsString } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  name: string;
  @IsNumber()
  daily_limit: number;
  @IsArray()
  organizations: any;
  @IsObject()
  definitions: any;
}
