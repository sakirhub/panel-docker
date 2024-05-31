import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateBankTransferDto {
  @IsString()
  transaction_id: string;
  @IsObject()
  user: {
    id: string;
    name: string;
    surname: string;
    username: string;
  };
  @IsOptional()
  @IsString()
  redirect_url: string;
}
