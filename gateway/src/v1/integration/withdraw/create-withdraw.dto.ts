import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateWithdrawDto {
  @IsString()
  type: string;
  @IsString()
  transaction_id: string;
  @IsString()
  account_name: string;
  @IsString()
  account_number: string;
  @IsString()
  amount: string | number;
  @IsObject()
  user: {
    id: string;
    name: string;
    surname: string;
    username: string;
  };
  @IsOptional()
  success_url: string;
  @IsOptional()
  fail_url: string;
  @IsOptional()
  currency: string;
}
