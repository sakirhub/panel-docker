import { IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  email: string;
  @IsString()
  display_name: string;
  @IsString()
  password: string;
  @IsString()
  @IsOptional()
  role: string;
  @IsString()
  @IsOptional()
  organization: string;
  @IsString()
  @IsOptional()
  team: string;
}
