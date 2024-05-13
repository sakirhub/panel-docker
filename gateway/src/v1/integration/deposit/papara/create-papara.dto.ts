import { IsObject, IsString } from 'class-validator';

export class CreatePaparaDto {
  @IsString()
  transaction_id: string;
  @IsObject()
  user: {
    id: string;
    name: string;
    surname: string;
    username: string;
  };
}
