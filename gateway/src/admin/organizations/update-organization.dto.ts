import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateOrganizationDto {
  @IsString()
  organization_id: string;
  @IsString()
  @IsOptional()
  name: string;
  @IsObject()
  @IsOptional()
  definitions: object;
  @IsString()
  @IsOptional()
  status: string;
}
