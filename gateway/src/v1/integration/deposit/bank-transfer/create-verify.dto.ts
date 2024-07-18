import { IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';

export class createVerifyDepositDto {
  @IsString()
  @IsNotEmpty()
  bank_account_id: string;

  @IsString()
  @IsNotEmpty()
  transaction_id: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsObject()
  @IsNotEmpty()
  user: {
    user_id: string;
    name: string;
    surname: string;
    username: string;
  };
}
