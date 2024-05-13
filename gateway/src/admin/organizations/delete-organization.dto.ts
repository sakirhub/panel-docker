import { IsString } from 'class-validator';

export class DeleteOrganizationDto {
  @IsString()
  organization_id: string;
}
