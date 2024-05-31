import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateBankAccountsDto {
  @IsString()
  name: string;
  @IsString()
  account_number: string;
  @IsString()
  min_limit: string;
  @IsString()
  max_limit: string;
  @IsString()
  daily_limit: string;
  @IsString()
  payment_method: string;
  @IsString()
  @IsOptional()
  team: string;
}
