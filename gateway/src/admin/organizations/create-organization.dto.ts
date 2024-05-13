import { IsObject, IsString } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  name: string;
  @IsString()
  api_key: string;
  @IsString()
  api_secret: string;
  @IsObject()
  definitions: string;
}
