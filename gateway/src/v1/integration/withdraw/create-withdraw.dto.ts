import { IsObject, IsString } from 'class-validator';

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
  amount: string;
  @IsObject()
  user: {
    id: string;
    name: string;
    surname: string;
    username: string;
  };
}
