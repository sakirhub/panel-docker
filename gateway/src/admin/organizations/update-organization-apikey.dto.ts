import { IsString } from 'class-validator';

export class UpdateOrganizationApikeyDto {
  @IsString()
  organization_id: string;
  @IsString()
  api_key: string;
  @IsString()
  api_secret: string;
}
